import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { validParts, type AudioPart } from '../audio/parts';
import type { AudioVersionPlayerData } from '../audio/types';
export type { AudioVersionId, AudioVersionPlayerData } from '../audio/types';
import type { CanonDocument } from './types';
import { englishAudioSource, englishAudioTranscriptHash, type EnglishAudioSourceLayer } from './english-audio';
import { contentMetaPathForLayer, resolveLayer } from './layers';
import { englishCoverageFor } from './reference';
import { loadLock } from './load';
import { manifestCommit, upstreamPublishes } from './manifest';
import {
  EXPLANATION_AUDIO_AUDIENCES,
  EXPLANATION_AUDIENCE_LABELS,
  explanationNarrationSource,
  type ExplanationAudioAudience,
} from './explanation-audio';

const REPOSITORY_ROOT = process.cwd();

export function narrationSource(document: CanonDocument) {
  const legacy = {
    summary: document.summary?.trim() ?? '',
    segments: document.segments.filter(segment => !segment.id.split(':')[1].startsWith('0.') && segment.vi?.trim())
      .map(segment => [segment.id, segment.vi!.trim()]),
  };
  // Keep the exact original JSON shape/order for all published MN/DN hashes.
  if (document.collection === 'mn' || document.collection === 'dn') return legacy;
  return { policy: 'title-scripture-v1', title: document.viTitle.trim(), ...legacy, summary: '' };
}
export function narrationHash(document: CanonDocument) {
  return createHash('sha256').update(JSON.stringify(narrationSource(document))).digest('hex');
}

export function hasAudioRegistration(uid: string) {
  return fs.existsSync(path.join(process.cwd(), 'content/audio', `${uid}.json`));
}

interface ExplanationAudioRegistration {
  uid: string;
  collection: 'mn' | 'dn';
  audience_variant: ExplanationAudioAudience;
  track_kind: 'explanation';
  transcript_policy: 'explanation-audience-v1';
  selected_review_id: string;
  review_date: string;
  content_hash: string;
  source_sha256: string;
  narration_profile_id: string;
  narration_profile_sha256: string;
  narration_profile: unknown;
  url: string;
  parts?: AudioPart[];
  duration_seconds: number;
  scripture_start_seconds: 0;
  sha256: string;
  bytes: number;
  upload_verified: true;
  public_range_verified: true;
  r2_full_sha256_verified: true;
  review_status: 'pending' | 'approved';
  asset_kind?: string;
  checksum_scope?: string;
  source_mp3?: { sha256: string; bytes: number; duration_seconds: number };
}

export interface SuttaAudio {
  uid: string;
  url: string;
  parts?: AudioPart[];
  source_sha256: string;
  duration_seconds: number;
  scripture_start_seconds: number;
  voice: string;
  review_status: 'pending' | 'approved';
  explanation_tracks?: Partial<Record<ExplanationAudioAudience, ExplanationAudioRegistration>>;
  versions: AudioVersionPlayerData[];
}

/** The only audio fields allowed into playlist HTML; never spread manifests. */
export type AudioPlayerData = Pick<SuttaAudio, 'uid' | 'url' | 'duration_seconds' | 'scripture_start_seconds' | 'review_status' | 'parts'>
  & { versions: AudioVersionPlayerData[] };
type AudioPlayerDataInput = Omit<AudioPlayerData, 'versions'> & { versions?: AudioVersionPlayerData[] };
export function audioPlayerData(entry: AudioPlayerDataInput): AudioPlayerData {
  const versions = entry.versions ?? [{
    id: 'original' as const, label: 'Kinh văn Việt 2026', description: 'Bản audio chuẩn hiện có.', kind: 'sutta' as const,
    url: entry.url, duration_seconds: entry.duration_seconds, scripture_start_seconds: entry.scripture_start_seconds,
    start_seconds: entry.scripture_start_seconds, review_status: entry.review_status,
    ...(entry.parts ? { parts: entry.parts } : {}),
  }];
  return {
    uid: entry.uid, url: entry.url,
    duration_seconds: entry.duration_seconds, scripture_start_seconds: entry.scripture_start_seconds,
    review_status: entry.review_status,
    ...(entry.parts ? { parts: entry.parts.map(part => ({ url: part.url, duration_seconds: part.duration_seconds })) } : {}),
    versions: versions.map(version => ({
      id: version.id, label: version.label, description: version.description, kind: version.kind, url: version.url,
      duration_seconds: version.duration_seconds, scripture_start_seconds: version.scripture_start_seconds,
      start_seconds: version.start_seconds, review_status: version.review_status,
      ...(version.parts ? { parts: version.parts.map(part => ({ url: part.url, duration_seconds: part.duration_seconds })) } : {}),
    })),
  };
}

type AudioAssetPart = AudioPart & { sha256?: string; bytes?: number };
type AudioAsset = {
  url: string;
  duration_seconds: number;
  parts?: AudioAssetPart[];
  asset_kind?: string;
  checksum_scope?: string;
  sha256?: string;
  bytes?: number;
};

export interface EnglishAudioRegistration extends AudioAsset {
  schema_version: 1;
  uid: string;
  collection: CanonDocument['collection'];
  language: 'en';
  track_kind: 'english-translation';
  transcript_policy: 'resolved-english-column-v1';
  source_commit: string;
  source_sha256: string;
  transcript_sha256: string;
  segment_sources: Array<{ id: string; source: EnglishAudioSourceLayer }>;
  source_dependencies: Array<{ path: string; sha256: string }>;
  /** Hash of English-fill metadata, including its published status and scorecard. */
  english_project_meta_sha256?: string | null;
  narration_profile_id: string;
  narration_profile_sha256: string;
  /** Required references to separate rights, provider, budget, sample, and distribution approvals. */
  approval_refs: {
    source_rights: string;
    provider_use: string;
    cost_ceiling: string;
    voice_sample: string;
    public_distribution: string;
  };
  upload_verified: true;
  public_range_verified: true;
  r2_full_sha256_verified: true;
  review_status: 'pending' | 'approved';
}

function validAudioAsset(entry: AudioAsset) {
  if (typeof entry.url !== 'string' || !/^https:\/\//.test(entry.url) || !entry.url.endsWith('.mp3')) return false;
  if (!Number.isFinite(entry.duration_seconds) || !(entry.duration_seconds > 0)) return false;
  if (entry.asset_kind === 'reading-parts-v1' && !entry.parts) return false;
  if (entry.parts) {
    if (entry.asset_kind !== 'reading-parts-v1' || entry.checksum_scope !== 'ordered-part-sha256-lines'
      || !Array.isArray(entry.parts) || entry.parts.some(part => !part || !/^[0-9a-f]{64}$/.test(part.sha256 ?? '') || !Number.isInteger(part.bytes) || !(part.bytes! > 0))
      || entry.bytes !== entry.parts.reduce((sum, part) => sum + part.bytes!, 0)
      || entry.sha256 !== createHash('sha256').update(entry.parts.map(part => part.sha256 + '\n').join('')).digest('hex')) return false;
  }
  return validParts(entry) && (entry.parts?.every(part => part.url.startsWith('https://')) ?? true);
}

function fileSha256(file: string): string | null {
  if (!fs.existsSync(file)) return null;
  return createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function repositoryPath(file: string): string {
  return path.relative(REPOSITORY_ROOT, file).split(path.sep).join('/');
}

export function englishAudioRegistrationVersion(
  source: ReturnType<typeof englishAudioSource>,
  registration: unknown,
  sourceDependencies: Array<{ path: string; sha256: string }>,
  englishProjectMetaSha256: string | null,
): AudioVersionPlayerData | null {
  if (source.status !== 'ready' || !source.source_sha256 || !registration || typeof registration !== 'object') return null;
  const entry = registration as EnglishAudioRegistration;
  const refs = entry.approval_refs;
  const approvalsPresent = refs && [refs.source_rights, refs.provider_use, refs.cost_ceiling,
    refs.voice_sample, refs.public_distribution].every(value => typeof value === 'string' && value.trim().length > 0);
  const partsWithinLimit = entry.parts
    ? entry.parts.length > 0 && entry.parts.every(part => Number.isFinite(part.duration_seconds)
      && part.duration_seconds > 0 && part.duration_seconds <= 30 * 60)
    : Number.isFinite(entry.duration_seconds) && entry.duration_seconds <= 30 * 60;
  const expectedSegmentSources = source.segments.map(({ id, source: layer }) => ({ id, source: layer }));

  if (entry.schema_version !== 1 || entry.uid !== source.uid || entry.collection !== source.collection
    || entry.language !== 'en' || entry.track_kind !== 'english-translation'
    || entry.transcript_policy !== 'resolved-english-column-v1'
    || entry.source_commit !== source.source_commit || entry.source_sha256 !== source.source_sha256
    || entry.transcript_sha256 !== englishAudioTranscriptHash(source)
    || JSON.stringify(entry.segment_sources) !== JSON.stringify(expectedSegmentSources)
    || JSON.stringify(entry.source_dependencies) !== JSON.stringify(sourceDependencies)
    || (entry.english_project_meta_sha256 ?? null) !== englishProjectMetaSha256
    || typeof entry.narration_profile_id !== 'string' || !entry.narration_profile_id.trim()
    || !/^[0-9a-f]{64}$/.test(entry.narration_profile_sha256 ?? '') || !approvalsPresent
    || !partsWithinLimit
    || entry.upload_verified !== true || entry.public_range_verified !== true || entry.r2_full_sha256_verified !== true
    || !['pending', 'approved'].includes(entry.review_status)
    || !/^[0-9a-f]{64}$/.test(entry.sha256 ?? '') || !Number.isInteger(entry.bytes) || !(entry.bytes! > 0)
    || !validAudioAsset(entry)) return null;

  return {
    id: 'english-standard',
    label: 'English translation',
    description: 'Standard audio of the resolved English translation.',
    kind: 'english',
    url: entry.url,
    duration_seconds: entry.duration_seconds,
    scripture_start_seconds: 0,
    start_seconds: 0,
    review_status: entry.review_status,
    ...(entry.parts ? { parts: entry.parts.map(part => ({ url: part.url, duration_seconds: part.duration_seconds })) } : {}),
  };
}

/** Load an English sidecar only while the exact resolved reader source is unchanged. */
export function loadEnglishAudioVersion(document: CanonDocument): AudioVersionPlayerData | null {
  if (document.status !== 'published') return null;
  const file = path.join(process.cwd(), 'content/audio/en', document.collection, `${document.uid}.json`);
  if (!fs.existsSync(file)) return null;

  try {
    const lock = loadLock();
    if (document.commit !== lock.commit || manifestCommit() !== lock.commit) return null;

    const pali = resolveLayer('pali', document.collection, document.uid);
    const project = resolveLayer('english-project', document.collection, document.uid);
    const sujato = resolveLayer('english-sujato', document.collection, document.uid);
    if (!pali?.present || !sujato?.upstreamPath) return null;
    const sujatoPublished = upstreamPublishes('english-sujato', sujato.upstreamPath);
    if (sujatoPublished === null || sujatoPublished !== sujato.present) return null;
    if (project?.present && project.status === null) return null;
    const overlap = Object.entries(project?.segments ?? {}).some(([id, text]) => text.trim() !== ''
      && (sujato.segments[id] ?? '').trim() !== '');
    if (overlap) return null;
    const coverage = englishCoverageFor(document.collection, document.uid);
    if (!coverage?.resolved || coverage.substantiveWithoutEnglish > 0) return null;

    const source = englishAudioSource(document, project?.status ?? null);
    if (source.status !== 'ready' || !source.source_sha256) return null;
    const entry = JSON.parse(fs.readFileSync(file, 'utf8')) as EnglishAudioRegistration;
    const usesSujato = source.source_segment_counts['english-sujato'] > 0;
    const usesProject = source.source_segment_counts['english-project'] > 0;
    const dependencies: Array<{ path: string; sha256: string }> = [];
    let projectMetaSha256: string | null = null;

    if (usesSujato) {
      const digest = sujato.present ? fileSha256(sujato.file) : null;
      if (!digest) return null;
      dependencies.push({ path: sujato.upstreamPath, sha256: digest });
    }

    if (usesProject) {
      if (!project?.present || !project.contentPath || project.status !== 'published') return null;
      const contentDigest = fileSha256(project.contentPath);
      const metaPath = contentMetaPathForLayer(project.layer, document.collection, document.uid);
      projectMetaSha256 = metaPath ? fileSha256(metaPath) : null;
      if (!contentDigest || !metaPath || !projectMetaSha256) return null;
      dependencies.push({ path: repositoryPath(project.contentPath), sha256: contentDigest });
      dependencies.push({ path: repositoryPath(metaPath), sha256: projectMetaSha256 });
    }

    return englishAudioRegistrationVersion(source, entry, dependencies, projectMetaSha256);
  } catch {
    return null;
  }
}

function explanationVersions(document: CanonDocument, base: Record<string, unknown>): AudioVersionPlayerData[] {
  if (document.collection !== 'mn' && document.collection !== 'dn') return [];
  const registrations = base.explanation_tracks;
  if (!registrations || typeof registrations !== 'object') return [];
  const profileId = base.narration_profile_id;
  const profileSha = base.narration_profile_sha256;
  const profile = base.narration_profile;
  const versions: AudioVersionPlayerData[] = [];
  for (const audience of EXPLANATION_AUDIO_AUDIENCES) {
    const entry = (registrations as Record<string, unknown>)[audience] as ExplanationAudioRegistration | undefined;
    if (!entry || entry.uid !== document.uid || entry.collection !== document.collection || entry.audience_variant !== audience
      || entry.track_kind !== 'explanation' || entry.transcript_policy !== 'explanation-audience-v1'
      || !['pending', 'approved'].includes(entry.review_status)
      || entry.upload_verified !== true || entry.public_range_verified !== true || entry.r2_full_sha256_verified !== true
      || entry.scripture_start_seconds !== 0 || entry.narration_profile_id !== profileId
      || entry.narration_profile_sha256 !== profileSha || JSON.stringify(entry.narration_profile) !== JSON.stringify(profile)
      || !/^[0-9a-f]{64}$/.test(entry.sha256 ?? '') || !Number.isInteger(entry.bytes) || !(entry.bytes > 0)
      || !validAudioAsset(entry)) continue;
    try {
      const source = explanationNarrationSource(document.uid, audience, document.collection);
      if (entry.source_sha256 !== source.source_sha256 || entry.selected_review_id !== source.selected_review_id
        || entry.review_date !== source.review_date || entry.content_hash !== source.content_hash) continue;
    } catch {
      continue;
    }
    versions.push({
      id: audience, label: EXPLANATION_AUDIENCE_LABELS[audience].title, kind: 'explanation',
      description: 'Chỉ đọc phần diễn giải này; không đọc lặp lại kinh văn.',
      url: entry.url, duration_seconds: entry.duration_seconds, scripture_start_seconds: 0, start_seconds: 0,
      review_status: entry.review_status,
      ...(entry.parts ? { parts: entry.parts.map(part => ({ url: part.url, duration_seconds: part.duration_seconds })) } : {}),
    });
  }
  return versions;
}

export function loadAudio(document: CanonDocument): SuttaAudio | null {
  if (document.status !== 'published') return null;
  const file = path.join(process.cwd(), 'content/audio', `${document.uid}.json`);
  if (!fs.existsSync(file)) return null;
  const entry = JSON.parse(fs.readFileSync(file, 'utf8')) as SuttaAudio;
  if (document.collection !== 'mn' && document.collection !== 'dn'
    && ((entry as SuttaAudio & { transcript_policy?: string }).transcript_policy !== 'title-scripture-v1'
      || entry.scripture_start_seconds !== 0)) return null;
  if (entry.uid !== document.uid || entry.source_sha256 !== narrationHash(document)) return null;
  if (typeof entry.url !== 'string' || !/^https:\/\//.test(entry.url) || !entry.url.endsWith('.mp3')) return null;
  if (!Number.isFinite(entry.duration_seconds) || !(entry.duration_seconds > 0)
    || !Number.isFinite(entry.scripture_start_seconds) || entry.scripture_start_seconds < 0
    || entry.scripture_start_seconds >= entry.duration_seconds) return null;
  if (!validAudioAsset(entry)) return null;
  const versions: AudioVersionPlayerData[] = [{
    id: 'original', label: 'Kinh văn Việt 2026', kind: 'sutta', url: entry.url,
    description: 'Dùng lại audio chuẩn hiện có; bắt đầu từ mốc kinh văn.',
    duration_seconds: entry.duration_seconds, scripture_start_seconds: entry.scripture_start_seconds,
    start_seconds: entry.scripture_start_seconds, review_status: entry.review_status,
    ...(entry.parts ? { parts: entry.parts.map(part => ({ url: part.url, duration_seconds: part.duration_seconds })) } : {}),
  }, ...explanationVersions(document, entry as unknown as Record<string, unknown>)];
  const english = loadEnglishAudioVersion(document);
  if (english) versions.push(english);
  return { ...entry, versions };
}
