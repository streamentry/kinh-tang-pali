import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { validParts, type AudioPart } from '../audio/parts';
import type { CanonDocument } from './types';

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

export interface SuttaAudio {
  uid: string;
  url: string;
  parts?: AudioPart[];
  source_sha256: string;
  duration_seconds: number;
  scripture_start_seconds: number;
  voice: string;
  review_status: 'pending' | 'approved';
}

/** The only audio fields allowed into playlist HTML; never spread manifests. */
export type AudioPlayerData = Pick<SuttaAudio, 'uid' | 'url' | 'duration_seconds' | 'scripture_start_seconds' | 'review_status' | 'parts'>;
export function audioPlayerData(entry: AudioPlayerData): AudioPlayerData {
  return {
    uid: entry.uid, url: entry.url,
    duration_seconds: entry.duration_seconds, scripture_start_seconds: entry.scripture_start_seconds,
    review_status: entry.review_status,
    ...(entry.parts ? { parts: entry.parts.map(part => ({ url: part.url, duration_seconds: part.duration_seconds })) } : {}),
  };
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
  if ((entry as SuttaAudio & { asset_kind?: string }).asset_kind === 'reading-parts-v1' && !entry.parts) return null;
  if (entry.parts) {
    const raw = entry as Omit<SuttaAudio, 'parts'> & { asset_kind?: string; checksum_scope?: string; sha256?: string; bytes?: number;
      parts: (AudioPart & { sha256?: string; bytes?: number })[] };
    if (raw.asset_kind !== 'reading-parts-v1' || raw.checksum_scope !== 'ordered-part-sha256-lines'
      || !Array.isArray(raw.parts) || raw.parts.some(part => !part || !/^[0-9a-f]{64}$/.test(part.sha256 ?? '') || !Number.isInteger(part.bytes) || !(part.bytes! > 0))
      || raw.bytes !== raw.parts.reduce((sum, part) => sum + part.bytes!, 0)
      || raw.sha256 !== createHash('sha256').update(raw.parts.map(part => part.sha256 + '\n').join('')).digest('hex')) return null;
  }
  if (!validParts(entry) || entry.parts?.some(part => !part.url.startsWith('https://'))) return null;
  return entry;
}
