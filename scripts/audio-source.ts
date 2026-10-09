import { composeDocument } from '../src/lib/canon/document';
import { narrationHash, narrationSource } from '../src/lib/canon/audio';
const uid = process.argv[2];
if (!/^mn[1-9]\d*$/.test(uid ?? '')) throw new Error('Provide a Majjhima UID, e.g. mn1');
const doc = composeDocument('mn', uid);
const source = narrationSource(doc);
if (!source.summary || !source.segments.length) throw new Error('Summary and translation are required');
console.log(JSON.stringify({ uid, title: doc.viTitle, source_sha256: narrationHash(doc), ...source }));
