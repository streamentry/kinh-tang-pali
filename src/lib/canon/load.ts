import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import type {
  CanonCatalog,
  CanonDocument,
  CollectionCode,
  CollectionDefinition,
  EditorialMeta,
} from './types';

const ROOT = process.cwd();

export const COLLECTIONS: CollectionDefinition[] = [
  { code: 'dn', titlePali: 'Dīgha Nikāya', titleVi: 'Kinh Trường Bộ', description: 'Các bài kinh dài.' },
  { code: 'mn', titlePali: 'Majjhima Nikāya', titleVi: 'Kinh Trung Bộ', description: 'Ưu tiên biên dịch hiện tại: 152 bài kinh.' },
  { code: 'sn', titlePali: 'Saṁyutta Nikāya', titleVi: 'Kinh Tương Ưng Bộ', description: 'Các bài kinh được nhóm theo chủ đề tương ưng.' },
  { code: 'an', titlePali: 'Aṅguttara Nikāya', titleVi: 'Kinh Tăng Chi Bộ', description: 'Các bài kinh được tổ chức theo pháp số.' },
  { code: 'kn', titlePali: 'Khuddaka Nikāya', titleVi: 'Kinh Tiểu Bộ', description: 'Tập hợp nhiều bộ kinh và thi kệ nhỏ.' },
];

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(file, 'utf8')) as T;
}

export function loadCatalog(collection: CollectionCode): CanonCatalog {
  return readJson<CanonCatalog>(path.join(ROOT, 'content/catalog/sutta', `${collection}.json`));
}

export function loadMeta(collection: CollectionCode, uid: string): EditorialMeta | null {
  const file = path.join(ROOT, 'content/meta/sutta', collection, `${uid}.yaml`);
  if (!existsSync(file)) return null;
  return YAML.parse(readFileSync(file, 'utf8')) as EditorialMeta;
}

function loadSegmentMap(file: string): Record<string, string> {
  if (!existsSync(file)) return {};
  return readJson<Record<string, string>>(file);
}

export function segmentMapForUid(
  segments: Record<string, string>,
  uid: string,
): Record<string, string> {
  const prefix = `${uid}:`;
  return Object.fromEntries(Object.entries(segments).filter(([id]) => id.startsWith(prefix)));
}

export function sourcePathFor(collection: CollectionCode, uid: string, explicit?: string): string | null {
  if (explicit) return explicit;
  if (collection === 'dn' || collection === 'mn') {
    return `root/pli/ms/sutta/${collection}/${uid}_root-pli-ms.json`;
  }
  if (collection === 'sn') {
    const match = uid.match(/^sn(\d+)\./);
    return match ? `root/pli/ms/sutta/sn/sn${match[1]}/${uid}_root-pli-ms.json` : null;
  }
  if (collection === 'an') {
    const match = uid.match(/^an(\d+)\./);
    return match ? `root/pli/ms/sutta/an/an${match[1]}/${uid}_root-pli-ms.json` : null;
  }
  return null;
}

export function composeDocument(collection: CollectionCode, uid: string): CanonDocument {
  const catalog = loadCatalog(collection);
  const item = catalog.texts.find((text) => text.uid === uid);
  if (!item) throw new Error(`UID ${uid} is not in ${collection} catalog`);

  const meta = loadMeta(collection, uid);
  const translation = loadSegmentMap(path.join(
    ROOT,
    'content/translation/vi/project/sutta',
    collection,
    `${uid}_translation-vi-project.json`,
  ));
  const comments = loadSegmentMap(path.join(
    ROOT,
    'content/comment/vi/project/sutta',
    collection,
    `${uid}_comment-vi-project.json`,
  ));

  const sourcePath = sourcePathFor(collection, uid, item.sourcePath);
  const paliSource = sourcePath
    ? loadSegmentMap(path.join(ROOT, '.cache/upstream/suttacentral', sourcePath))
    : {};
  const pali = segmentMapForUid(paliSource, uid);

  const orderedIds = Object.keys(pali).length > 0
    ? Object.keys(pali)
    : Object.keys(translation);

  const segments = orderedIds.map((id) => ({
    id,
    pali: pali[id],
    vi: translation[id],
    commentVi: comments[id],
  }));

  const paliTitle = pali[`${uid}:0.2`]?.trim();
  const viTitle = meta?.translationTitle || `${uid.toUpperCase()}`;
  const hasProjectData = meta !== null || Object.keys(translation).length > 0;

  return {
    uid,
    collection,
    canonicalOrder: item.order,
    paliTitle,
    viTitle,
    status: meta?.status ?? 'draft',
    hasProjectData,
    segments,
  };
}

export function listCollection(collection: CollectionCode) {
  const catalog = loadCatalog(collection);
  return catalog.texts.map((item) => {
    const meta = loadMeta(collection, item.uid);
    return {
      ...item,
      title: meta?.translationTitle || item.uid.toUpperCase(),
      status: meta?.status ?? 'not-started',
      hasProjectData: meta !== null,
    };
  });
}

export function collectionProgress(collection: CollectionCode) {
  const items = listCollection(collection);
  return {
    total: items.length,
    started: items.filter((x) => x.status !== 'not-started').length,
    review: items.filter((x) => x.status === 'review').length,
    published: items.filter((x) => x.status === 'published').length,
  };
}
