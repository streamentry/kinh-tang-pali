import { validParts, type AudioPart } from './parts';
import type { AudioVersionId, AudioVersionPlayerData } from '../canon/audio';
export interface PlayerTrack {
  uid: string;
  title: string;
  order: number;
  parts?: AudioPart[];
  url: string;
  duration_seconds: number;
  scripture_start_seconds: number;
  review_status: 'pending' | 'approved';
  versions: AudioVersionPlayerData[];
}

const versionIds: AudioVersionId[] = ['original', 'children', 'adults', 'older-adults'];
function validVersion(value: unknown): value is AudioVersionPlayerData {
  if (!value || typeof value !== 'object') return false;
  const item = value as AudioVersionPlayerData;
  return versionIds.includes(item.id) && typeof item.label === 'string' && Boolean(item.label.trim())
    && typeof item.description === 'string' && ['sutta', 'explanation'].includes(item.kind)
    && typeof item.url === 'string' && /^(https:\/\/|\/[^/])/.test(item.url)
    && Number.isFinite(item.duration_seconds) && item.duration_seconds > 0
    && Number.isFinite(item.scripture_start_seconds) && item.scripture_start_seconds >= 0 && item.scripture_start_seconds < item.duration_seconds
    && Number.isFinite(item.start_seconds) && item.start_seconds >= 0 && item.start_seconds < item.duration_seconds
    && ['pending', 'approved'].includes(item.review_status) && validParts(item);
}

/** Treat unavailable, truncated and malformed static payloads as a fallback case. */
export function parsePlaylist(value: unknown, expectedCount: number): PlayerTrack[] {
  if (!Array.isArray(value) || !value.length || value.length !== expectedCount) throw new Error('Playlist count differs');
  const seen = new Set<string>();
  for (const item of value) {
    if (!item || typeof item.uid !== 'string' || !item.uid || seen.has(item.uid)
      || typeof item.title !== 'string' || !item.title.trim()
      || typeof item.url !== 'string' || !/^(https:\/\/|\/[^/])/.test(item.url)
      || !Number.isFinite(item.duration_seconds) || item.duration_seconds <= 0
      || !Number.isFinite(item.scripture_start_seconds) || item.scripture_start_seconds < 0
      || item.scripture_start_seconds >= item.duration_seconds
      || !['pending','approved'].includes(item.review_status) || !validParts(item)) throw new Error('Invalid playlist track');
    const versions: AudioVersionPlayerData[] = Array.isArray(item.versions) ? item.versions as AudioVersionPlayerData[] : [{
      id: 'original', label: 'Kinh văn Việt 2026', description: 'Bản audio chuẩn hiện có.', kind: 'sutta',
      url: item.url, duration_seconds: item.duration_seconds, scripture_start_seconds: item.scripture_start_seconds,
      start_seconds: item.scripture_start_seconds, review_status: item.review_status, ...(item.parts ? { parts: item.parts } : {}),
    }];
    if (!versions.length || versions.some(version => !validVersion(version))
      || new Set(versions.map((version) => version.id)).size !== versions.length
      || !versions.some(version => version.id === 'original')) throw new Error('Invalid playlist audio versions');
    const original = versions.find(version => version.id === 'original')!;
    if (original.url !== item.url || original.duration_seconds !== item.duration_seconds
      || original.scripture_start_seconds !== item.scripture_start_seconds
      || original.review_status !== item.review_status) throw new Error('Original playlist track differs from its fallback fields');
    item.versions = versions;
    seen.add(item.uid);
  }
  return value as PlayerTrack[];
}
