import test from 'node:test';
import assert from 'node:assert/strict';
import { locatePart, validParts, ReadingPlayer } from '../../src/lib/audio/parts';
import { audioPlayerData } from '../../src/lib/canon/audio';
import { execFileSync } from 'node:child_process';
const parts = [{url: 'https://example.com/1.mp3', duration_seconds: 100}, {url: 'https://example.com/2.mp3', duration_seconds: 20}];
test('parts validate ordered URLs and total duration; global seeking crosses boundaries', () => {
  const track = {url: parts[0].url, duration_seconds: 120, parts};
  assert.ok(validParts(track));
  assert.ok(!validParts({...track, duration_seconds: 100}));
  assert.ok(!validParts({...track, parts: [parts[0], parts[0]]}));
  assert.ok(!validParts({...track, parts: [{...parts[0],url:'javascript:alert(1)'}, parts[1]]}));
  assert.deepEqual(locatePart(parts, 100), {index: 1, time: 0});
  assert.deepEqual(locatePart(parts, 115), {index: 1, time: 15});
  assert.deepEqual(locatePart(parts, -10), {index: 0, time: 0});
  assert.deepEqual(locatePart(parts, 999), {index: 1, time: 20});
});
class FakeAudio extends EventTarget {
  src = parts[0].url; currentTime = 0; duration = 100; playbackRate = 1.25; paused = false; ended = false;
  pause() { this.paused = true; }
  load() { this.currentTime = 0; this.ended = false; }
  async play() { this.paused = false; }
}
test('an internal ended event never reaches reading auto-next and retains speed/seek', async () => {
  const audio = new FakeAudio();
  const errors: unknown[] = [];
  const player = new ReadingPlayer(audio as unknown as HTMLAudioElement, {url:parts[0].url, duration_seconds:120, parts}, e => errors.push(e));
  let finished = 0; audio.addEventListener('ended', () => finished++);
  audio.dispatchEvent(new Event('ended'));
  assert.equal(finished, 0); assert.equal(audio.src, parts[1].url);
  audio.dispatchEvent(new Event('loadedmetadata'));
  assert.equal(player.currentTime, 100); assert.equal(audio.playbackRate, 1.25);
  player.seek(40); audio.dispatchEvent(new Event('loadedmetadata'));
  assert.equal(player.currentTime, 40); assert.equal(audio.src, parts[0].url);
  player.seek(110); audio.dispatchEvent(new Event('loadedmetadata'));
  assert.equal(player.currentTime, 110);
  audio.ended = true; audio.dispatchEvent(new Event('ended'));
  assert.equal(finished, 1); assert.ok(player.ended);
  player.seek(0); audio.dispatchEvent(new Event('loadedmetadata'));
  assert.equal(player.currentTime, 0); assert.equal(player.partNumber, 1);
  assert.deepEqual(errors, []); player.destroy();
});
test('offline reading packaging checks source and partitions without new TTS', () => {
  execFileSync('python3', ['tests/python/audio_reading_parts_test.py'], {stdio:'pipe'});
  execFileSync('python3', ['tests/python/audio_parts_upload_test.py'], {stdio:'pipe'});
});

test('public player parts strip cache paths, hashes and production evidence', () => {
  const entry = { uid:'sn1.1', url:parts[0].url, duration_seconds:120, scripture_start_seconds:0,
    review_status:'pending' as const, parts:parts.map(p => ({...p, sha256:'private-build-hash', path:'/private/cache.wav', public_range_verified:true})) };
  const dto=audioPlayerData(entry);
  assert.deepEqual(dto.parts,parts);
  assert.ok(!JSON.stringify(dto).includes('cache.wav'));
  assert.ok(!JSON.stringify(dto).includes('private-build-hash'));
});
