import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { composeDocument } from '../src/lib/canon/document';
import { groupTexts } from '../src/lib/canon/groups';
import { loadCatalog, loadLock, loadSegmentMap, segmentBelongsToUid, sourcePathFor, upstreamFile } from '../src/lib/canon/load';
import { narrationSource } from '../src/lib/canon/audio';
import { narrationIssues } from '../src/lib/canon/audio-source';
const manifest = JSON.parse(fs.readFileSync('source/upstream-manifest.json', 'utf8'));
assert.equal(manifest.commit, loadLock().commit, 'Manifest must match pinned Pāli commit');
const edition = manifest.editions.find((e: { layerId: string }) => e.layerId === 'pali');
assert(edition, 'Pinned Pāli manifest missing');
const cases=[['an','an1-cittapariyadanavagga'],['kn','dhp1-20'],['sn','sn12-aharavagga'],['kn','snp-atthakavagga'],['an','an3-mahavagga']] as const;
const reports=cases.map(([code,id])=>{
 const uids=id==='dhp1-20'?[id]:groupTexts(code,id);
 const docs=uids.map(uid=>composeDocument(code,uid));
 const keys=new Set<string>();
 let expected=0;
 const files=new Map<string, Record<string,string>>();
 for(const doc of docs){
  assert.deepEqual(narrationIssues(doc), [], doc.uid);
  const catalog=loadCatalog(code).texts.find(t=>t.uid===doc.uid)!;
  const path=sourcePathFor(code,doc.uid,catalog.sourcePath)!;
  assert(path.startsWith(edition.path + '/'));
  const bytes = fs.readFileSync(upstreamFile(path));
  const hash = createHash('sha1').update(Buffer.from(`blob ${bytes.length}\0`)).update(bytes).digest('hex');
  assert.equal(hash, edition.files[path.slice(edition.path.length + 1)], `Pāli cache hash drift: ${path}`);
  files.set(path,loadSegmentMap(upstreamFile(path)));
  for(const [key] of narrationSource(doc).segments){assert(!keys.has(key),`Duplicate ${key}`);keys.add(key);}
 }
 for(const root of files.values())for(const [key,value] of Object.entries(root)){
  if(key.split(':')[1].startsWith('0.')||!value.trim())continue;
  const owners=uids.filter(uid=>segmentBelongsToUid(uid,key));
  if(!owners.length)continue;
  assert.equal(owners.length,1,key);assert(keys.has(key),`Omitted ${key}`);expected++;
 }
 assert.equal(keys.size,expected);
 if(id==='an1-cittapariyadanavagga'){
  assert.equal(files.size,1);
  assert(docs.every(d=>d.sourceKey==='an1.1-10'));
  for(const d of docs)assert(narrationSource(d).segments.every(([key])=>key.startsWith(d.uid+':')));
 }
 return {collection:code,case:id,uids,source_keys:[...new Set(docs.map(d=>d.sourceKey))],owned_non_title_segments:expected,duplicates:0,missing:0};
});
fs.mkdirSync('audio', { recursive: true });
fs.writeFileSync('audio/next-cases-ownership.json',JSON.stringify(reports,null,2)+'\n');
console.log(JSON.stringify(reports));
