import { composeDocument } from '../src/lib/canon/document';
import { narrationHash, narrationSource } from '../src/lib/canon/audio';
const uid = process.argv[2];
if (!/^(mn|dn)[1-9]\d*$/.test(uid ?? '')) throw new Error('Provide a Majjhima or Digha UID, e.g. mn1 or dn1');
const collection = uid.startsWith('mn') ? 'mn' : 'dn';
const doc = composeDocument(collection, uid);
const source = narrationSource(doc);
if (!source.summary || !source.segments.length) throw new Error('Summary and translation are required');
console.log(JSON.stringify({ uid, title: doc.viTitle, source_sha256: narrationHash(doc), ...source }));
