import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WEBSITE_URL, MAX_BRIDGE_MESSAGE_LENGTH, isNativeTrack, isReadingPosition, isTrustedPageUrl,
  normalizePageUrl, parseWebMessage, parseAudioManifest, shouldRestorePosition, trackKey,
  type NativeTrack, type ReadingPosition,
} from '../../src/lib/native/protocol';

const pageUrl = `${WEBSITE_URL}sutta/mn/mn1/`;
const position: ReadingPosition = {
  pageUrl, title: 'Kinh Pháp Môn Căn Bản', uid: 'mn1', segmentId: 'mn1:7.3', segmentOffset: 0.35,
  scrollRatio: 0.42, mode: 'compare', column: 'pali', textSize: 3,
};
const track: NativeTrack = {
  uid: 'mn1', title: position.title, pageUrl,
  version: {
    id: 'original', label: 'Kinh văn Việt 2026', description: 'Bản chuẩn.', kind: 'sutta',
    url: 'https://audio.example.org/recording-a.mp3', duration_seconds: 180,
    start_seconds: 20, scripture_start_seconds: 20, review_status: 'pending',
  },
};
const envelope = { v: 1, sessionId: 'document-session-1', page: { url: pageUrl, title: position.title, uid: 'mn1' } };
const message = (fields: Record<string, unknown>) => JSON.stringify({ ...envelope, ...fields });

test('bridge trusts only the chosen website origin and base path', () => {
  assert.equal(isTrustedPageUrl(pageUrl), true);
  assert.equal(isTrustedPageUrl(`${WEBSITE_URL}search/?q=kinh#result`), true);
  for (const url of [
    'https://streamentry.github.io.evil.example/kinh-tang-pali/',
    'https://evil.example/kinh-tang-pali/',
    'https://streamentry.github.io/toward-less/',
    'https://streamentry.github.io/kinh-tang-pali-evil/',
    'https://streamentry.github.io/kinh-tang-pali/../toward-less/',
    'https://streamentry.github.io/kinh-tang-pali/%2e%2e/toward-less/',
    'https://streamentry.github.io/kinh-tang-pali/%2f..%2ftoward-less/',
    'https://someone@streamentry.github.io/kinh-tang-pali/',
    'http://streamentry.github.io/kinh-tang-pali/',
    'javascript:alert(1)', 'file:///kinh-tang-pali/',
  ]) assert.equal(isTrustedPageUrl(url), false, url);
});

test('development origin is an explicit exact override, not permission for any LAN URL', () => {
  const base = 'http://192.168.1.20:4321/kinh-tang-pali/';
  assert.equal(isTrustedPageUrl(`${base}sutta/mn/mn1/`, base), true);
  assert.equal(isTrustedPageUrl('http://192.168.1.21:4321/kinh-tang-pali/', base), false);
  assert.equal(isTrustedPageUrl('http://192.168.1.20:8081/kinh-tang-pali/', base), false);
  assert.equal(isTrustedPageUrl('http://192.168.1.20:4321/another/', base), false);
});

test('navigation links share one reading record while another sutta remains separate', () => {
  assert.equal(normalizePageUrl(`${pageUrl}?utm_source=share#mn1:7.3`), pageUrl);
  assert.notEqual(normalizePageUrl(`${WEBSITE_URL}sutta/mn/mn2/#mn2:1.1`), pageUrl);
});

test('restore requires same page, no explicit anchor and no intervening reader action', () => {
  assert.equal(shouldRestorePosition(position, pageUrl, false, false), true);
  assert.equal(shouldRestorePosition(position, `${pageUrl}?from=app`, false, false), true);
  assert.equal(shouldRestorePosition(position, `${WEBSITE_URL}sutta/mn/mn2/`, false, false), false);
  assert.equal(shouldRestorePosition(position, pageUrl, true, false), false);
  assert.equal(shouldRestorePosition(position, pageUrl, false, true), false);
  assert.equal(shouldRestorePosition(null, pageUrl, false, false), false);
});

test('reading coordinates and modes are finite, bounded and canonical', () => {
  assert.equal(isReadingPosition(position), true);
  assert.equal(isReadingPosition({ ...position, uid: null, segmentId: null, column: null }), true);
  for (const invalid of [
    { segmentOffset: -1 }, { segmentOffset: Infinity }, { scrollRatio: 1.1 }, { scrollRatio: NaN },
    { mode: 'hidden' }, { mode: ['vi'] }, { column: 'not-a-layer' }, { column: ['pali'] }, { textSize: 9 }, { textSize: 1.5 },
    { segmentId: 'made-up' }, { uid: 'MN001' }, { pageUrl: 'javascript:alert(1)' },
  ]) assert.equal(isReadingPosition({ ...position, ...invalid }), false, JSON.stringify(invalid));
});

test('native boundary rejects forged page URLs, missing versions and unbounded payloads', () => {
  assert.ok(parseWebMessage(message({ type: 'ready' }), WEBSITE_URL, pageUrl));
  assert.ok(parseWebMessage(message({ type: 'reading-progress', position }), WEBSITE_URL, `${pageUrl}#mn1:7.3`));
  assert.equal(parseWebMessage(message({ type: 'ready' }), WEBSITE_URL, `${WEBSITE_URL}sutta/mn/mn2/`), null);
  assert.equal(parseWebMessage(message({ type: 'ready' }), WEBSITE_URL, 'https://evil.example/'), null);
  assert.equal(parseWebMessage(message({ type: 'ready', v: 2 })), null);
  assert.equal(parseWebMessage(message({ type: 'ready', sessionId: '' })), null);
  assert.equal(parseWebMessage(message({ type: 'reading-progress', position: { ...position, pageUrl: `${WEBSITE_URL}sutta/mn/mn2/` } })), null);
  assert.equal(parseWebMessage(message({ type: 'delete-everything' })), null);
  assert.equal(parseWebMessage('{broken'), null);
  assert.equal(parseWebMessage(' '.repeat(MAX_BRIDGE_MESSAGE_LENGTH + 1)), null);
});

test('audio handoff preserves review status, variants and multipart source identity', () => {
  assert.equal(isNativeTrack(track), true);
  assert.ok(parseWebMessage(message({ type: 'audio-play', track, startSeconds: 0 })));
  assert.notEqual(trackKey(track), trackKey({ ...track, version: { ...track.version, id: 'children', kind: 'explanation' } }));
  assert.notEqual(trackKey(track), trackKey({ ...track, version: { ...track.version, url: 'https://audio.example.org/recording-b.mp3' } }));
  assert.notEqual(trackKey(track), trackKey({ ...track, version: { ...track.version, duration_seconds: 181 } }));
  const parts = [
    { url: track.version.url, duration_seconds: 90 },
    { url: 'https://audio.example.org/recording-a-part-2.mp3', duration_seconds: 90 },
  ];
  const multipart = { ...track, version: { ...track.version, parts } };
  assert.equal(isNativeTrack(multipart), true);
  assert.notEqual(trackKey(track), trackKey(multipart));
  assert.equal(isNativeTrack({ ...multipart, version: { ...multipart.version, parts: [parts[0], parts[0]] } }), false);
  assert.equal(isNativeTrack({ ...multipart, version: { ...multipart.version, duration_seconds: 179 } }), false);
  assert.equal(isNativeTrack({ ...track, version: { ...track.version, review_status: 'verified-by-app' } }), false);
  assert.equal(isNativeTrack({ ...track, version: { ...track.version, id: ['original'] } }), false);
  assert.equal(isNativeTrack({ ...track, version: { ...track.version, url: 'http://audio.example.org/audio.mp3' } }), false);
  assert.equal(isNativeTrack({ ...track, version: { ...track.version, url: 'https://audio.example.org/page.html' } }), false);
});

test('queue never crosses the website boundary or silently switches audio variants', () => {
  const second = { ...track, uid: 'mn2', pageUrl: `${WEBSITE_URL}sutta/mn/mn2/` };
  assert.ok(parseWebMessage(message({ type: 'audio-play', track, queue: [second] })));
  assert.equal(parseWebMessage(message({ type: 'audio-play', track, queue: [{ ...second, pageUrl: 'https://evil.example/' }] })), null);
  assert.equal(parseWebMessage(message({ type: 'audio-play', track, queue: [{ ...second, version: { ...second.version, id: 'children' } }] })), null);
  assert.equal(parseWebMessage(message({ type: 'audio-play', track, startSeconds: -1 })), null);
  assert.equal(parseWebMessage(message({ type: 'audio-play', track, startSeconds: 181 })), null);
});

test('saved listening entries resolve only to fresh metadata for the requested sutta', () => {
  const manifest = { v: 1, uid: 'mn1', title: track.title, pagePath: '/kinh-tang-pali/sutta/mn/mn1/', versions: [track.version] };
  assert.deepEqual(parseAudioManifest(manifest, WEBSITE_URL, 'mn1'), [track]);
  assert.equal(parseAudioManifest(manifest, WEBSITE_URL, 'mn2'), null);
  assert.equal(parseAudioManifest({ ...manifest, pagePath: '//evil.example/kinh-tang-pali/sutta/mn/mn1/' }), null);
  assert.equal(parseAudioManifest({ ...manifest, pagePath: '/kinh-tang-pali/sutta/mn/mn2/' }), null);
  assert.equal(parseAudioManifest({ ...manifest, versions: [track.version, track.version] }), null);
  assert.equal(parseAudioManifest({ ...manifest, versions: [] }), null);
  const changed = parseAudioManifest({ ...manifest, versions: [{ ...track.version, url: 'https://audio.example.org/new-recording.mp3' }] })!;
  assert.notEqual(trackKey(changed[0]), trackKey(track), 'A replacement recording cannot inherit a stale saved timestamp');
});

test('correlated capture acknowledgements validate request and page identities', () => {
  assert.ok(parseWebMessage(message({ type: 'captured', requestId: 'export-1', position })));
  assert.ok(parseWebMessage(message({ type: 'captured', requestId: 'export-2', position: null })));
  assert.equal(parseWebMessage(message({ type: 'captured', requestId: '', position })), null);
  assert.equal(parseWebMessage(message({ type: 'captured', requestId: 'export-3' })), null);
  assert.equal(parseWebMessage(message({ type: 'captured', requestId: 'export-4', position: { ...position, pageUrl: `${WEBSITE_URL}sutta/mn/mn2/` } })), null);
});
