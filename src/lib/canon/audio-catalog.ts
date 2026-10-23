import { loadCatalog } from './load';
import { hasNavigation, homeGroupId, loadNavigation } from './groups';
import type { CollectionCode } from './types';

export const AUDIO_COLLECTIONS = ['mn', 'dn', 'sn', 'an', 'kn'] as const;
export const GROUP_AUDIO_COLLECTIONS = ['sn', 'an', 'kn'] as const;

/** Resolve actual catalog identities, including KN and native ranged UIDs. */
export function audioCollection(uid: string): CollectionCode {
  const matches = AUDIO_COLLECTIONS.filter(code => loadCatalog(code).texts.some(text => text.uid === uid));
  if (matches.length !== 1) throw new Error(`Unknown or ambiguous audio UID: ${uid}`);
  return matches[0];
}

/** Traverse all navigation children, including direct texts in mixed groups. */
export function audioQueue(collection: CollectionCode) {
  const catalog = loadCatalog(collection);
  const order = hasNavigation(collection)
    ? loadNavigation(collection).order
    : catalog.texts.slice().sort((a, b) => a.order - b.order).map(text => text.uid);
  const expected = new Set(catalog.texts.map(text => text.uid));
  if (new Set(order).size !== order.length || order.length !== expected.size || order.some(uid => !expected.has(uid))) {
    throw new Error(`${collection}: audio navigation does not cover the catalog exactly once`);
  }
  return order.map((uid, index) => ({
    uid, collection, order: index + 1,
    home_group: hasNavigation(collection) ? homeGroupId(collection, uid) : null,
  }));
}
