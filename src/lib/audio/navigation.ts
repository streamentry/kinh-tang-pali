export const AUTO_NEXT_KEY = 'kinh-tang-pali:audio:auto-next:v1';
export const CONTINUE_KEY = 'kinh-tang-pali:audio:continue:v1';
export interface StorageLike { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void; }
export function readAutoNext(storage: StorageLike): boolean {
  try { return storage.getItem(AUTO_NEXT_KEY) !== 'false'; } catch { return true; }
}
export function saveAutoNext(storage: StorageLike, enabled: boolean) {
  try { storage.setItem(AUTO_NEXT_KEY, String(enabled)); } catch { /* Continue in memory when storage is unavailable. */ }
}
export function rememberContinuation(storage: StorageLike, pathname: string, now = Date.now()) {
  try { storage.setItem(CONTINUE_KEY, JSON.stringify({ pathname, at: now })); } catch { /* Navigation still works. */ }
}
export function consumeContinuation(storage: StorageLike, pathname: string, now = Date.now()): boolean {
  try {
    const raw = storage.getItem(CONTINUE_KEY);
    storage.removeItem(CONTINUE_KEY);
    if (!raw) return false;
    const entry = JSON.parse(raw);
    return entry.pathname === pathname && Number.isFinite(entry.at) && now >= entry.at && now - entry.at < 60_000;
  } catch { return false; }
}
export function adjacentTexts<T extends { uid: string; order: number }>(texts: readonly T[], uid: string) {
  const ordered = [...texts].sort((a, b) => a.order - b.order);
  const index = ordered.findIndex(text => text.uid === uid);
  return { previous: index > 0 ? ordered[index - 1] : undefined, next: index >= 0 ? ordered[index + 1] : undefined };
}

export function orderedAudioItems<T extends { order: number; audio: unknown }>(items: readonly T[]) {
  return items
    .filter(item => item.audio !== null && item.audio !== undefined)
    .slice()
    .sort((a, b) => a.order - b.order);
}

export function stepAudioIndex(index: number, count: number, direction: -1 | 1): number | null {
  if (!Number.isInteger(index) || !Number.isInteger(count) || count <= 0 || index < 0 || index >= count) return null;
  const next = index + direction;
  return next >= 0 && next < count ? next : null;
}
