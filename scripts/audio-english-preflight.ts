/**
 * Provider-free inventory for English narration sources.
 *
 * It composes the same English column as the reader, records the supplying layer for
 * every segment, and excludes unpublished project fills and substantive English gaps.
 * It never reads credentials, calls a provider, uploads, or writes audio.
 *
 *   npm run audio:english:preflight
 *   npm run audio:english:preflight -- --collection kn --output /tmp/kn-en.json
 *   npm run audio:english:preflight -- --require-ready
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { CollectionCode } from '../src/lib/canon/types';
import { COLLECTIONS, loadCatalog, loadLock } from '../src/lib/canon/load';
import { composeDocument } from '../src/lib/canon/document';
import { loadAudio } from '../src/lib/canon/audio';
import { englishCoverageFor } from '../src/lib/canon/reference';
import { contentMetaPathForLayer, resolveLayer } from '../src/lib/canon/layers';
import { manifestCommit, upstreamPublishes } from '../src/lib/canon/manifest';
import { englishAudioSource } from '../src/lib/canon/english-audio';

const args = process.argv.slice(2);
const usage = 'Usage: npm run audio:english:preflight -- [--collection dn|mn|sn|an|kn] [--output <path>] [--require-ready]';

function option(name: string): string | undefined {
  const index = args.indexOf(`--${name}`);
  return index < 0 ? undefined : args[index + 1];
}

if (args.includes('--help')) {
  console.log(usage);
  process.exit(0);
}

const collectionArg = option('collection');
const selectedCollections = collectionArg
  ? COLLECTIONS.filter((collection) => collection.code === collectionArg)
  : COLLECTIONS;
if (collectionArg && selectedCollections.length === 0) {
  console.error(`${usage}\nUnknown collection: ${collectionArg}`);
  process.exit(2);
}

const outputPath = option('output');
if (args.includes('--output') && !outputPath) {
  console.error(`${usage}\nMissing output path.`);
  process.exit(2);
}
const knownFlags = new Set(['--collection', '--output', '--require-ready', '--help']);
for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (!arg.startsWith('--')) {
    console.error(`${usage}\nUnexpected argument: ${arg}`);
    process.exit(2);
  }
  if (!knownFlags.has(arg)) {
    console.error(`${usage}\nUnknown option: ${arg}`);
    process.exit(2);
  }
  if ((arg === '--collection' || arg === '--output') && !args[i + 1]) {
    console.error(`${usage}\nMissing value for ${arg}.`);
    process.exit(2);
  }
  if (arg === '--collection' || arg === '--output') i += 1;
}

const lock = loadLock();
const manifestSha = manifestCommit();
const globalBlockers: string[] = [];
if (!manifestSha || manifestSha !== lock.commit) {
  globalBlockers.push('upstream manifest commit does not match the pinned source lock');
}

function sha256(file: string): string | null {
  if (!existsSync(file)) return null;
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

const records: Array<Record<string, unknown>> = [];
for (const definition of selectedCollections) {
  const collection = definition.code as CollectionCode;
  const catalog = loadCatalog(collection);
  for (const item of catalog.texts) {
    const document = composeDocument(collection, item.uid);
    const pali = resolveLayer('pali', collection, item.uid, { catalog });
    const sujato = resolveLayer('english-sujato', collection, item.uid, { catalog });
    const project = resolveLayer('english-project', collection, item.uid, { catalog });
    const coverage = englishCoverageFor(collection, item.uid);
    const projectStatus = project?.status ?? null;
    const source = englishAudioSource(document, projectStatus);
    const blockers = [...globalBlockers, ...source.blockers];

    if (!pali?.present) blockers.push('pinned Pāli root is not synced');
    if (!sujato?.upstreamPath) blockers.push('pinned English source path is unresolved');
    if (sujato?.upstreamPath) {
      const published = upstreamPublishes('english-sujato', sujato.upstreamPath);
      if (published === null) blockers.push('pinned English publication status is unknown');
      else if (published && !sujato.present) blockers.push('pinned English file is published upstream but not synced');
      else if (!published && sujato.present) blockers.push('English cache contains a file absent from the pinned upstream manifest');
    }
    if (project?.present && project.status === null) blockers.push('English project source has no editorial status');

    const overlappingProjectSegments = Object.entries(project?.segments ?? {})
      .filter(([id, value]) => value.trim() !== '' && (sujato?.segments[id] ?? '').trim() !== '')
      .map(([id]) => id);
    if (overlappingProjectSegments.length > 0) {
      blockers.push(`English project shadows Sujato at ${overlappingProjectSegments.join(', ')}`);
    }

    if (!coverage || !coverage.resolved) blockers.push('substantive English coverage cannot be resolved');

    let status: 'candidate' | 'no-english' | 'partial' | 'blocked';
    if (blockers.length > 0) status = 'blocked';
    else if (source.segments.length === 0) status = 'no-english';
    else if ((coverage?.substantiveWithoutEnglish ?? 0) > 0) status = 'partial';
    else status = 'candidate';

    const existingVietnameseOriginalAudioAvailable = status === 'candidate'
      && Boolean(loadAudio(document)?.versions.some((version) => version.id === 'original'));

    const usesSujato = source.source_segment_counts['english-sujato'] > 0;
    const usesProject = source.source_segment_counts['english-project'] > 0;
    const dependencies: Array<{ path: string; sha256: string }> = [];
    if (usesSujato && sujato?.upstreamPath && sujato.present) {
      const digest = sha256(sujato.file);
      if (digest) dependencies.push({ path: sujato.upstreamPath, sha256: digest });
    }
    if (usesProject && project?.contentPath) {
      const digest = sha256(project.contentPath);
      if (digest) dependencies.push({ path: project.contentPath.replace(`${process.cwd()}/`, ''), sha256: digest });
      const metaPath = contentMetaPathForLayer(project.layer, collection, item.uid);
      const metaDigest = metaPath ? sha256(metaPath) : null;
      if (metaPath && metaDigest) dependencies.push({ path: metaPath.replace(`${process.cwd()}/`, ''), sha256: metaDigest });
    }

    records.push({
      uid: item.uid,
      collection,
      status,
      english_segment_count: source.segments.length,
      english_characters: source.characters,
      english_words: source.words,
      substantive_pali_segments: coverage?.substantiveSegments ?? null,
      substantive_english_gaps: coverage?.substantiveWithoutEnglish ?? null,
      english_source_segment_counts: source.source_segment_counts,
      english_project_status: projectStatus,
      uses_sujato: usesSujato,
      uses_english_project: usesProject,
      resolved_english_sha256: source.source_sha256,
      existing_vietnamese_original_audio_available: existingVietnameseOriginalAudioAvailable,
      source_dependencies: dependencies,
      rights_review_required: usesSujato,
      blockers: [...new Set(blockers)],
    });
  }
}

const byCollection = Object.fromEntries(selectedCollections.map(({ code }) => {
  const group = records.filter((record) => record.collection === code);
  const count = (status: string) => group.filter((record) => record.status === status).length;
  return [code, {
    catalog_texts: group.length,
    candidates: count('candidate'),
    no_english: count('no-english'),
    partial: count('partial'),
    blocked: count('blocked'),
    using_sujato: group.filter((record) => record.uses_sujato).length,
    using_project_fill: group.filter((record) => record.uses_english_project).length,
    project_only: group.filter((record) => record.status === 'candidate' && !record.uses_sujato && record.uses_english_project).length,
    candidate_vietnamese_original_audio_available: group.filter((record) => record.status === 'candidate' && record.existing_vietnamese_original_audio_available).length,
    candidate_missing_vietnamese_original_audio: group.filter((record) => record.status === 'candidate' && !record.existing_vietnamese_original_audio_available).length,
    english_characters: group.reduce((sum, record) => sum + Number(record.english_characters), 0),
    english_words: group.reduce((sum, record) => sum + Number(record.english_words), 0),
  }];
}));

const report = {
  schema_version: 1,
  generated_at: new Date().toISOString(),
  source_commit: lock.commit,
  upstream_manifest_commit: manifestSha,
  scope: selectedCollections.map((collection) => collection.code),
  policy: 'resolved-english-column-v1',
  eligibility_rule: 'At least one resolved English segment and no missing English at substantive Pāli segments; project fills count only when published.',
  provider_calls: 0,
  uploads: 0,
  rights_gate: 'not assessed by this inventory; no provider or upload authorization implied',
  totals: {
    catalog_texts: records.length,
    candidates: records.filter((record) => record.status === 'candidate').length,
    no_english: records.filter((record) => record.status === 'no-english').length,
    partial: records.filter((record) => record.status === 'partial').length,
    blocked: records.filter((record) => record.status === 'blocked').length,
    english_characters: records.reduce((sum, record) => sum + Number(record.english_characters), 0),
    english_words: records.reduce((sum, record) => sum + Number(record.english_words), 0),
    candidate_vietnamese_original_audio_available: records.filter((record) => record.status === 'candidate' && record.existing_vietnamese_original_audio_available).length,
    candidate_missing_vietnamese_original_audio: records.filter((record) => record.status === 'candidate' && !record.existing_vietnamese_original_audio_available).length,
  },
  by_collection: byCollection,
  candidate_uids: records.filter((record) => record.status === 'candidate').map((record) => `${record.collection}/${record.uid}`),
  candidate_missing_vietnamese_original_audio_uids: records
    .filter((record) => record.status === 'candidate' && !record.existing_vietnamese_original_audio_available)
    .map((record) => `${record.collection}/${record.uid}`),
  excluded: records.filter((record) => record.status !== 'candidate'),
};

const json = `${JSON.stringify(report, null, 2)}\n`;
if (outputPath) {
  const resolved = path.resolve(outputPath);
  mkdirSync(path.dirname(resolved), { recursive: true });
  writeFileSync(resolved, json);
} else {
  process.stdout.write(json);
}

const blockedOrPartial = report.totals.blocked + report.totals.partial;
process.stderr.write(`English preflight: ${report.totals.candidates}/${report.totals.catalog_texts} candidates; ${report.totals.no_english} have no English; ${blockedOrPartial} blocked/partial; provider calls 0; uploads 0.\n`);
if (args.includes('--require-ready') && blockedOrPartial > 0) process.exitCode = 1;
