import { validParts, type AudioPart } from './parts';
export interface PlayerTrack {
  uid: string;
  title: string;
  parts?: AudioPart[];
  url: string;
  duration_seconds: number;
  scripture_start_seconds: number;
  review_status: 'pending' | 'approved';
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
    seen.add(item.uid);
  }
  return value as PlayerTrack[];
}
