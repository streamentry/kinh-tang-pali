import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import type { CanonDocument } from './types';

export function narrationSource(document: CanonDocument) {
  return {
    summary: document.summary?.trim() ?? '',
    segments: document.segments.filter(segment => !segment.id.split(':')[1].startsWith('0.') && segment.vi?.trim())
      .map(segment => [segment.id, segment.vi!.trim()]),
  };
}
export function narrationHash(document: CanonDocument) {
  return createHash('sha256').update(JSON.stringify(narrationSource(document))).digest('hex');
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
export function loadAudio(document: CanonDocument): SuttaAudio | null {
  const file = path.join(process.cwd(), 'content/audio', `${document.uid}.json`);
  if (!fs.existsSync(file)) return null;
  const entry = JSON.parse(fs.readFileSync(file, 'utf8')) as SuttaAudio;
  if (entry.uid !== document.uid || entry.source_sha256 !== narrationHash(document)) return null;
  if (typeof entry.url !== 'string' || !/^https:\/\//.test(entry.url) || !entry.url.endsWith('.mp3')) return null;
  if (!Number.isFinite(entry.duration_seconds) || !(entry.duration_seconds > 0)
    || !Number.isFinite(entry.scripture_start_seconds) || entry.scripture_start_seconds < 0
    || entry.scripture_start_seconds >= entry.duration_seconds) return null;
  return entry;
}
