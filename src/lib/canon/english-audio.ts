import { createHash } from 'node:crypto';
import type { CanonDocument, CollectionCode } from './types';

export type EnglishAudioSourceLayer = 'english-sujato' | 'english-project';
export type EnglishAudioSourceStatus = 'ready' | 'no-english' | 'blocked';

export interface EnglishAudioSegment {
  id: string;
  text: string;
  source: EnglishAudioSourceLayer;
}

export interface EnglishAudioSource {
  schema_version: 1;
  policy: 'resolved-english-column-v1';
  uid: string;
  collection: CollectionCode;
  source_commit: string;
  status: EnglishAudioSourceStatus;
  segments: EnglishAudioSegment[];
  source_sha256: string | null;
  characters: number;
  words: number;
  source_segment_counts: Record<EnglishAudioSourceLayer, number>;
  blockers: string[];
}

/**
 * Build the English spoken source from the reader's resolved English column while
 * requiring project fills to be published. Sujato keeps precedence; a project fill
 * may supply a segment only when its own editorial status is `published`.
 */
export function englishAudioSource(
  document: Pick<CanonDocument, 'uid' | 'collection' | 'commit' | 'segments'>,
  englishProjectStatus: string | null,
): EnglishAudioSource {
  const segments: EnglishAudioSegment[] = [];
  const blockers: string[] = [];
  const seen = new Set<string>();
  const counts: Record<EnglishAudioSourceLayer, number> = {
    'english-sujato': 0,
    'english-project': 0,
  };

  for (const segment of document.segments) {
    const text = typeof segment.en === 'string' ? segment.en.trim() : '';
    if (!text) continue;

    if (seen.has(segment.id)) blockers.push(`duplicate English segment ID: ${segment.id}`);
    seen.add(segment.id);

    if (segment.enFrom !== 'english-sujato' && segment.enFrom !== 'english-project') {
      blockers.push(`English provenance missing or unsupported at ${segment.id}`);
      continue;
    }

    if (segment.enFrom === 'english-project' && englishProjectStatus !== 'published') {
      blockers.push(`project English is not published at ${segment.id}`);
      continue;
    }

    const source = segment.enFrom as EnglishAudioSourceLayer;
    segments.push({ id: segment.id, text, source });
    counts[source] += 1;
  }

  const characters = segments.reduce((sum, segment) => sum + segment.text.length, 0);
  const words = segments.reduce((sum, segment) => sum + segment.text.split(/\s+/u).filter(Boolean).length, 0);
  const status: EnglishAudioSourceStatus = blockers.length > 0
    ? 'blocked'
    : segments.length === 0
      ? 'no-english'
      : 'ready';
  const sourceIdentity = {
    schema_version: 1 as const,
    policy: 'resolved-english-column-v1' as const,
    uid: document.uid,
    collection: document.collection,
    source_commit: document.commit,
    segments: segments.map(({ id, text, source }) => [id, text, source] as const),
  };
  const source_sha256 = status === 'ready'
    ? createHash('sha256').update(JSON.stringify(sourceIdentity), 'utf8').digest('hex')
    : null;

  return {
    ...sourceIdentity,
    status,
    segments,
    source_sha256,
    characters,
    words,
    source_segment_counts: counts,
    blockers: [...new Set(blockers)],
  };
}

/** Hash the ordered spoken segments, including IDs and layer provenance. */
export function englishAudioTranscriptHash(source: EnglishAudioSource): string | null {
  if (source.status !== 'ready') return null;
  return createHash('sha256')
    .update(JSON.stringify(source.segments.map(({ id, text, source: layer }) => [id, text, layer])), 'utf8')
    .digest('hex');
}
