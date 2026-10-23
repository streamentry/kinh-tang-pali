import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
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
  source_sha256: string;
  duration_seconds: number;
  scripture_start_seconds: number;
  voice: string;
  review_status: 'pending' | 'approved';
}

/** The only audio fields allowed into playlist HTML; never spread manifests. */
export type AudioPlayerData = Pick<SuttaAudio, 'uid' | 'url' | 'duration_seconds' | 'scripture_start_seconds' | 'review_status'>;
export function audioPlayerData(entry: AudioPlayerData): AudioPlayerData {
  return {
    uid: entry.uid, url: entry.url,
    duration_seconds: entry.duration_seconds, scripture_start_seconds: entry.scripture_start_seconds,
    review_status: entry.review_status,
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
  return entry;
}
