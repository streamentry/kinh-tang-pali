import test from 'node:test';
import assert from 'node:assert/strict';
import { currentAudioTrack } from '../../apps/mobile/src/current-audio';
import { trackKey } from '../../src/lib/native/protocol';
import { siteUrl, track } from '../helpers/mobile';

const manifest = (source = track()) => ({
  v: 1, uid: source.uid, title: source.title,
  pagePath: `/kinh-tang-pali/sutta/mn/${source.uid}/`, versions: [source.version],
});
const fetchJson = (data: unknown, status = 200): typeof fetch => async () => new Response(JSON.stringify(data), { status });

test('saved listening refreshes the current website manifest before selecting the same variant', async () => {
  const saved = track();
  const current = { ...saved, title: 'Tiêu đề đã cập nhật', version: { ...saved.version, url: 'https://audio.example.org/mn1-new.mp3' } };
  let requested = '';
  const resolved = await currentAudioTrack(saved, siteUrl, async (input, init) => {
    requested = String(input);
    assert.equal(init?.cache, 'no-cache');
    return fetchJson(manifest(current))(input, init);
  });
  assert.equal(requested, `${siteUrl}app/audio/mn/mn1.json`);
  assert.equal(resolved.title, current.title);
  assert.notEqual(trackKey(resolved), trackKey(saved));
});

test('removed variants never silently fall back to the original recording', async () => {
  const saved = track();
  saved.version = { ...saved.version, id: 'children', kind: 'explanation' };
  await assert.rejects(currentAudioTrack(saved, siteUrl, fetchJson(manifest())), /không còn được phát hành/);
});

test('removed or malformed current metadata cannot replay a cached recording', async () => {
  await assert.rejects(currentAudioTrack(track(), siteUrl, fetchJson({}, 404)), /chưa có/);
  await assert.rejects(currentAudioTrack(track(), siteUrl, fetchJson({ ...manifest(), uid: 'mn2' })), /không hợp lệ/);
  await assert.rejects(currentAudioTrack(track(), siteUrl, fetchJson({ ...manifest(), pagePath: 'https://example.org/mn1/' })), /không hợp lệ/);
});

test('development origin is used for both metadata and returned reader URL', async () => {
  const local = 'http://192.168.1.10:4321/kinh-tang-pali/';
  const saved = { ...track(), pageUrl: `${local}sutta/mn/mn1/` };
  const resolved = await currentAudioTrack(saved, local, fetchJson(manifest()));
  assert.equal(resolved.pageUrl, saved.pageUrl);
});

test('foreign saved pages cannot issue a current-audio request', async () => {
  let requests = 0;
  const saved = { ...track(), pageUrl: 'https://example.org/kinh-tang-pali/sutta/mn/mn1/' };
  await assert.rejects(currentAudioTrack(saved, siteUrl, async () => {
    ++requests; return new Response();
  }), /thư viện khác/);
  assert.equal(requests, 0);
});

test('an already-cancelled resume does not start a network request', async () => {
  const controller = new AbortController(); controller.abort();
  let requests = 0;
  await assert.rejects(currentAudioTrack(track(), siteUrl, async () => {
    ++requests; return new Response();
  }, controller.signal), { name: 'AbortError' });
  assert.equal(requests, 0);
});

test('explicit cancellation propagates to fetch and rejects even if fetch ignores the abort', async () => {
  const controller = new AbortController();
  let resolve!: (response: Response) => void;
  let requestSignal: AbortSignal | null = null;
  const pending = currentAudioTrack(track(), siteUrl, async (_url, init) => {
    requestSignal = init?.signal ?? null;
    return new Promise<Response>(complete => { resolve = complete; });
  }, controller.signal);
  controller.abort();
  assert.equal((requestSignal as AbortSignal | null)?.aborted, true);
  resolve(new Response(JSON.stringify(manifest())));
  await assert.rejects(pending, { name: 'AbortError' });
});

test('cancellation while reading the manifest body cannot return a playable track', async () => {
  const controller = new AbortController();
  const fetcher: typeof fetch = async () => ({
    ok: true,
    json: async () => { controller.abort(); return manifest(); },
  } as Response);
  await assert.rejects(currentAudioTrack(track(), siteUrl, fetcher, controller.signal), { name: 'AbortError' });
});
