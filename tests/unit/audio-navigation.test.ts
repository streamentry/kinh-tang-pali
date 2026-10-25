import test from 'node:test';
import assert from 'node:assert/strict';
import { adjacentTexts, orderedAudioItems, stepAudioIndex, readAutoNext, saveAutoNext, rememberContinuation, consumeContinuation, playlistIndexFromHash, playlistTrackUrl, AUTO_NEXT_KEY, CONTINUE_KEY } from '../../src/lib/audio/navigation';
const storage = () => { const values = new Map<string,string>(); return { getItem: (k:string) => values.get(k) ?? null, setItem: (k:string,v:string) => { values.set(k,v); }, removeItem: (k:string) => { values.delete(k); } }; };
test('catalog order determines next/back including collection boundaries', () => {
  const texts = [{uid:'mn10',order:10},{uid:'mn2',order:2},{uid:'mn1',order:1}];
  assert.equal(adjacentTexts(texts,'mn1').previous, undefined);
  assert.equal(adjacentTexts(texts,'mn1').next?.uid,'mn2');
  assert.equal(adjacentTexts(texts,'mn2').previous?.uid,'mn1');
  assert.equal(adjacentTexts(texts,'mn10').next, undefined);
  assert.deepEqual(adjacentTexts(texts,'unknown'),{previous:undefined,next:undefined});
});
test('collection audio queue skips unregistered items and follows catalog order', () => {
  const rows = [
    { uid: 'mn3', order: 3, audio: { url: '/mn3.mp3' } },
    { uid: 'mn2', order: 2, audio: null },
    { uid: 'mn1', order: 1, audio: { url: '/mn1.mp3' } },
  ];
  assert.deepEqual(orderedAudioItems(rows).map(row => row.uid), ['mn1', 'mn3']);
  assert.deepEqual(rows.map(row => row.uid), ['mn3', 'mn2', 'mn1']);
});
test('audio queue previous and next stop at boundaries without wrapping', () => {
  assert.equal(stepAudioIndex(0, 3, -1), null);
  assert.equal(stepAudioIndex(0, 3, 1), 1);
  assert.equal(stepAudioIndex(2, 3, 1), null);
  assert.equal(stepAudioIndex(2, 3, -1), 1);
  assert.equal(stepAudioIndex(0, 0, 1), null);
});
test('playlist links resolve only one available canonical UID', () => {
  const tracks = [{uid:'sn1.1'}, {uid:'sn43.14-43'}, {uid:'an1.5'}];
  assert.equal(playlistIndexFromHash('#play=sn43.14-43',tracks),1);
  assert.equal(playlistIndexFromHash('#play=sn1%2E1',tracks),0);
  for (const hash of ['', '#main-content', '#play=', '#play=sn999.1', '#play=sn1.1&play=an1.5', '#play=%E0%A4%A'])
    assert.equal(playlistIndexFromHash(hash,tracks),null,hash);
  assert.equal(playlistIndexFromHash('#play=sn1.1',[]),null);
});
test('playlist track URLs preserve the page and query while replacing the fragment', () => {
  assert.equal(playlistTrackUrl('https://example.com/kinh-tang-pali/sutta/sn/nhom/group/?view=all#main-content','sn43.14-43'),
    'https://example.com/kinh-tang-pali/sutta/sn/nhom/group/?view=all#play=sn43.14-43');
});
test('auto next defaults on and persists off/on, surviving denied storage', () => {
  const s=storage(); assert.equal(readAutoNext(s),true);
  saveAutoNext(s,false); assert.equal(readAutoNext(s),false);
  saveAutoNext(s,true); assert.equal(readAutoNext(s),true);
  const denied={getItem:()=>{throw Error();},setItem:()=>{throw Error();},removeItem:()=>{throw Error();}};
  assert.equal(readAutoNext(denied),true);assert.doesNotThrow(()=>saveAutoNext(denied,false));
});
test('continuation starts only the intended next page once and expires', () => {
  const s=storage();rememberContinuation(s,'/base/mn2/',100);
  assert.equal(consumeContinuation(s,'/base/mn2/',200),true);
  assert.equal(consumeContinuation(s,'/base/mn2/',201),false);
  rememberContinuation(s,'/base/mn2/',100);assert.equal(consumeContinuation(s,'/base/mn3/',200),false);
  rememberContinuation(s,'/base/mn2/',100);assert.equal(consumeContinuation(s,'/base/mn2/',60100),false);
  s.setItem(CONTINUE_KEY,'bad json');assert.equal(consumeContinuation(s,'/base/mn2/',200),false);
  assert.equal(s.getItem(CONTINUE_KEY),null);assert.equal(s.getItem(AUTO_NEXT_KEY),null);
});
