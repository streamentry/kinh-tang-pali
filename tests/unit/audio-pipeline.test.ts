import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { composeDocument } from '../../src/lib/canon/document';
import { narrationIssues } from '../../src/lib/canon/audio-source';

test('narration blocks draft, missing summary, unsynced Pali and missing canonical segments', () => {
 const doc=composeDocument('mn','mn1');assert.deepEqual(narrationIssues(doc),[]);
 assert.match(narrationIssues({...doc,status:'draft'}).join(';'),/status/);
 assert.match(narrationIssues({...doc,summary:''}).join(';'),/summary/);
 assert.match(narrationIssues({...doc,segments:doc.segments.map(s=>({...s,pali:undefined}))}).join(';'),/Pali/);
 assert.match(narrationIssues({...doc,segments:doc.segments.map(s=>({...s,vi:undefined}))}).join(';'),/Vietnamese missing/);
});
test('long transcript reassembles exactly and cache refuses text drift or truncated WAV', () => {
 const output=execFileSync('python3',['-c',`
import sys,tempfile,wave
from pathlib import Path
sys.path.insert(0,'scripts')
from audio_pipeline import split_text,plan_source,wav_info,cached_chunk_valid,mp3_info
from narration_config import load_profile
p=load_profile()
text=('Câu có nháy “đầy đủ.” Và câu sau …\\n\\n'*200)+'Kết thúc.'
parts=split_text(text,1400)
assert ''.join(parts)==text and all(len(s)<=1400 for s in parts)
source={'summary':text,'segments':[['dn1:1.1',text],['dn1:1.2','…'],['dn1:1.3','Đoạn cuối.']]}
plan=plan_source(source,p)
assert ''.join(s['text'] for s in plan if s['section']=='summary')==text
assert ' '.join(' '.join(s['text'] for s in plan if s['section']=='scripture').split())==' '.join((text+' Đoạn cuối.').split())
assert any(s.get('pause_after_seconds',0)>p['chunk_pause_seconds'] for s in plan)
with tempfile.TemporaryDirectory() as d:
 file=Path(d)/'chunk.wav'
 with wave.open(str(file),'wb') as w:
  w.setnchannels(1);w.setsampwidth(2);w.setframerate(24000);w.writeframes(b'\\0\\0'*1200)
 record={**plan[0],**wav_info(file,p)}
 assert cached_chunk_valid(file,record,plan[0],p)
 assert not cached_chunk_valid(file,record,{**plan[0],'text_sha256':'changed'},p)
 file.write_bytes(file.read_bytes()[:-20])
 assert not cached_chunk_valid(file,record,plan[0],p)
try:mp3_info(b'bad mp3')
except ValueError:pass
else:raise AssertionError('Bad MP3 accepted')
print('accounting and cache checks passed')
`],{encoding:'utf8'});assert.match(output,/checks passed/);
});
