import {
  isNativeTrack,
  isReadingPosition,
  isTrustedPageUrl,
  normalizePageUrl,
  trackKey,
  type NativeTrack,
  type PageInfo,
  type ReadingPosition,
} from '../../../src/lib/native/protocol';

export type RecordKind = 'reading' | 'listening' | 'bookmark';

/** The native adapter commits one record atomically; no asynchronous write queue
 * can race a newer position or be abandoned when the app enters the background. */
export interface ProgressBackend {
  get(kind: RecordKind, key: string): string | null;
  put(kind: RecordKind, key: string, value: string, updatedAt: number): void;
  delete(kind: RecordKind, key: string): void;
  list(kind: RecordKind, limit?: number): string[];
  transaction(run: () => void): void;
}

export interface SavedReading extends ReadingPosition { updatedAt: number }
const readingFields = ['pageUrl', 'title', 'uid', 'segmentId', 'segmentOffset', 'scrollRatio', 'mode', 'column', 'textSize'] as const;
export interface SavedListening {
  track: NativeTrack;
  position: number;
  duration: number;
  rate: number;
  completed: boolean;
  updatedAt: number;
}
export interface Bookmark {
  pageUrl: string;
  title: string;
  uid: string | null;
  position?: ReadingPosition;
  updatedAt: number;
}
export interface ProgressSnapshot {
  format: 'kinh-tang-pali-progress';
  version: 1;
  exportedAt: number;
  readings: SavedReading[];
  listenings: SavedListening[];
  bookmarks: Bookmark[];
}

export class ProgressStorageError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ProgressStorageError';
  }
}

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
function timestamp(value: unknown): value is number {
  return finite(value) && Number.isSafeInteger(value) && value >= 0 && value <= 8_640_000_000_000_000;
}
function isSavedReading(value: unknown): value is SavedReading {
  return isReadingPosition(value) && timestamp((value as SavedReading).updatedAt);
}
function isSavedListening(value: unknown): value is SavedListening {
  if (!value || typeof value !== 'object') return false;
  const item = value as SavedListening;
  return isNativeTrack(item.track) && finite(item.position) && item.position >= 0
    && finite(item.duration) && item.duration > 0 && item.position <= item.duration
    && Math.abs(item.duration - item.track.version.duration_seconds) < 0.001
    && finite(item.rate) && item.rate >= 0.5 && item.rate <= 2
    && typeof item.completed === 'boolean' && timestamp(item.updatedAt);
}
function isBookmark(value: unknown): value is Bookmark {
  if (!value || typeof value !== 'object') return false;
  const item = value as Bookmark;
  let pageUrl: URL;
  try { pageUrl = new URL(item.pageUrl); } catch { return false; }
  return ['http:', 'https:'].includes(pageUrl.protocol) && !pageUrl.username && !pageUrl.password
    && typeof item.title === 'string' && item.title.length > 0 && item.title.length <= 2_000
    && (item.uid === null || (typeof item.uid === 'string' && /^[a-z][a-z0-9.-]*$/.test(item.uid)))
    && timestamp(item.updatedAt) && (item.position === undefined || (isReadingPosition(item.position)
      && normalizePageUrl(item.position.pageUrl) === normalizePageUrl(item.pageUrl)));
}
function parse<T>(value: string, validate: (input: unknown) => input is T): T {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!validate(parsed)) throw new Error('Invalid progress record');
    return parsed;
  } catch (cause) {
    // Preserve the original record. Silently replacing it with an empty state
    // would turn a recoverable migration/corruption problem into lost progress.
    throw new ProgressStorageError('Không đọc được tiến độ đã lưu. Dữ liệu gốc vẫn được giữ lại.', { cause });
  }
}

export class ProgressStore {
  constructor(private backend: ProgressBackend, private now: () => number = Date.now) {}

  private key(pageUrl: string) {
    try { return normalizePageUrl(pageUrl); }
    catch (cause) { throw new ProgressStorageError('Địa chỉ bài đọc không hợp lệ.', { cause }); }
  }

  getReading(pageUrl: string): SavedReading | null {
    const value = this.backend.get('reading', this.key(pageUrl));
    return value === null ? null : parse(value, isSavedReading);
  }

  saveReading(position: ReadingPosition): SavedReading {
    if (!isReadingPosition(position)) throw new ProgressStorageError('Vị trí bài đọc không hợp lệ.');
    const normalized = { ...position, pageUrl: this.key(position.pageUrl) };
    // Capturing an unchanged retained reader is not new reading activity. In
    // particular it must not give old progress a newer timestamp than a backup.
    // Reading the old value also refuses to overwrite a corrupt record.
    const previous = this.getReading(normalized.pageUrl);
    if (previous && readingFields.every(field => previous[field] === normalized[field])) return previous;
    const value: SavedReading = { ...normalized, updatedAt: this.now() };
    this.backend.put('reading', value.pageUrl, JSON.stringify(value), value.updatedAt);
    return value;
  }

  listReadings(limit = 100): SavedReading[] {
    return this.backend.list('reading', limit).map(value => parse(value, isSavedReading));
  }

  getListening(track: NativeTrack): SavedListening | null {
    const value = this.backend.get('listening', trackKey(track));
    return value === null ? null : parse(value, isSavedListening);
  }

  saveListening(listening: Omit<SavedListening, 'updatedAt'>): SavedListening {
    const value = { ...listening, updatedAt: this.now() };
    if (!isSavedListening(value)) throw new ProgressStorageError('Vị trí nghe không hợp lệ.');
    this.backend.put('listening', trackKey(value.track), JSON.stringify(value), value.updatedAt);
    return value;
  }

  listListenings(limit = 100): SavedListening[] {
    return this.backend.list('listening', limit).map(value => parse(value, isSavedListening));
  }

  isBookmarked(pageUrl: string): boolean {
    return this.backend.get('bookmark', this.key(pageUrl)) !== null;
  }

  toggleBookmark(page: PageInfo | ReadingPosition): boolean {
    const pageUrl = this.key('pageUrl' in page ? page.pageUrl : page.url);
    if (this.isBookmarked(pageUrl)) {
      this.backend.delete('bookmark', pageUrl);
      return false;
    }
    const value: Bookmark = {
      pageUrl, title: page.title, uid: page.uid, updatedAt: this.now(),
      ...('pageUrl' in page ? { position: page } : {}),
    };
    if (!isBookmark(value)) throw new ProgressStorageError('Không lưu được dấu trang này.');
    this.backend.put('bookmark', pageUrl, JSON.stringify(value), value.updatedAt);
    return true;
  }

  getBookmarks(): Bookmark[] {
    return this.backend.list('bookmark').map(value => parse(value, isBookmark));
  }

  exportSnapshot(): ProgressSnapshot {
    return {
      format: 'kinh-tang-pali-progress', version: 1, exportedAt: this.now(),
      readings: this.backend.list('reading').map(value => parse(value, isSavedReading)),
      listenings: this.backend.list('listening').map(value => parse(value, isSavedListening)),
      bookmarks: this.getBookmarks(),
    };
  }

  /** Validate the complete file first, then merge only newer records in one
   * transaction. A malformed backup or failed write cannot partially import. */
  importSnapshot(raw: unknown, siteUrl: string): { readings: number; listenings: number; bookmarks: number } {
    const invalid = () => new ProgressStorageError('Bản sao lưu không hợp lệ hoặc thuộc phiên bản ứng dụng khác. Dữ liệu hiện tại được giữ nguyên.');
    if (!raw || typeof raw !== 'object') throw invalid();
    const input = raw as ProgressSnapshot;
    if (input.format !== 'kinh-tang-pali-progress' || input.version !== 1 || !timestamp(input.exportedAt)
      || !Array.isArray(input.readings) || !Array.isArray(input.listenings) || !Array.isArray(input.bookmarks)
      || input.readings.length + input.listenings.length + input.bookmarks.length > 100_000
      || !input.readings.every(item => isSavedReading(item) && isReadingPosition(item, siteUrl))
      || !input.listenings.every(item => isSavedListening(item) && isNativeTrack(item.track, siteUrl))
      || !input.bookmarks.every(item => isBookmark(item) && isTrustedPageUrl(item.pageUrl, siteUrl)
        && (!item.position || isReadingPosition(item.position, siteUrl)))) throw invalid();

    const counts = { readings: 0, listenings: 0, bookmarks: 0 };
    this.backend.transaction(() => {
      const merge = <T extends { updatedAt: number }>(
        kind: RecordKind, key: string, item: T, validate: (value: unknown) => value is T,
      ) => {
        const stored = this.backend.get(kind, key);
        if (stored !== null && parse(stored, validate).updatedAt >= item.updatedAt) return false;
        this.backend.put(kind, key, JSON.stringify(item), item.updatedAt);
        return true;
      };
      for (const item of input.readings) {
        const key = this.key(item.pageUrl);
        if (merge('reading', key, { ...item, pageUrl: key }, isSavedReading)) counts.readings++;
      }
      for (const item of input.listenings) {
        if (merge('listening', trackKey(item.track), item, isSavedListening)) counts.listenings++;
      }
      for (const item of input.bookmarks) {
        const key = this.key(item.pageUrl);
        if (merge('bookmark', key, { ...item, pageUrl: key }, isBookmark)) counts.bookmarks++;
      }
    });
    return counts;
  }
}
