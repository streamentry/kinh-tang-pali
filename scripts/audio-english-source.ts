/** Resolve one UID's English exactly as the reader does; never translate or fill gaps. */
import type { CollectionCode } from '../src/lib/canon/types';
import { COLLECTIONS, loadCatalog, loadLock } from '../src/lib/canon/load';
import { resolveLayer } from '../src/lib/canon/layers';
import { englishAudioSource, englishAudioTranscriptHash } from '../src/lib/canon/english-audio';

const args = process.argv.slice(2);
const value = (flag: string) => {
  const index = args.indexOf(`--${flag}`);
  return index >= 0 ? args[index + 1] : undefined;
};

const uid = value('uid');
const collectionValue = value('collection');
if (!uid || !collectionValue || !COLLECTIONS.some((item) => item.code === collectionValue)) {
  console.error(`Usage: audio-english-source.ts --collection <${COLLECTIONS.map((item) => item.code).join('|')}> --uid <uid>`);
  process.exit(2);
}
const collection = collectionValue as CollectionCode;
const catalog = loadCatalog(collection);
if (!catalog.texts.some((text) => text.uid === uid)) {
  console.error(`${collection}/${uid} is not in the pinned catalog`);
  process.exit(2);
}

const pali = resolveLayer('pali', collection, uid, { catalog });
if (!pali?.present || Object.keys(pali.segments).length === 0) {
  console.error(`${collection}/${uid}: pinned Pāli root is not synced`);
  process.exit(1);
}
const sujato = resolveLayer('english-sujato', collection, uid, { catalog });
const project = resolveLayer('english-project', collection, uid, { catalog });
const segments = Object.keys(pali.segments).map((id) => {
  const upstream = (sujato?.segments[id] ?? '').trim();
  const projectFill = (project?.segments[id] ?? '').trim();
  return {
    id,
    en: upstream || projectFill,
    enFrom: upstream ? 'english-sujato' : projectFill ? 'english-project' : undefined,
  };
});
const source = englishAudioSource(
  { uid, collection, commit: loadLock().commit, segments },
  project?.status ?? null,
);
if (source.status !== 'ready' || !source.source_sha256) {
  console.error(JSON.stringify({ status: source.status, blockers: source.blockers }));
  process.exit(1);
}
process.stdout.write(`${JSON.stringify({ ...source, transcript_sha256: englishAudioTranscriptHash(source) })}\n`);
