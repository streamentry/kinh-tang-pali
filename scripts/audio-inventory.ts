import fs from 'node:fs';
import { loadCatalog } from '../src/lib/canon/load';
import { composeDocument } from '../src/lib/canon/document';
import { narrationHash, loadAudio } from '../src/lib/canon/audio';
import { narrationIssues } from '../src/lib/canon/audio-source';
const texts = (['mn','dn'] as const).flatMap(collection => loadCatalog(collection).texts.slice().sort((a,b)=>a.order-b.order).map(item => {
  const doc = composeDocument(collection,item.uid);
  const issues = narrationIssues(doc);
  const audio = loadAudio(doc);
  return {uid:item.uid,collection,order:item.order,source_sha256:narrationHash(doc),issues,audio:audio ?? null};
}));
if (process.argv.includes('--write')) fs.writeFileSync('audio/inventory.json',JSON.stringify(texts,null,2)+'\n');
else console.log(JSON.stringify(texts));
