const SCRIPTURE_PHASE_TOLERANCE_SECONDS = 0.01;

/**
 * Media currentTime can land a few microseconds below an exact seek target.
 * Treat that rounding interval as the scripture section so the chapter label
 * updates immediately after a paused seek.
 */
export function isScripturePhase(currentTime: number, scriptureStart: number): boolean {
  if (!Number.isFinite(currentTime) || !Number.isFinite(scriptureStart)) return false;
  return currentTime + SCRIPTURE_PHASE_TOLERANCE_SECONDS >= scriptureStart;
}

/**
 * Why `audio.play()` was refused, so the player can say the right thing.
 *
 * - `blocked`: the browser's autoplay policy (`NotAllowedError`). The media is fine; the listener
 *   only has to press Play. Showing "could not load the audio" here would be false.
 * - `interrupted`: a newer action replaced this request (`AbortError`, e.g. pause or another
 *   track). Nothing went wrong, so nothing is shown.
 * - `unavailable`: anything else — the file could not be fetched or decoded (an R2 404, the
 *   network, an unsupported source). Saying the browser blocked autoplay here would be false.
 */
export type PlayFailure = 'blocked' | 'interrupted' | 'unavailable';

export function playFailure(error: unknown): PlayFailure {
  const name = (error as { name?: unknown } | null | undefined)?.name;
  if (name === 'NotAllowedError') return 'blocked';
  if (name === 'AbortError') return 'interrupted';
  return 'unavailable';
}
