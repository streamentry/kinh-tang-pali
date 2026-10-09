import test from 'node:test';
import assert from 'node:assert/strict';
import { adjacentTexts, readAutoNext, saveAutoNext, rememberContinuation, consumeContinuation, AUTO_NEXT_KEY, CONTINUE_KEY } from '../../src/lib/audio/navigation';
const storage = () => { const values = new Map<string,string>(); return { getItem: (k:string) => values.get(k) ?? null, setItem: (k:string,v:string) => { values.set(k,v); }, removeItem: (k:string) => { values.delete(k); } }; };
test('catalog order determines next/back including collection boundaries', () => {
  const texts = [{uid:'mn10',order:10},{uid:'mn2',order:2},{uid:'mn1',order:1}];
  assert.equal(adjacentTexts(texts,'mn1').previous, undefined);
  assert.equal(adjacentTexts(texts,'mn1').next?.uid,'mn2');
  assert.equal(adjacentTexts(texts,'mn2').previous?.uid,'mn1');
  assert.equal(adjacentTexts(texts,'mn10').next, undefined);
  assert.deepEqual(adjacentTexts(texts,'unknown'),{previous:undefined,next:undefined});
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
