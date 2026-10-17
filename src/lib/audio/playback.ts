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
