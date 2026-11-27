/** Shared, dependency-free contract between the website and the Expo companion.
 * The website owns text and audio metadata. The app owns personal progress.
 */
import type { AudioVersionPlayerData } from '../audio/types';

export const BRIDGE_VERSION = 1 as const;
/** Stable capability token, also used by the first released companion. This is
 * a host compatibility signal; URL and session checks remain the trust boundary. */
export const COMPANION_USER_AGENT = 'KinhTangPali/0.1';
export const WEBSITE_URL = 'https://streamentry.github.io/kinh-tang-pali/';
export const MAX_BRIDGE_MESSAGE_LENGTH = 4 * 1024 * 1024;
export const READER_SIZES = [0.9, 1, 1.1, 1.2, 1.35] as const;
export type ReaderMode = 'vi' | 'compare' | 'interlinear';
export type ReaderColumn = 'pali' | 'english' | 'viCurrent' | 'vi';

export interface PageInfo { url: string; title: string; uid: string | null; }
export interface ReadingPosition {
  pageUrl: string;
  title: string;
  uid: string | null;
  segmentId: string | null;
  /** Fraction of the segment's height above the viewport, independent of font size. */
  segmentOffset: number;
  scrollRatio: number;
  mode: ReaderMode;
  column: ReaderColumn | null;
  /** Index into the website's existing text-size choices. */
  textSize: number;
}
export interface NativeTrack {
  uid: string;
  title: string;
  pageUrl: string;
  version: AudioVersionPlayerData;
}
interface Envelope { v: typeof BRIDGE_VERSION; sessionId: string; page: PageInfo; }
export type WebMessage = Envelope & (
  | { type: 'ready' }
  | { type: 'reading-progress'; position: ReadingPosition }
  | { type: 'captured'; requestId: string; position: ReadingPosition | null }
  | { type: 'audio-play'; track: NativeTrack; startSeconds?: number; queue?: NativeTrack[] }
);
export type NativeMessage = { v: typeof BRIDGE_VERSION; sessionId: string } & (
  | { type: 'restore'; position: ReadingPosition | null }
  | { type: 'capture'; requestId?: string }
);

const record = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown, max = 2_000): value is string => typeof value === 'string' && value.length > 0 && value.length <= max;
const finite = (value: unknown, min: number, max: number): value is number => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
const choice = (value: unknown, choices: readonly string[]): value is string => typeof value === 'string' && choices.includes(value);
const uid = (value: unknown): value is string => text(value, 160) && /^[a-z][a-z0-9.-]*$/.test(value);
const nullableUid = (value: unknown): value is string | null => value === null || uid(value);
function httpUrl(value: unknown): value is string {
  if (!text(value, 8_192)) return false;
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password; }
  catch { return false; }
}
function audioUrl(value: unknown): value is string {
  if (!httpUrl(value)) return false;
  const url = new URL(value);
  return url.protocol === 'https:' && url.pathname.endsWith('.mp3');
}

/** A generic ReactNativeWebView bridge does not imply our companion is present. */
export function isCompanionUserAgent(value: unknown): boolean {
  return typeof value === 'string' && value.split(/\s+/).includes(COMPANION_USER_AGENT);
}

/** Hash/query changes do not create a second personal reading record. */
export function normalizePageUrl(value: string): string {
  const url = new URL(value);
  url.hash = ''; url.search = '';
  return url.href;
}

/** A sibling GitHub Pages project is an external origin for this bridge. */
export function isTrustedPageUrl(value: unknown, siteUrl = WEBSITE_URL): value is string {
  if (!httpUrl(value) || !httpUrl(siteUrl)) return false;
  const url = new URL(value);
  const site = new URL(siteUrl);
  const base = site.pathname.replace(/\/+$/, '');
  // Encoded separators and backslashes must not turn a checked path into another route.
  if (/%(?:2f|5c|00)/i.test(url.pathname) || url.pathname.includes('\\')) return false;
  return url.origin === site.origin && (url.pathname === base || url.pathname.startsWith(`${base}/`));
}

export function isReadingPosition(value: unknown, siteUrl?: string): value is ReadingPosition {
  if (!record(value) || !httpUrl(value.pageUrl) || (siteUrl && !isTrustedPageUrl(value.pageUrl, siteUrl))
    || !text(value.title) || !nullableUid(value.uid)
    || !(value.segmentId === null || (text(value.segmentId, 240) && /^[a-z][a-z0-9.-]*:[0-9.]+$/.test(value.segmentId)))
    || !finite(value.segmentOffset, 0, 1) || !finite(value.scrollRatio, 0, 1)
    || !choice(value.mode, ['vi', 'compare', 'interlinear'])
    || !(value.column === null || choice(value.column, ['pali', 'english', 'viCurrent', 'vi']))
    || !Number.isInteger(value.textSize) || !finite(value.textSize, 0, READER_SIZES.length - 1)) return false;
  if (typeof value.uid === 'string' && typeof value.segmentId === 'string' && !value.segmentId.startsWith(`${value.uid}:`)) return false;
  return true;
}

export function isNativeTrack(value: unknown, siteUrl?: string): value is NativeTrack {
  if (!record(value) || !uid(value.uid) || !text(value.title) || !httpUrl(value.pageUrl)
    || (siteUrl && !isTrustedPageUrl(value.pageUrl, siteUrl)) || !record(value.version)) return false;
  const version = value.version;
  if (!choice(version.id, ['original', 'children', 'adults', 'older-adults', 'english-standard'])
    || !text(version.label) || typeof version.description !== 'string' || version.description.length > 8_000
    || !choice(version.kind, ['sutta', 'explanation', 'english']) || !audioUrl(version.url)
    || !finite(version.duration_seconds, 0.001, 30 * 24 * 3600)
    || !finite(version.start_seconds, 0, version.duration_seconds)
    || !finite(version.scripture_start_seconds, 0, version.duration_seconds)
    || !choice(version.review_status, ['pending', 'approved'])) return false;
  const expectedKind = version.id === 'english-standard' ? 'english'
    : version.id === 'original' ? 'sutta' : 'explanation';
  if (version.kind !== expectedKind) return false;
  if (version.parts !== undefined) {
    if (!Array.isArray(version.parts) || version.parts.length < 2 || version.parts.length > 10_000) return false;
    let total = 0;
    const sources = new Set<string>();
    for (const part of version.parts) {
      if (!record(part) || !audioUrl(part.url) || !finite(part.duration_seconds, 0.001, 1800) || sources.has(part.url)) return false;
      sources.add(part.url); total += part.duration_seconds;
    }
    if (version.url !== version.parts[0].url || Math.abs(total - version.duration_seconds) >= 0.001) return false;
  }
  return true;
}

/** A different recording/part sequence never silently inherits an old timestamp. */
export function trackKey(track: NativeTrack): string {
  return JSON.stringify([track.uid, track.version.id, track.version.url, track.version.duration_seconds,
    track.version.parts?.map(part => [part.url, part.duration_seconds]) ?? null]);
}

/** Resolve a saved item against current, validated website metadata before playback. */
export function parseAudioManifest(value: unknown, siteUrl = WEBSITE_URL, expectedUid?: string): NativeTrack[] | null {
  if (!record(value) || value.v !== BRIDGE_VERSION || !uid(value.uid) || (expectedUid && value.uid !== expectedUid)
    || !text(value.title) || !text(value.pagePath, 8_192) || !value.pagePath.startsWith('/')
    || !Array.isArray(value.versions) || !value.versions.length || value.versions.length > 5) return null;
  let pageUrl: string;
  try { pageUrl = new URL(value.pagePath, siteUrl).href; } catch { return null; }
  if (!isTrustedPageUrl(pageUrl, siteUrl) || !new URL(pageUrl).pathname.endsWith(`/${value.uid}/`)) return null;
  const tracks = value.versions.map(version => ({ uid: value.uid, title: value.title, pageUrl, version }));
  if (tracks.some(track => !isNativeTrack(track, siteUrl))) return null;
  const validated = tracks as NativeTrack[];
  if (new Set(validated.map(track => track.version.id)).size !== validated.length
    || !validated.some(track => track.version.id === 'original')) return null;
  return validated;
}

/** Validate at the native boundary, including the actual WebView message URL. */
export function parseWebMessage(raw: string, siteUrl = WEBSITE_URL, eventUrl?: string): WebMessage | null {
  if (typeof raw !== 'string' || raw.length > MAX_BRIDGE_MESSAGE_LENGTH) return null;
  let value: unknown;
  try { value = JSON.parse(raw); } catch { return null; }
  if (!record(value) || value.v !== BRIDGE_VERSION || !text(value.sessionId, 160) || !record(value.page)) return null;
  const page = value.page;
  if (!isTrustedPageUrl(page.url, siteUrl) || !text(page.title) || !nullableUid(page.uid)) return null;
  if (eventUrl && (!isTrustedPageUrl(eventUrl, siteUrl) || normalizePageUrl(eventUrl) !== normalizePageUrl(page.url))) return null;
  if (value.type === 'ready') return value as unknown as WebMessage;
  if (value.type === 'reading-progress') {
    if (!isReadingPosition(value.position, siteUrl) || normalizePageUrl(value.position.pageUrl) !== normalizePageUrl(page.url)) return null;
    if (page.uid !== null && value.position.uid !== page.uid) return null;
    return value as unknown as WebMessage;
  }
  if (value.type === 'captured') {
    if (!text(value.requestId, 160)) return null;
    if (value.position !== null && (!isReadingPosition(value.position, siteUrl)
      || normalizePageUrl(value.position.pageUrl) !== normalizePageUrl(page.url)
      || (page.uid !== null && value.position.uid !== page.uid))) return null;
    return value as unknown as WebMessage;
  }
  if (value.type === 'audio-play') {
    if (!isNativeTrack(value.track, siteUrl)) return null;
    const activeTrack = value.track;
    if (value.startSeconds !== undefined && !finite(value.startSeconds, 0, value.track.version.duration_seconds)) return null;
    if (value.queue !== undefined && (!Array.isArray(value.queue) || value.queue.length > 10_000
      || value.queue.some(track => !isNativeTrack(track, siteUrl) || track.version.id !== activeTrack.version.id))) return null;
    return value as unknown as WebMessage;
  }
  return null;
}

/** Explicit links and an interaction before hydration take precedence over automatic resume. */
export function shouldRestorePosition(saved: ReadingPosition | null, pageUrl: string, hasAnchor: boolean, interacted: boolean): boolean {
  return Boolean(saved && normalizePageUrl(saved.pageUrl) === normalizePageUrl(pageUrl) && !hasAnchor && !interacted);
}
