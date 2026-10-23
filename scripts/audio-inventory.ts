import fs from 'node:fs';
import { composeDocument } from '../src/lib/canon/document';
import { narrationHash, narrationSource, loadAudio } from '../src/lib/canon/audio';
import { narrationIssues } from '../src/lib/canon/audio-source';
import { audioQueue, GROUP_AUDIO_COLLECTIONS } from '../src/lib/canon/audio-catalog';
import { groupNode, groupTexts, hasNavigation } from '../src/lib/canon/groups';
import type { CollectionCode } from '../src/lib/canon/types';
import { parseArgs } from 'node:util';
const { values } = parseArgs({ options: {
  write: { type: 'boolean' }, groups: { type: 'boolean' },
  collection: { type: 'string' }, group: { type: 'string' },
  'include-source': { type: 'boolean' },
} });
if (values.collection && !['mn','dn','sn','an','kn'].includes(values.collection)) throw new Error('Unknown collection');
if (values.group && (!values.collection || !hasNavigation(values.collection as CollectionCode)
  || !groupNode(values.collection as 'sn' | 'an' | 'kn', values.group))) throw new Error('Provide a valid collection and group');
const collections: readonly CollectionCode[] = values.collection ? [values.collection as CollectionCode]
  : values.groups ? GROUP_AUDIO_COLLECTIONS : ['mn','dn'];
const members = values.group ? new Set(groupTexts(values.collection as 'sn' | 'an' | 'kn', values.group)) : null;
const texts = collections.flatMap(collection => audioQueue(collection).filter(item => !members || members.has(item.uid)).map(item => {
  const doc = composeDocument(collection, item.uid);
  const issues = narrationIssues(doc);
  const audio = loadAudio(doc);
  return {...item, source_sha256:narrationHash(doc), transcript_policy: collection === 'mn' || collection === 'dn' ? 'summary-scripture-v1' : 'title-scripture-v1',
    scripture_segments: doc.segments.filter(s => !s.id.split(':')[1].startsWith('0.') && s.vi?.trim()).length,
    issues, audio:audio ?? null,
    ...(values['include-source'] ? {source:{uid:item.uid,collection,title:doc.viTitle,source_sha256:narrationHash(doc),...narrationSource(doc)}} : {})};
}));
if (values.write) {
  fs.mkdirSync('audio',{recursive:true});
  fs.writeFileSync('audio/inventory.json',JSON.stringify(texts,null,2)+'\n');
} else console.log(JSON.stringify(texts));
