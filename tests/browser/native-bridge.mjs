/**
 * Browser integration checks using the actual website bridge and audio component
 * scripts, with a small rendered fixture. Requires the test-only `playwright`
 * package and its Chromium browser; no corpus sync, audio network or app binary.
 * Run from the repository: node tests/browser/native-bridge.mjs
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const { build } = require('esbuild');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const components = path.join(root, 'src/components');
const source = name => fs.readFileSync(path.join(components, `${name}.astro`), 'utf8');
const componentScript = name => source(name).match(/<script>\s*([\s\S]*?)<\/script>/)?.[1];
const readerScript = source('SuttaReader').match(/<script is:inline>\s*([\s\S]*?)<\/script>/)[1];
const bundle = await build({
  stdin: {
    contents: "import 'fixture:SuttaAudio'; import 'fixture:CollectionAudio'; import { installNativeBridge } from '../lib/native/web-bridge'; installNativeBridge();",
    resolveDir: components, loader: 'ts',
  },
  bundle: true, write: false, format: 'iife', target: 'es2022',
  plugins: [{ name: 'astro-component-scripts', setup(builder) {
    builder.onResolve({ filter: /^fixture:/ }, args => ({ path: args.path.slice('fixture:'.length), namespace: 'astro-script' }));
    builder.onLoad({ filter: /.*/, namespace: 'astro-script' }, args => ({ contents: componentScript(args.path), loader: 'ts', resolveDir: components }));
  } }],
});
const runtime = bundle.outputFiles[0].text;
const original = {
  id: 'original', label: 'Kinh văn Việt 2026', description: 'Bản kinh văn.', kind: 'sutta',
  url: 'https://audio.example.org/one.mp3', duration_seconds: 180,
  scripture_start_seconds: 20, start_seconds: 20, review_status: 'pending',
};
const children = { ...original, id: 'children', label: 'Diễn giải cho trẻ em', description: 'Diễn giải, không phải kinh văn.', kind: 'explanation', url: 'https://audio.example.org/one-children.mp3', start_seconds: 0, scripture_start_seconds: 0 };
const tracks = ['mn1', 'mn2'].map((uid, index) => {
  const versions = [original, children].map(version => ({ ...version, url: version.url.replace('one', String(index + 1)) }));
  return { uid, title: `Bài ${index + 1}`, order: index + 1, url: versions[0].url,
    duration_seconds: 180, scripture_start_seconds: 20, review_status: 'pending', versions };
});
const escapeAttr = value => JSON.stringify(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
function fixture(route) {
  const native = !route.startsWith('/browser');
  const audio = route.includes('/audio');
  const playlist = route.includes('/playlist');
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Kinh Pháp Môn Căn Bản · Kinh Tạng Pāli Việt</title>
    <style>body{margin:0;font-family:serif;background:#f9faf7}main{padding:16px}.segment{height:calc(250px * var(--reader-scale, 1));border-top:1px solid #d8dfd6}header{height:260px}button,select{min-height:44px}button{padding:8px}footer{height:500px}.listening-options{display:flex;flex-wrap:wrap;gap:8px;padding:20px}.listen-version{display:flex;gap:8px}.collection-audio-current,.listen-version-description{flex-basis:100%}[hidden]{display:none!important}</style>
    ${native ? '<script>window.__messages=[];window.ReactNativeWebView={postMessage(value){window.__messages.push(JSON.parse(value));}};</script>' : ''}
    </head><body>
    ${audio ? `<sutta-audio id="lang-nghe" style="display:block;min-height:900px" data-native-uid="mn1" data-native-title="Kinh Pháp Môn Căn Bản" data-versions="${escapeAttr([original, children])}"><div><p data-track-label>${original.label}</p><span data-track-review>Chờ nghe duyệt</span><span data-track-length>3 phút</span></div><audio controls></audio><div class="listening-custom" hidden></div><div class="listening-footer"><a data-open-track href="${original.url}">Mở MP3</a></div></sutta-audio>` : ''}
    ${playlist ? `<sutta-playlist data-native-text-base="/kinh-tang-pali/sutta/mn/" data-tracks="[]" data-tracks-src="/kinh-tang-pali/fixture-playlist.json" data-track-count="2"><section class="collection-listening"><audio controls></audio><p data-playlist-error hidden>Không tải được danh sách</p><div class="listening-custom" hidden></div></section>${tracks.map(track => `<div data-audio-row><div class="sutta-row-audio"><button data-play-track="${track.uid}" hidden><span data-row-label>Phát</span></button><a data-audio-fallback href="#">MP3</a></div></div>`).join('')}</sutta-playlist>` : ''}
    <header>Thư viện kinh văn</header><main data-native-reader data-native-uid="mn1" data-native-title="Kinh Pháp Môn Căn Bản">
    <section class="reader-shell" data-reader-mode="vi"><div class="reader-toolbar">
      <div>${['vi', 'compare', 'interlinear'].map(mode => `<button data-mode="${mode}" aria-pressed="${mode === 'vi'}">${mode}</button>`).join('')}</div>
      <div class="text-size" hidden><button data-size-step="-1">A−</button><output class="text-size-value">100%</output><button data-size-step="1">A+</button></div>
      <div>${['pali', 'english', 'viCurrent', 'vi'].map(column => `<button class="column-tab" data-column="${column}" aria-pressed="false">${column}</button>`).join('')}</div></div>
      ${Array.from({ length: 14 }, (_, i) => `<article class="segment" data-segment-id="mn1:${i + 1}.1" id="mn1:${i + 1}.1"><div class="cell" data-column="vi">Đoạn ${i + 1}</div></article>`).join('')}
    </section></main><footer>Nguồn và giấy phép</footer><script>${readerScript}</script><script>${runtime}</script></body></html>`;
}
const server = http.createServer((request, response) => {
  if (request.url === '/kinh-tang-pali/fixture-playlist.json') {
    response.writeHead(200, { 'content-type': 'application/json' }); response.end(JSON.stringify(tracks)); return;
  }
  response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); response.end(fixture(request.url));
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}) });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const url = `${base}/kinh-tang-pali/sutta/mn/mn1/`;
const saved = { pageUrl: url, title: 'Kinh Pháp Môn Căn Bản', uid: 'mn1', segmentId: 'mn1:8.1', segmentOffset: 0.25, scrollRatio: 0.5, mode: 'compare', column: 'pali', textSize: 3 };
const ready = async () => {
  await page.waitForFunction(() => window.__messages?.some(message => message.type === 'ready'));
  return page.evaluate(() => window.__messages.find(message => message.type === 'ready'));
};
const restore = async (position, session) => {
  await page.evaluate(({ position, sessionId }) => window.__KINH_NATIVE__.receive({ v: 1, type: 'restore', sessionId, position }), { position, sessionId: session.sessionId });
};
try {
  await page.goto(url);
  let session = await ready();
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(700);
  assert.equal(await page.evaluate(() => window.__messages.filter(message => message.type === 'reading-progress').length), 0, 'No initial-zero progress before hydration');
  await page.evaluate(sessionId => window.__KINH_NATIVE__.receive({ v: 1, type: 'capture', sessionId, requestId: 'before-hydration' }), session.sessionId);
  assert.equal(await page.evaluate(() => window.__messages.find(message => message.type === 'captured' && message.requestId === 'before-hydration').position), null);
  await restore(saved, { sessionId: 'stale-document' });
  await page.waitForTimeout(50);
  assert.equal(await page.evaluate(() => window.__messages.filter(message => message.type === 'reading-progress').length), 0);
  await restore(saved, session);
  await page.waitForFunction(() => window.__messages.some(message => message.type === 'reading-progress'));
  let state = await page.evaluate(() => ({
    position: window.__messages.filter(message => message.type === 'reading-progress').at(-1).position,
    mode: document.querySelector('.reader-shell').dataset.readerMode,
    column: document.querySelector('.reader-shell').dataset.focus,
    size: document.querySelector('.text-size-value').textContent,
  }));
  assert.equal(state.position.segmentId, saved.segmentId);
  assert.ok(Math.abs(state.position.segmentOffset - saved.segmentOffset) < 0.01);
  assert.equal(state.mode, 'compare'); assert.equal(state.column, 'pali'); assert.equal(state.size, '120%');
  await page.evaluate(() => { window.scrollTo(0, 900); window.__KINH_NATIVE__.capture(); });
  const afterCapture = await page.evaluate(() => window.__messages.filter(message => message.type === 'reading-progress').at(-1).position);
  assert.notEqual(afterCapture.segmentId, saved.segmentId, 'Capture flushes the current position immediately');
  await page.evaluate(sessionId => window.__KINH_NATIVE__.receive({ v: 1, type: 'capture', sessionId, requestId: 'export-progress' }), session.sessionId);
  const captured = await page.evaluate(() => window.__messages.filter(message => message.type === 'captured' && message.requestId === 'export-progress'));
  assert.equal(captured.length, 1);
  assert.equal(captured[0].position.segmentId, afterCapture.segmentId);
  await restore(saved, session);
  assert.equal(await page.evaluate(() => window.scrollY), 900, 'A repeated ready response cannot reset ongoing reading');
  console.log('PASS hydration gate, stale sessions, semantic restore, preferences, capture and idempotence');

  await page.goto(`${url}#mn1:11.1`); session = await ready();
  await restore(saved, session);
  await page.waitForFunction(() => window.__messages.some(message => message.type === 'reading-progress'));
  assert.ok(Math.abs(await page.locator('[id="mn1:11.1"]').evaluate(element => element.getBoundingClientRect().top)) < 30, 'An explicit segment link wins over saved progress');
  console.log('PASS explicit anchor preservation');

  await page.goto(url); session = await ready();
  await page.mouse.wheel(0, 750); await page.waitForTimeout(100);
  const userScroll = await page.evaluate(() => window.scrollY);
  await restore(saved, session);
  await page.waitForFunction(() => window.__messages.some(message => message.type === 'reading-progress'));
  assert.equal(await page.evaluate(() => window.scrollY), userScroll, 'A reader action during hydration wins over automatic resume');
  console.log('PASS interaction during hydration');

  const audioUrl = `${base}/kinh-tang-pali/audio/`;
  await page.goto(`${audioUrl}#lang-nghe`); session = await ready();
  await restore({ ...saved, pageUrl: audioUrl }, session);
  await page.waitForTimeout(750);
  await page.locator('[data-native-audio] select').selectOption('children');
  await page.getByRole('button', { name: 'Nghe trong ứng dụng', exact: true }).click();
  let request = await page.evaluate(() => window.__messages.findLast(message => message.type === 'audio-play'));
  assert.equal(request.track.version.id, 'children'); assert.equal(request.track.version.kind, 'explanation');
  assert.equal(request.track.version.review_status, 'pending'); assert.equal(request.startSeconds, undefined);
  assert.equal(await page.locator('[data-open-track]').getAttribute('href'), children.url);
  assert.equal(await page.locator('[data-open-track]').getAttribute('aria-label'), `Mở MP3: ${children.label}`);
  assert.equal(await page.locator('audio').evaluate(audio => audio.paused && audio.hidden && !audio.hasAttribute('src')), true);
  assert.equal(await page.evaluate(() => window.__messages.filter(message => message.type === 'reading-progress').length), 0, 'Opening audio and playing it must not erase a saved scripture paragraph');
  await page.getByRole('button', { name: 'Nghe từ đầu', exact: true }).click();
  request = await page.evaluate(() => window.__messages.findLast(message => message.type === 'audio-play'));
  assert.equal(request.startSeconds, 0);
  console.log('PASS native sutta handoff, version identity, explicit restart, one audio engine');

  await page.goto(`${base}/kinh-tang-pali/playlist/`); await ready();
  await page.locator('[data-native-audio] select').selectOption('children');
  await page.locator('[data-play-track="mn1"]').click();
  request = await page.evaluate(() => window.__messages.findLast(message => message.type === 'audio-play'));
  assert.equal(request.track.uid, 'mn1'); assert.equal(request.track.version.id, 'children');
  assert.equal(request.queue.length, 1); assert.equal(request.queue[0].uid, 'mn2');
  assert.equal(request.queue[0].version.id, 'children');
  assert.equal(request.track.pageUrl, `${base}/kinh-tang-pali/sutta/mn/mn1/`);
  await page.getByRole('switch').uncheck();
  await page.locator('[data-play-track="mn1"]').click();
  request = await page.evaluate(() => window.__messages.findLast(message => message.type === 'audio-play'));
  assert.equal(request.queue, undefined);
  await page.locator('[data-play-track="mn2"]').click();
  request = await page.evaluate(() => window.__messages.findLast(message => message.type === 'audio-play'));
  assert.equal(request.track.uid, 'mn2');
  console.log('PASS lazy playlist handoff, same-variant queue, auto-next preference and row controls');

  await page.goto(`${base}/browser/`);
  assert.equal(await page.evaluate(() => Boolean(window.__KINH_NATIVE__)), false);
  assert.equal(await page.evaluate(() => document.documentElement.dataset.nativeApp), undefined);
  assert.deepEqual(errors, [], 'No uncaught script errors');
  console.log('PASS ordinary browser unaffected; all native bridge integration checks passed');
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
