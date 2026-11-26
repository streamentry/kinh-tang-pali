import {
  BRIDGE_VERSION, isTrustedPageUrl, normalizePageUrl,
  type NativeMessage, type PageInfo, type ReadingPosition, type WebMessage,
} from '../../../src/lib/native/protocol';

interface Callbacks {
  send(message: NativeMessage): void;
  getReading(url: string): ReadingPosition | null;
  saveReading(position: ReadingPosition): boolean;
  isActive(): boolean;
  ready(page: PageInfo): void;
  audio(message: Extract<WebMessage, { type: 'audio-play' }>): void;
  error(message: string): void;
}

/** Owns one retained WebView's document identity and hydration gate. Kept free
 * of native UI so data-loss and late-message behavior can be tested directly. */
export class ReaderSession {
  private pageUrl: string;
  private sessionId: string | null = null;
  private hydrated = false;
  private restore: Extract<NativeMessage, { type: 'restore' }> | null = null;
  private suspended = false;
  private retired = new Set<string>();
  private sequence = 0;
  private captures = new Map<string, { finish(saved: boolean): void }>();

  constructor(
    private siteUrl: string,
    initialUrl: string,
    private callbacks: Callbacks,
    private requestedPosition?: ReadingPosition,
    private captureTimeout = 750,
  ) { this.pageUrl = normalizePageUrl(initialUrl); }

  get connected() { return this.sessionId !== null; }

  isCurrentDocument(url: string): boolean {
    return isTrustedPageUrl(url, this.siteUrl) && normalizePageUrl(url) === this.pageUrl;
  }

  private retire() {
    if (this.sessionId) this.retired.add(this.sessionId);
    if (this.retired.size > 64) this.retired.delete(this.retired.values().next().value!);
    this.sessionId = null;
    this.hydrated = false;
    this.restore = null;
    for (const capture of this.captures.values()) capture.finish(false);
  }

  navigate(url: string) {
    if (this.suspended || !isTrustedPageUrl(url, this.siteUrl)) return;
    // A back/forward-cache return can legitimately reuse a former document ID.
    // Retire IDs within this URL visit, not across the whole browser history.
    if (normalizePageUrl(url) !== this.pageUrl) this.retired.clear();
    this.retire();
    this.pageUrl = normalizePageUrl(url);
  }

  /** Import/unmount must invalidate callbacks synchronously, before React has
   * committed removal of the old WebView. */
  suspend() { this.suspended = true; this.retire(); }

  /** React development mode can repeat effect setup after its cleanup. */
  activate() { this.suspended = false; }

  capture(): Promise<boolean> {
    if (this.suspended || !this.sessionId || !this.hydrated) return Promise.resolve(false);
    const sessionId = this.sessionId;
    const requestId = `capture-${++this.sequence}`;
    return new Promise(resolve => {
      const finish = (saved: boolean) => {
        clearTimeout(timer);
        this.captures.delete(requestId);
        resolve(saved);
      };
      const timer = setTimeout(() => finish(false), this.captureTimeout);
      this.captures.set(requestId, { finish });
      try { this.callbacks.send({ v: BRIDGE_VERSION, sessionId, type: 'capture', requestId }); }
      catch { finish(false); }
    });
  }

  receive(message: WebMessage): boolean {
    if (this.suspended || !this.isCurrentDocument(message.page.url)) return false;
    if (message.type === 'ready') {
      if (this.retired.has(message.sessionId)) return false;
      if (message.sessionId === this.sessionId) {
        // The website retries ready if the first injection was lost. Reuse the
        // original snapshot; a failed storage read must never become restore(null).
        if (this.restore) this.callbacks.send(this.restore);
        return true;
      }
      this.retire();
      this.sessionId = message.sessionId;
      this.callbacks.ready(message.page);
      let position: ReadingPosition | null;
      try {
        const requested = this.requestedPosition;
        // Always read existing storage first: a bookmark must not silently
        // replace a corrupt progress record that has not been recovered.
        const saved = this.callbacks.getReading(message.page.url);
        position = requested && normalizePageUrl(requested.pageUrl) === this.pageUrl ? requested : saved;
        this.requestedPosition = undefined;
      } catch {
        // Sending restore(null) would authorize new scroll events to overwrite
        // the unreadable record. Keep this entire document session read-only.
        this.callbacks.error('Không đọc được vị trí đã lưu. Tiến độ của trang này được giữ nguyên; thử tải lại để đọc lại dữ liệu.');
        return true;
      }
      this.hydrated = true;
      this.restore = { v: BRIDGE_VERSION, sessionId: message.sessionId, type: 'restore', position };
      this.callbacks.send(this.restore);
      return true;
    }
    if (message.sessionId !== this.sessionId) return false;
    if (message.type === 'audio-play') {
      if (!this.callbacks.isActive()) return false;
      this.callbacks.audio(message);
      return true;
    }
    if (!this.hydrated) return false;
    if (message.type === 'reading-progress') return this.callbacks.saveReading(message.position);
    const capture = this.captures.get(message.requestId);
    if (!capture) return false;
    const saved = message.position !== null && this.callbacks.saveReading(message.position);
    capture.finish(saved);
    return saved;
  }
}
