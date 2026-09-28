/**
 * Composing a text into the four versions a translator reads side by side.
 *
 * The Pāli root is the key set: every other version is aligned to it, so a segment
 * is the unit of comparison and a blank in one version is a fact about that version
 * at that segment — not a gap in the document.
 *
 * This lives apart from `load.ts` because it needs the store registry, and the store
 * registry is built on the same loaders. Folding it back in would make those two
 * modules mutually dependent, so the document composition is its own layer on top.
 *
 * Two distinctions this module is careful about, because collapsing either one tells
 * a reader something false:
 *
 *   1. A version that is **not published upstream** (1,596 Khuddaka texts have no
 *      English anywhere on SuttaCentral) versus one that is published but **not
 *      fetched** locally. The reader is told which.
 *   2. A version **present but blank at a segment** versus a version **absent for the
 *      whole text**. A blank English cell is a hole in that edition; a missing
 *      English panel is a hole in the corpus. They need different words.
 */
import path from 'node:path';
import type {
  CanonDocument,
  CanonLayerId,
  CanonLayerSummary,
  CanonSegment,
  CollectionCode,
  EditorialMeta,
  LayerAbsenceReason,
} from './types';
import {
  loadCatalog,
  loadLock,
  loadMeta,
  loadSegmentMap,
  projectContentLicense,
  segmentMapForUid,
  segmentPrefixesForUid,
  sourcePathFor,
  upstreamFile,
} from './load';
import { creditForLayer, licenseForLayer, resolveLayer, storeLayer } from './layers';
import { upstreamPublishes } from './manifest';

const ROOT = process.cwd();

/**
 * Credit for our own translation.
 *
 * Stated here rather than read from the store registry, because the project layers are
 * ours: there is no upstream edition, no translator to attribute, and no licence to
 * inherit. What is true is who wrote it and under what terms.
 */
// Built from the lock's declaration rather than typed, because this line is the credit a
// reader sees beside the translation and the book manifests state the same terms.
export const PROJECT_TRANSLATION_CREDIT = `Bản dịch của dự án Kinh Tạng Pāli Việt — ${
  projectContentLicense().spdx.replace(/-(\d)/, ' $1')
}, không phải bản của SuttaCentral`;

/** The store layers behind each display column, in precedence order. */
const COLUMN_SOURCES: Record<CanonLayerId, readonly string[]> = {
  pali: ['pali'],
  english: ['english-sujato', 'english-project'],
  viCurrent: ['vietnamese-current'],
  vi: ['vietnamese-project'],
};

type ColumnKey = CanonLayerId;

interface Column {
  merged: Record<string, string>;
  /** Which layer supplied each segment's words, so standing is never blurred. */
  origin: Record<string, string>;
  /** Which layers actually contributed anything. */
  sourceLayers: string[];
  /** Whether the pinned corpus publishes this text at all, or `null` if unknowable. */
  publishedUpstream: boolean | null;
  present: boolean;
  reason: LayerAbsenceReason;
}

const prose = (value: unknown): string => (typeof value === 'string' ? value : '');

/**
 * Assemble one display column from the layers that may supply it.
 *
 * Precedence matters and is not arbitrary: the pinned Sujato edition is consulted
 * before our own fill, matching `fillableSegments`, so a passage Sujato translated is
 * never displaced by our draft. Where Sujato has nothing, the fill may speak — and the
 * segment records that it was our fill, so the reader can label it as such.
 */
function buildColumn(column: ColumnKey, collection: CollectionCode, uid: string): Column {
  const catalog = loadCatalog(collection);
  const merged: Record<string, string> = {};
  const origin: Record<string, string> = {};
  const sourceLayers: string[] = [];
  let publishedUpstream: boolean | null = null;
  let present = false;

  for (const layerId of COLUMN_SOURCES[column]) {
    const resolved = resolveLayer(layerId, collection, uid, { catalog });
    if (!resolved) continue;
    if (resolved.upstreamPath && publishedUpstream === null) {
      publishedUpstream = upstreamPublishes(layerId, resolved.upstreamPath);
    }
    if (!resolved.present) continue;
    present = true;
    sourceLayers.push(layerId);
    for (const [id, value] of Object.entries(resolved.segments)) {
      if (prose(value).trim() === '' || merged[id] !== undefined) continue;
      merged[id] = value;
      origin[id] = layerId;
    }
  }

  let reason: LayerAbsenceReason;
  if (present) reason = 'none';
  else if (publishedUpstream === false) reason = 'not-published-upstream';
  else if (publishedUpstream === true) reason = 'not-synced';
  else reason = 'not-started';

  return { merged, origin, sourceLayers, publishedUpstream, present, reason };
}

/**
 * Absence of a version at one segment.
 *
 * A column that is absent for the whole text reports that absence. A column that has
 * the text but leaves this segment blank reports `none` — the version is there, and it
 * says nothing here. Those are different gaps and the reader renders them differently,
 * because a blank English cell in a text SuttaCentral did translate is exactly the
 * case the English fill layer exists to address.
 */
function absenceAt(column: Column, id: string, text: string): LayerAbsenceReason {
  if (text.trim() !== '') return 'none';
  if (column.reason !== 'none') return column.reason;
  void id;
  return 'none';
}

function summarise(
  column: ColumnKey,
  ids: string[],
  column_: Column,
  detail: { title: string; standing: CanonLayerSummary['standing']; role: string; note?: string; status?: string },
): CanonLayerSummary {
  const withText = ids.filter((id) => prose(column_.merged[id]).trim() !== '').length;

  // Credit and licence are looked up per column, explicitly.
  //
  // Inferring them from `standing` looked equivalent and was wrong: it sent the project's
  // own Vietnamese column to the `vietnamese-current` layer, so our translation was
  // credited to Bhikkhu Thích Minh Châu. That is the same class of error as passing a
  // reference off as ours, in the opposite direction, and it is exactly why a reference
  // must never be inferred where it can be stated.
  const CREDITS: Record<ColumnKey, () => string> = {
    pali: () => creditForLayer(storeLayer('pali')),
    english: () => creditForLayer(storeLayer('english-sujato')),
    viCurrent: () => creditForLayer(storeLayer('vietnamese-current')),
    vi: () => `${PROJECT_TRANSLATION_CREDIT}`,
  };

  const licence = column === 'vi' ? undefined : licenseForLayer(storeLayer(
    column === 'pali' ? 'pali' : column === 'english' ? 'english-sujato' : 'vietnamese-current',
  ));

  return {
    id: column,
    title: detail.title,
    standing: detail.standing,
    language: column === 'pali' ? 'pi-Latn' : column === 'english' ? 'en' : 'vi',
    role: detail.role,
    note: detail.note,
    reason: column_.reason,
    withText,
    total: ids.length,
    sourceLayers: column_.sourceLayers,
    status: detail.status,
    credit: CREDITS[column](),
    license: licence
      ? {
          group: licence.group,
          spdx: licence.spdx,
          holder: licence.holder,
          attributionRequired: licence.attributionRequired,
        }
      : undefined,
  };
}

export function composeDocument(collection: CollectionCode, uid: string): CanonDocument {
  const catalog = loadCatalog(collection);
  const item = catalog.texts.find((text) => text.uid === uid);
  if (!item) throw new Error(`UID ${uid} is not in ${collection} catalog`);

  const meta = loadMeta(collection, uid);
  const comments = loadSegmentMap(path.join(
    ROOT,
    'content/comment/vi/project/sutta',
    collection,
    `${uid}_comment-vi-project.json`,
  ));

  const sourcePath = sourcePathFor(collection, uid, item.sourcePath);
  const paliSource = sourcePath ? loadSegmentMap(upstreamFile(sourcePath)) : {};
  const pali = segmentMapForUid(paliSource, uid);

  const columns = {
    pali: buildColumn('pali', collection, uid),
    english: buildColumn('english', collection, uid),
    viCurrent: buildColumn('viCurrent', collection, uid),
    vi: buildColumn('vi', collection, uid),
  };

  // Pāli is the key set. Falling back to the project translation keeps a text
  // readable in the rare case where the Pāli file is not synced but the project has
  // already produced segments for it, rather than rendering an empty page.
  const orderedIds = Object.keys(pali).length > 0
    ? Object.keys(pali)
    : Object.keys(columns.vi.merged);

  const segments: CanonSegment[] = orderedIds.map((id) => {
    const en = columns.english.merged[id];
    const enText = prose(en);
    const currentText = prose(columns.viCurrent.merged[id]);
    const projectText = prose(columns.vi.merged[id]);
    return {
      id,
      pali: pali[id],
      en: enText.trim() === '' ? undefined : enText,
      enFrom: enText.trim() === ''
        ? undefined
        : (columns.english.origin[id] as 'english-sujato' | 'english-project'),
      viCurrent: currentText.trim() === '' ? undefined : currentText,
      vi: projectText.trim() === '' ? undefined : projectText,
      commentVi: comments[id],
      absence: {
        en: absenceAt(columns.english, id, enText),
        viCurrent: absenceAt(columns.viCurrent, id, currentText),
        vi: projectText.trim() === '' ? 'not-started' : 'none',
      },
    };
  });

  const [firstPrefix] = segmentPrefixesForUid(uid);
  const paliTitle = pali[`${firstPrefix}:0.2`]?.trim() || columns.pali.merged[`${firstPrefix}:0.2`]?.trim();
  const hasProjectData = meta !== null || Object.keys(columns.vi.merged).length > 0;

  return {
    uid,
    collection,
    canonicalOrder: item.order,
    paliTitle,
    viTitle: (meta as EditorialMeta | null)?.translationTitle || `${uid.toUpperCase()}`,
    status: (meta as EditorialMeta | null)?.status ?? 'draft',
    hasProjectData,
    segments,
    commit: loadLock().commit,
    layers: [
      summarise('pali', orderedIds, columns.pali, {
        title: 'Pāli',
        standing: 'authority',
        role: 'Nguồn chuẩn quyết định nghĩa. Khi các bản bất đồng, Pāli là chốt.',
        note: 'SuttaCentral Mahāsaṅgīti (bilara, pli/ms).',
      }),
      summarise('english', orderedIds, columns.english, {
        title: 'English',
        standing: 'reference',
        role: 'Bản tham khảo do SuttaCentral phát hành, không phải bản của dự án.',
        note: columns.english.sourceLayers.includes('english-project')
          ? 'Gồm chỗ Sujato để trống, bù bằng bản lấp của dự án (bản nháp của chúng ta).'
          : 'Bhikkhu Sujato.',
      }),
      summarise('viCurrent', orderedIds, columns.viCurrent, {
        title: 'Việt hiện hành',
        standing: 'reference',
        role: 'Bản Việt đang lưu hành, tại bản chụp đã pin.',
        note: 'HT. Thích Minh Châu.',
      }),
      summarise('vi', orderedIds, columns.vi, {
        title: 'Việt dự án',
        standing: 'project',
        role: 'Bản dịch canonical của dự án. Đây là bản đang biên tập.',
        status: (meta as EditorialMeta | null)?.status ?? 'not-started',
      }),
    ],
  };
}
