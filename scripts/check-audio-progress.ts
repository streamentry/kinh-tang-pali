import fs from 'node:fs';
import { loadCatalog } from '../src/lib/canon/load';
import { composeDocument } from '../src/lib/canon/document';
import { hasAudioRegistration, loadAudio, narrationHash } from '../src/lib/canon/audio';
import { narrationIssues } from '../src/lib/canon/audio-source';
import { audioQueue, GROUP_AUDIO_COLLECTIONS } from '../src/lib/canon/audio-catalog';
import { execFileSync } from 'node:child_process';
const profile=JSON.parse(fs.readFileSync('source/narration-profile.json','utf8'));
const profileHash=execFileSync('python3',['-c',"import sys;sys.path.insert(0,'scripts');from narration_config import load_profile,profile_digest;print(profile_digest(load_profile()))"],{encoding:'utf8'}).trim();
const errors:string[]=[];
const allowed=new Set(['not-started','generating','generated','uploaded-verified','merged','live','blocked']);
const files=['content/audio/progress.json'];
if(fs.existsSync('content/audio/group-progress.json'))files.push('content/audio/group-progress.json');
let total=0;
const queuedGroupUids=new Set<string>();
for(const file of files) {
const group=file.endsWith('/group-progress.json');
const progress=JSON.parse(fs.readFileSync(file,'utf8'));
if(progress.schema_version!==(group?2:1))errors.push(`${file}: unexpected schema version`);
const full=group?GROUP_AUDIO_COLLECTIONS.flatMap(c=>audioQueue(c).map(t=>({c,uid:t.uid,order:t.order,home:t.home_group})))
  :(['mn','dn'] as const).flatMap(c=>loadCatalog(c).texts.slice().sort((a,b)=>a.order-b.order).map(t=>({c,uid:t.uid,order:t.order,home:null})));
// The new registry is an explicit, incrementally initialized production queue.
// Inventory --groups accounts for all candidates; no absent row means generated.
const expected=group?full.filter(t=>Object.hasOwn(progress.texts,t.uid)):full;
if(group)for(const row of expected)queuedGroupUids.add(row.uid);
total+=expected.length;
if (JSON.stringify(progress.catalog_uids)!==JSON.stringify(expected.map(t=>t.uid))) errors.push('Progress catalog order/coverage differs');
if (Object.keys(progress.texts).length!==expected.length) errors.push('Progress entries missing or extra');
for (const {c,uid} of expected) {
 const row=progress.texts[uid];if (!row) {errors.push(`${uid}: entry missing`);continue;}
 if (!allowed.has(row.status)) errors.push(`${uid}: invalid progress state`);
 if (row.uid!==uid||row.collection!==c) errors.push(`${uid}: wrong identity`);
 if(row.profile_sha256!==profileHash&&row.status!=='blocked')errors.push(`${uid}: unacknowledged profile drift`);
 if(group) {
   const identity=expected.find(t=>t.uid===uid)!;
   if(row.order!==identity.order||row.home_group!==identity.home||row.transcript_policy!=='title-scripture-v1')errors.push(`${uid}: queue identity/policy differs from navigation`);
 }
 const doc=composeDocument(c,uid); const issues=narrationIssues(doc);
 if (row.source_sha256!==narrationHash(doc)&&row.status!=='blocked') errors.push(`${uid}: unacknowledged source drift`);
 if (issues.length&&row.status!=='blocked') errors.push(`${uid}: source failures not marked blocked`);
 if (['uploaded-verified','merged','live'].includes(row.status)) {
   const audio=loadAudio(doc);
   if (!audio||row.url!==audio.url||!(row.bytes>0)||!row.sha256||!row.public_range_verified||!row.playback_verified_at) errors.push(`${uid}: incomplete upload/player evidence`);
   if (audio&&JSON.stringify((audio as any).narration_profile)!==JSON.stringify(profile)) errors.push(`${uid}: profile snapshot mismatch`);
 }
 if (['merged','live'].includes(row.status)&&(!row.merge_commit||!row.pr_url)) errors.push(`${uid}: merge evidence missing`);
 if (row.status==='live'&&(!row.production_page||!row.live_verified_at)) errors.push(`${uid}: live evidence missing`);
 if (row.status==='blocked'&&!row.errors?.length) errors.push(`${uid}: blocked without reason`);
}
}
for(const collection of GROUP_AUDIO_COLLECTIONS)for(const {uid} of audioQueue(collection)) {
 if(hasAudioRegistration(uid)&&!queuedGroupUids.has(uid))errors.push(`${uid}: audio registration missing from production queue`);
}
console.log(`Audio progress: ${total} queued texts, ${errors.length} errors`);
for (const e of errors)console.error(e);
if(errors.length)process.exitCode=1;
