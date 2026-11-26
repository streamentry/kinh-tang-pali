import {
  BRIDGE_VERSION, MAX_BRIDGE_MESSAGE_LENGTH, READER_SIZES, isReadingPosition,
  normalizePageUrl, shouldRestorePosition,
  type NativeMessage, type NativeTrack, type PageInfo, type ReadingPosition, type WebMessage,
} from './protocol';

declare global {
  interface Window {
    ReactNativeWebView?: { postMessage(message: string): void };
    __KINH_NATIVE__?: {
      ready(): void;
      capture(): void;
      receive(message: NativeMessage): void;
      play(track: NativeTrack, startSeconds?: number, queue?: NativeTrack[]): boolean;
    };
  }
}

export function isNativeHost(): boolean {
  return typeof window !== 'undefined' && window.top === window && typeof window.ReactNativeWebView?.postMessage === 'function';
}

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const line = 16;
function pageInfo(): PageInfo {
  const reader = document.querySelector<HTMLElement>('[data-native-reader]');
  return {
    url: normalizePageUrl(location.href),
    title: reader?.dataset.nativeTitle || document.title.replace(/ · Kinh Tạng Pāli Việt$/, ''),
    uid: reader?.dataset.nativeUid || null,
  };
}

function positionOf(page: PageInfo): ReadingPosition | null {
  if (!document.querySelector('[data-native-reader]')) return null;
  const segments = Array.from(document.querySelectorAll<HTMLElement>('[data-segment-id]'));
  const visible = segments.find(segment => {
    const rect = segment.getBoundingClientRect();
    return rect.height > 0 && rect.bottom > line && rect.top < window.innerHeight;
  });
  // Visiting audio, summary, provenance or the footer is not a new reading position.
  // In particular #lang-nghe must never erase a previously saved scripture paragraph.
  if (segments.length && !visible) return null;
  const shell = visible?.closest<HTMLElement>('.reader-shell') ?? document.querySelector<HTMLElement>('.reader-shell');
  const rect = visible?.getBoundingClientRect();
  const scale = Number(shell?.style.getPropertyValue('--reader-scale') || 1);
  const textSize = READER_SIZES.findIndex(size => Math.abs(size - scale) < 0.001);
  const selectedMode = document.querySelector<HTMLElement>('[data-group-mode][aria-pressed="true"]')?.dataset.groupMode;
  const mode = selectedMode || shell?.dataset.readerMode || 'vi';
  const column = shell?.dataset.focus || null;
  const segmentId = visible?.dataset.segmentId || null;
  const position: ReadingPosition = {
    pageUrl: page.url, title: page.title, uid: page.uid ?? segmentId?.split(':')[0] ?? null,
    segmentId, segmentOffset: rect ? clamp((line - rect.top) / Math.max(rect.height, 1)) : 0,
    scrollRatio: clamp(window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight)),
    mode: mode as ReadingPosition['mode'], column: column as ReadingPosition['column'], textSize: textSize < 0 ? 1 : textSize,
  };
  return isReadingPosition(position) ? position : null;
}

function applyPreferences(position: ReadingPosition) {
  const modeButton = document.querySelector<HTMLButtonElement>(`[data-group-mode="${position.mode}"], [data-mode="${position.mode}"]`);
  if (modeButton && !modeButton.disabled) modeButton.click();
  if (position.column) {
    const tab = document.querySelector<HTMLButtonElement>(`.column-tab[data-column="${position.column}"]`);
    if (tab && tab.getAttribute('aria-disabled') !== 'true' && !tab.disabled) tab.click();
  }
  const shell = document.querySelector<HTMLElement>('.reader-shell');
  const scale = Number(shell?.style.getPropertyValue('--reader-scale') || 1);
  const current = READER_SIZES.findIndex(size => Math.abs(size - scale) < 0.001);
  const distance = position.textSize - (current < 0 ? 1 : current);
  const button = document.querySelector<HTMLButtonElement>(`[data-size-step="${distance < 0 ? -1 : 1}"]`);
  for (let index = 0; index < Math.abs(distance); index++) button?.click();
}

function scrollToPosition(position: ReadingPosition) {
  const segment = position.segmentId ? document.getElementById(position.segmentId) : null;
  const rect = segment?.getBoundingClientRect();
  const top = rect && rect.height > 0
    ? window.scrollY + rect.top + rect.height * position.segmentOffset - line
    : position.scrollRatio * Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  window.scrollTo({ top: Math.max(0, top), behavior: 'instant' });
}

/** Called by Base and by audio components; installation is idempotent. */
export function installNativeBridge() {
  if (!isNativeHost() || window.__KINH_NATIVE__) return window.__KINH_NATIVE__;
  const page = pageInfo();
  const sessionId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let restored = false;
  let restoring = false;
  let interacted = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const send = (message: Omit<WebMessage, 'v' | 'sessionId' | 'page'>): boolean => {
    const encoded = JSON.stringify({ ...message, v: BRIDGE_VERSION, sessionId, page });
    if (encoded.length > MAX_BRIDGE_MESSAGE_LENGTH) return false;
    window.ReactNativeWebView?.postMessage(encoded);
    return true;
  };
  const capture = () => {
    if (timer) clearTimeout(timer);
    timer = undefined;
    // Initial scroll events must not overwrite the saved position before hydration.
    if (!restored) return;
    const position = positionOf(page);
    if (position) send({ type: 'reading-progress', position } as Omit<WebMessage, 'v' | 'sessionId' | 'page'>);
  };
  const schedule = () => {
    if (!restored) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(capture, 600);
  };
  const ready = () => send({ type: 'ready' });
  const receive = async (message: NativeMessage) => {
    if (!message || message.v !== BRIDGE_VERSION || message.sessionId !== sessionId) return;
    if (message.type === 'capture') {
      if (typeof message.requestId === 'string' && message.requestId.length > 0 && message.requestId.length <= 160) {
        if (timer) clearTimeout(timer);
        timer = undefined;
        const position = restored ? positionOf(page) : null;
        send({ type: 'captured', requestId: message.requestId, position } as Omit<WebMessage, 'v' | 'sessionId' | 'page'>);
      } else capture();
      return;
    }
    if (message.type !== 'restore' || restored || restoring
      || !(message.position === null || isReadingPosition(message.position))) return;
    restoring = true;
    const saved = message.position;
    // A linked segment or lookup is deliberate navigation, not a resume request.
    let hashId = '';
    try { hashId = decodeURIComponent(location.hash.slice(1)); } catch { /* Invalid anchor: use saved progress. */ }
    const hasAnchor = Boolean(hashId && document.getElementById(hashId));
    if (saved && normalizePageUrl(saved.pageUrl) === page.url && !hasAnchor && !interacted) applyPreferences(saved);
    if (document.fonts) await Promise.race([document.fonts.ready, new Promise(resolve => setTimeout(resolve, 700))]);
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    if (shouldRestorePosition(saved, page.url, hasAnchor, interacted)) scrollToPosition(saved!);
    restored = true;
    restoring = false;
    schedule();
  };
  const play = (track: NativeTrack, startSeconds?: number, queue?: NativeTrack[]) => {
    capture();
    return send({ type: 'audio-play', track, ...(startSeconds === undefined ? {} : { startSeconds }),
      ...(queue?.length ? { queue } : {}) } as Omit<WebMessage, 'v' | 'sessionId' | 'page'>);
  };
  window.__KINH_NATIVE__ = { ready, capture, receive: message => { void receive(message); }, play };
  document.documentElement.dataset.nativeApp = 'true';
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('pagehide', capture);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') capture(); });
  for (const name of ['pointerdown', 'touchstart', 'wheel', 'keydown']) {
    window.addEventListener(name, () => { interacted = true; }, { passive: true });
  }
  document.addEventListener('click', event => {
    if ((event.target as Element | null)?.closest('a[href]')) capture();
    schedule();
  }, true);
  document.addEventListener('change', schedule);
  ready();
  setTimeout(() => { if (!restored) ready(); }, 800);
  setTimeout(() => { if (!restored) ready(); }, 2_000);
  return window.__KINH_NATIVE__;
}
