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
