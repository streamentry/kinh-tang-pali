/** Local compilation input; no provider calls or registration writes. */
import { parseArgs } from 'node:util';
import { groupNode, groupTexts } from '../src/lib/canon/groups';
import { composeDocument } from '../src/lib/canon/document';
import { loadAudio, narrationHash, narrationSource } from '../src/lib/canon/audio';
import { narrationIssues } from '../src/lib/canon/audio-source';
import type { NavigationCollectionCode } from '../src/lib/canon/navigation-types';

const { values } = parseArgs({ options: { collection: { type: 'string' }, group: { type: 'string' } } });
if (!values.collection || !['sn', 'an', 'kn'].includes(values.collection) || !values.group) {
  throw new Error('Provide --collection sn|an|kn and --group <existing leaf group>');
}
const collection = values.collection as NavigationCollectionCode;
const node = groupNode(collection, values.group);
if (!node || node.children.some(child => child.type !== 'text')) {
  throw new Error('Continuous exports require a real group whose children are reading texts');
}
const texts = groupTexts(collection, node.id).map(uid => {
  const doc = composeDocument(collection, uid);
  const issues = narrationIssues(doc);
  const audio = loadAudio(doc);
  if (issues.length || !audio) throw new Error(`${uid}: ${issues.join('; ') || 'missing or stale audio'}`);
  return { source: { uid, collection, title: doc.viTitle, source_sha256: narrationHash(doc), ...narrationSource(doc) }, audio };
});
if (!texts.length) throw new Error('Cannot compile an empty group');
console.log(JSON.stringify({ collection, group: node.id, texts }));
