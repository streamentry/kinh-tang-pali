import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { audioCollection, audioQueue, GROUP_AUDIO_COLLECTIONS } from '../../src/lib/canon/audio-catalog';
import { composeDocument } from '../../src/lib/canon/document';
import { narrationHash, narrationSource, loadAudio, audioPlayerData } from '../../src/lib/canon/audio';
import { narrationIssues } from '../../src/lib/canon/audio-source';
import { groupTexts } from '../../src/lib/canon/groups';
import { playlistPayload, playlistTracks } from '../../src/lib/canon/audio-playlist';
import { parsePlaylist } from '../../src/lib/audio/playlist';

test('all group reading UIDs occur exactly once, including six mixed-group direct texts', () => {
  const rows = GROUP_AUDIO_COLLECTIONS.flatMap(code => audioQueue(code));
  assert.equal(rows.length, 5951);
  assert.equal(new Set(rows.map(row => row.uid)).size, rows.length);
  assert.equal(rows.find(row => row.uid === 'cnd23')?.home_group, 'cnd');
  for (const uid of ['ne1','ne2','ne3','ne36','ne37']) assert.equal(rows.find(row => row.uid === uid)?.home_group, 'ne');
  assert.equal(audioCollection('dhp1-20'), 'kn');
  assert.equal(audioCollection('an1.5'), 'an');
  for (const invalid of ['dhp1', 'sn01.1', 'an1.1-10', '../mn1', 'kn1', 'sn1.999999']) {
    assert.throws(() => audioCollection(invalid), /Unknown/);
  }
  assert.deepEqual(groupTexts('sn','sn1-nalavagga'), Array.from({length:10},(_,i)=>`sn1.${i+1}`));
});

test('MN/DN source hashes preserve their original byte contract for every recording', () => {
  for (const code of ['mn','dn'] as const) for (const {uid} of audioQueue(code)) {
    const doc=composeDocument(code,uid);
    const old={summary:doc.summary?.trim()??'',segments:doc.segments.filter(s=>!s.id.split(':')[1].startsWith('0.')&&s.vi?.trim()).map(s=>[s.id,s.vi!.trim()])};
    assert.equal(narrationHash(doc),createHash('sha256').update(JSON.stringify(old)).digest('hex'),uid);
    assert.equal(narrationHash(doc),narrationHash({...doc,viTitle:'Changed display heading'}),uid);
  }
});

test('new source policy uses verified title and owned scripture; summaries and notes are excluded', () => {
  for(const [code,uid] of [['sn','sn1.1'],['an','an1.5'],['kn','dhp1-20']] as const) {
    const doc=composeDocument(code,uid);
    assert.deepEqual(narrationIssues(doc),[],uid);
    const source=narrationSource(doc);
    assert.equal(source.summary,'');
    assert.ok(source.segments.length);
    assert.equal(narrationHash(doc),narrationHash({...doc,summary:'Unreviewed generated summary',segments:doc.segments.map(s=>({...s,commentVi:'not spoken'}))}));
    assert.notEqual(narrationHash(doc),narrationHash({...doc,viTitle:doc.viTitle+' changed'}));
    assert.match(narrationIssues({...doc,status:'draft'}).join(';'),/status/);
  }
  const bundled=narrationSource(composeDocument('an','an1.5'));
  assert.ok(bundled.segments.every(([id])=>id.startsWith('an1.5:')));
  assert.ok(!bundled.segments.some(([id])=>id.startsWith('an1.4:')||id.startsWith('an1.6:')));
});

test('single-UID preflight keeps a native range intact without initializing production', () => {
  const queue = fs.readFileSync('content/audio/group-progress.json');
  const report = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'audio-one-uid-')), 'preflight.json');
  try {
    execFileSync('python3', ['scripts/audio-preflight.py', '--collection', 'kn', '--uid', 'dhp1-20', '--output', report]);
    const result = JSON.parse(fs.readFileSync(report, 'utf8'));
    assert.equal(result.total, 1);
    assert.equal(result.eligible, 1);
    assert.equal(result.provider_requests, 0);
    assert.deepEqual(result.texts.map((row: { uid: string }) => row.uid), ['dhp1-20']);
    assert.deepEqual(fs.readFileSync('content/audio/group-progress.json'), queue);
    assert.throws(() => execFileSync('python3', ['scripts/audio-preflight.py', '--uid', 'dhp1-20'], { stdio: 'pipe' }));
    assert.throws(() => execFileSync('python3', ['scripts/audio-preflight.py', '--collection', 'kn', '--uid', ''], { stdio: 'pipe' }));
    assert.throws(() => execFileSync('node', ['--import', 'tsx', 'scripts/audio-inventory.ts', '--collection', 'kn', '--uid', 'dhp1'], { stdio: 'pipe' }));
    assert.throws(() => execFileSync('node', ['--import', 'tsx', 'scripts/audio-inventory.ts', '--collection', 'kn', '--uid', 'dhp1-20', '--group', 'dhp'], { stdio: 'pipe' }));
  } finally { fs.rmSync(path.dirname(report), { recursive: true, force: true }); }
});

test('player fails closed on downgrade or wrong policy and never serializes manifest internals', () => {
  const doc=composeDocument('sn','sn1.1');
  const folder=fs.mkdtempSync(path.join(os.tmpdir(),'group-audio-player-'));
  const original=process.cwd();
  const entry={uid:doc.uid,url:'https://example.org/audio.mp3',source_sha256:narrationHash(doc),duration_seconds:60,scripture_start_seconds:0,voice:'Charon',review_status:'pending' as const,transcript_policy:'title-scripture-v1',narration_profile:{private:'snapshot'},qc_history:['keep out of HTML']};
  fs.mkdirSync(path.join(folder,'content/audio'),{recursive:true});
  const file=path.join(folder,'content/audio/sn1.1.json');
  try {
    process.chdir(folder);
    fs.writeFileSync(file,JSON.stringify(entry));
    assert.ok(loadAudio(doc));
    assert.equal(loadAudio({...doc,status:'draft'}),null);
    fs.writeFileSync(file,JSON.stringify({...entry,transcript_policy:undefined}));
    assert.equal(loadAudio(doc),null);
    assert.deepEqual(Object.keys(audioPlayerData(entry)).sort(),['uid','url','duration_seconds','scripture_start_seconds','review_status'].sort());
  } finally { process.chdir(original);fs.rmSync(folder,{recursive:true,force:true}); }
});

test('large playlists retain one fallback in HTML and reuse the same assets across ancestors', () => {
  const base={uid:'mn1',url:'https://example.org/audio.mp3',duration_seconds:60,scripture_start_seconds:0,review_status:'pending' as const,title:'Title',order:1};
  const many=Array.from({length:2351},(_,i)=>({...base,uid:`fixture${i}`,order:i,private_manifest:'must not be serialized'}));
  const lazy=playlistPayload(many,'/kinh-tang-pali/audio-playlists/kn/all.json');
  assert.equal(lazy.inline.length,1);
  assert.equal(lazy.url,'/kinh-tang-pali/audio-playlists/kn/all.json');
  assert.ok(JSON.stringify(lazy.inline).length<400);
  assert.ok(!JSON.stringify(lazy).includes('private_manifest'));
  assert.equal(playlistPayload(many.slice(0,10),'/unused').inline.length,10);
  assert.equal(playlistPayload(many.slice(0,10),'/unused').url,undefined);
  const tracks=playlistTracks('mn');
  assert.equal(tracks[0].uid,'mn1');
  const doc=composeDocument('mn','mn1');
  assert.equal(tracks[0].url,loadAudio(doc)?.url);
});

test('truncated, duplicate or malformed playlists preserve the native fallback path', () => {
  const track={uid:'sn1.1',title:'Tên bài',url:'https://example.org/audio.mp3',duration_seconds:60,scripture_start_seconds:0,review_status:'pending'};
  assert.equal(parsePlaylist([track],1).length,1);
  for(const invalid of [null,[],[null],[{...track,url:'javascript:alert(1)'}],[{...track,duration_seconds:NaN}],[{...track,scripture_start_seconds:60}]]) {
    assert.throws(()=>parsePlaylist(invalid,1));
  }
  assert.throws(()=>parsePlaylist([track],2));
  assert.throws(()=>parsePlaylist([track,track],2));
});

test('new transcript plans contain a separate heading without adding it to legacy speech; progress stays isolated', () => {
  execFileSync('python3',['-c',`
import sys,tempfile,json
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,'scripts')
from audio_pipeline import plan_source,subdivide_repair_chunks,audio_object_key
from narration_config import load_profile
import audio_progress as progress
p=load_profile()
source={'policy':'title-scripture-v1','title':'Tên bài.','summary':'','segments':[['sn1.1:1.1','Kinh văn.'],['sn1.1:1.2','…'],['sn1.1:1.3','Đoạn cuối.']]}
plan=plan_source(source,p)
assert [c['section'] for c in plan]==['heading','scripture','scripture']
assert plan[0]['text']=='Tên bài.'
assert plan[1]['pause_after_seconds']==2*p['chunk_pause_seconds']
assert plan_source({**source,'policy':None,'summary':'Tóm tắt.'},p)[0]['text']=='Tóm tắt.'
for collection,uid in [('sn','sn1.1'),('an','an1.5'),('kn','dhp1-20')]:
 current={**source,'uid':uid,'collection':collection}
 manifest={'uid':uid,'collection':collection,'transcript_policy':source['policy'],'scripture_start_seconds':0,'sha256':'a'*64}
 assert audio_object_key(current,manifest)==f'vi/{collection}/{uid}/'+('a'*16)+'.mp3'
 for broken in [{**manifest,'collection':'dn'},{**manifest,'scripture_start_seconds':1},{**manifest,'transcript_policy':None}]:
  try:audio_object_key(current,broken)
  except RuntimeError:pass
  else:raise AssertionError('Wrong collection or policy accepted')
assert audio_object_key({'uid':'mn1','collection':'mn'},{'uid':'mn1','sha256':'a'*64})=='vi/mn/mn1/'+('a'*16)+'.mp3'
with tempfile.TemporaryDirectory() as d:
 legacy=Path(d)/'progress.json';group=Path(d)/'group-progress.json'
 legacy.write_text('legacy sentinel')
 inventory=[{'uid':'sn1.1','collection':'sn','order':1,'source_sha256':'source','issues':[],'home_group':'sn1-nalavagga','transcript_policy':'title-scripture-v1'}]
 with patch.object(progress,'PROGRESS',legacy),patch.object(progress,'GROUP_PROGRESS',group):
  progress.initialize(inventory,'profile',group=True)
  current_source={'uid':'sn1.1','collection':'sn','source_sha256':'source','policy':'title-scripture-v1'}
  progress.require_current_group_source(current_source,'profile')
  for changed in [{**current_source,'source_sha256':'changed'},{**current_source,'collection':'an'}]:
   try:progress.require_current_group_source(changed,'profile')
   except RuntimeError:pass
   else:raise AssertionError('Queue identity/source drift accepted')
  assert legacy.read_text()=='legacy sentinel'
  legacy.write_text(json.dumps({'texts':{'mn1':{'status':'live'}}}))
  before=legacy.read_bytes()
  progress.update('sn1.1','generating',checkpoint='owned')
  assert legacy.read_bytes()==before
  progress.update('sn1.1','generated',review_status='pending')
  registry=json.loads(group.read_text())
  assert registry['schema_version']==2 and registry['texts']['sn1.1']['status']=='generated'
  progress.initialize([{**inventory[0],'source_sha256':'changed'}],'profile',group=True)
  assert json.loads(group.read_text())['texts']['sn1.1']['status']=='blocked'
  progress.initialize([{**inventory[0],'source_sha256':'changed'}],'profile',group=True)
  assert json.loads(group.read_text())['texts']['sn1.1']['errors'], 'Repeated init erased unresolved drift'
  try:progress.require_current_group_source({**current_source,'source_sha256':'changed'},'profile')
  except RuntimeError:pass
  else:raise AssertionError('Unresolved blocker was bypassed')
  try:progress.update('sn1.2','generating')
  except RuntimeError:pass
  else:raise AssertionError('Generation outside initialized queue accepted')
`],{stdio:'pipe'});
});

test('blocked group queue stops synthesis and upload before credentials or provider calls', () => {
  execFileSync('python3',['-c',`
import argparse,importlib.util,json,sys,tempfile
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,'scripts')
import gemini_tts,audio_progress
from narration_config import load_profile,profile_digest,profile_metadata
spec=importlib.util.spec_from_file_location('group_audio_uploader','scripts/audio-r2.py')
uploader=importlib.util.module_from_spec(spec);spec.loader.exec_module(uploader)
p=load_profile()
source={'uid':'sn1.1','collection':'sn','source_sha256':'source','policy':'title-scripture-v1','title':'Tên bài','summary':'','segments':[['sn1.1:1.1','Kinh văn.']]}
with tempfile.TemporaryDirectory() as d:
 root=Path(d);queue=root/'queue.json';folder=root/'artifact';folder.mkdir()
 row={'uid':'sn1.1','collection':'sn','source_sha256':'source','profile_sha256':profile_digest(p),'transcript_policy':'title-scripture-v1','status':'blocked','errors':['Retain this QC evidence']}
 queue.write_text(json.dumps({'schema_version':2,'texts':{'sn1.1':row}}));before=queue.read_bytes()
 manifest={'uid':'sn1.1','source_sha256':'source',**profile_metadata(p),**{key:p[key] for key in ('model','voice','style')}}
 (folder/'manifest.json').write_text(json.dumps(manifest))
 with patch.object(audio_progress,'GROUP_PROGRESS',queue),patch('subprocess.check_output',return_value=json.dumps(source).encode()),patch.object(gemini_tts,'ROOT',root),patch('gemini_tts.load_env') as credentials,patch.object(uploader,'load_env') as upload_credentials,patch('gemini_tts.generate') as synthesize,patch('urllib.request.urlopen') as request:
  try:gemini_tts.main(argparse.Namespace(uid='sn1.1',prepare_only=False,repair_chunks=None))
  except RuntimeError as error:assert 'unresolved blockers' in str(error)
  else:raise AssertionError('Blocked synthesis accepted')
  credentials.assert_not_called();synthesize.assert_not_called();request.assert_not_called()
  with patch('sys.argv',['audio-r2.py',str(folder)]):
   try:uploader.main()
   except RuntimeError as error:assert 'unresolved blockers' in str(error)
   else:raise AssertionError('Blocked upload accepted')
  credentials.assert_not_called();upload_credentials.assert_not_called();request.assert_not_called()
 assert queue.read_bytes()==before
`],{stdio:'pipe'});
});
