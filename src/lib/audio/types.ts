import type { AudioVersionPreference } from './navigation';

/** Shared browser/native metadata; no filesystem or catalogue dependencies. */
export interface AudioPart { url: string; duration_seconds: number; }
export interface ReadingMedia { url: string; duration_seconds: number; parts?: AudioPart[]; }
export type AudioVersionId = AudioVersionPreference;
export interface AudioVersionPlayerData extends ReadingMedia {
  id: AudioVersionId;
  label: string;
  description: string;
  kind: 'sutta' | 'explanation';
  scripture_start_seconds: number;
  start_seconds: number;
  review_status: 'pending' | 'approved';
}
