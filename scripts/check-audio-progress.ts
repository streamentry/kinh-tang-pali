import fs from 'node:fs';
import { loadCatalog } from '../src/lib/canon/load';
import { composeDocument } from '../src/lib/canon/document';
import { loadAudio, narrationHash } from '../src/lib/canon/audio';
import { narrationIssues } from '../src/lib/canon/audio-source';
const progress=JSON.parse(fs.readFileSync('content/audio/progress.json','utf8'));
const profile=JSON.parse(fs.readFileSync('source/narration-profile.json','utf8'));
const expected=(['mn','dn'] as const).flatMap(c=>loadCatalog(c).texts.slice().sort((a,b)=>a.order-b.order).map(t=>({c,uid:t.uid})));
const errors:string[]=[];
const allowed=new Set(['not-started','generating','generated','uploaded-verified','merged','live','blocked']);
if (JSON.stringify(progress.catalog_uids)!==JSON.stringify(expected.map(t=>t.uid))) errors.push('Progress catalog order/coverage differs');
if (Object.keys(progress.texts).length!==expected.length) errors.push('Progress entries missing or extra');
for (const {c,uid} of expected) {
 const row=progress.texts[uid];if (!row) {errors.push(`${uid}: entry missing`);continue;}
 if (!allowed.has(row.status)) errors.push(`${uid}: invalid progress state`);
 if (row.uid!==uid||row.collection!==c) errors.push(`${uid}: wrong identity`);
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
console.log(`Audio progress: ${expected.length} catalog texts, ${errors.length} errors`);
for (const e of errors)console.error(e);
if(errors.length)process.exitCode=1;
