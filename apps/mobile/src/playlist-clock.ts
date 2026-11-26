import type { AudioPart } from '../../../src/lib/audio/types';
import type { PlayerEvent } from './playback-core';

export interface PartPlaylistSample {
  currentIndex: number;
  currentTime: number;
  isLoaded: boolean;
  playing: boolean;
  isBuffering: boolean;
  didJustFinish: boolean;
  error?: unknown;
}

/** Expo's native playlist clock restarts at zero for each MP3; personal progress
 * is measured across the whole reading. Sources remain exactly as published. */
export function playlistEvent(parts: AudioPart[], sample: PartPlaylistSample): PlayerEvent {
  const duration = parts.reduce((sum, part) => sum + part.duration_seconds, 0);
  const index = Math.max(0, Math.min(parts.length - 1, Math.floor(sample.currentIndex)));
  const offset = parts.slice(0, index).reduce((sum, part) => sum + part.duration_seconds, 0);
  const localTime = Number.isFinite(sample.currentTime)
    ? Math.max(0, Math.min(sample.currentTime, parts[index]?.duration_seconds ?? 0)) : 0;
  const error = typeof sample.error === 'string' ? sample.error
    : sample.error && typeof sample.error === 'object' && 'message' in sample.error
      ? String(sample.error.message) : null;
  return {
    currentTime: sample.didJustFinish ? duration : offset + localTime,
    duration, isLoaded: sample.didJustFinish || sample.isLoaded,
    playing: !sample.didJustFinish && sample.playing,
    isBuffering: !sample.didJustFinish && sample.isBuffering,
    didJustFinish: sample.didJustFinish, error,
  };
}
