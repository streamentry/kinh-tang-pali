/**
 * Every text in the catalogue must be measurable.
 *
 * The project counts progress as "texts still missing keys", which reads as finished when it hits
 * zero. That number is only trustworthy if every catalogue text lands in exactly one of two
 * buckets: complete, or incomplete. A text whose segment map comes back empty lands in
 * **neither**, because the measuring loop skips it:
 *
 * ```ts
 * const ids = Object.keys(pãli);
 * if (ids.length === 0) continue;   // ← counted as neither done nor missing
 * ```
 *
 * `sn12.93-213` was the one text in that hole, and it is **repaired**. Its pinned Pāli file
 * holds forty segments keyed with nested sub-range UIDs — `sn12.93-103`, `sn12.104-114`,
 * … `sn12.203-213` — and no single generated prefix matched, so `segmentMapForUid`
 * returned nothing. `segmentBelongsToUid` now resolves a range UID against
 * `base<n>[-<m>]:` for `start <= n <= m <= end`, which is what those keys are. The same
 * hole hid 94 further segments inside six *published* texts; see
 * `tests/unit/pali-segment-ownership.test.ts`.
 *
 *   catalogue 6137 · complete 5335 + missing 802 = 6137
 *
 * One text short is what separated "no gaps" from "nothing was ever checked", which is why
 * this test exists. `KNOWN_UNMEASURABLE` is now empty and must stay that way: raise it
 * only together with a real, measured reason.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { COLLECTIONS, loadCatalog, segmentMapForUid, sourcePathFor, upstreamFile } from '../../src/lib/canon/load';

/**
 * Catalogue texts known to have an empty segment map, and why. Empty means "no text is unmeasurable";
 * raise it only together with a real reason, and lower it when one is repaired.
 */
const KNOWN_UNMEASURABLE = new Map<string, string>([]);

interface Empty {
  code: string;
  uid: string;
  sourcePath: string;
}

test('every catalogue text has a non-empty segment map', () => {
  const empty: Empty[] = [];
  let total = 0;

  for (const { code } of COLLECTIONS) {
    for (const item of loadCatalog(code).texts) {
      total += 1;
      const sp = sourcePathFor(code, item.uid, item.sourcePath);
      if (!sp) {
        empty.push({ code, uid: item.uid, sourcePath: '(sourcePathFor trả rỗng)' });
        continue;
      }
      const raw = JSON.parse(readFileSync(upstreamFile(sp), 'utf8')) as Record<string, string>;
      if (Object.keys(segmentMapForUid(raw, item.uid)).length === 0) {
        empty.push({ code, uid: item.uid, sourcePath: sp });
      }
    }
  }

  assert.ok(total > 0, 'không đọc được catalogue — phép kiểm này sẽ xanh trong khi chưa kiểm gì');

  const unexpected = empty
    .filter((e) => !KNOWN_UNMEASURABLE.has(`${e.code}/${e.uid}`))
    .map((e) => `${e.code}/${e.uid}  src=${e.sourcePath}`);

  const pinned = empty.filter((e) => KNOWN_UNMEASURABLE.has(`${e.code}/${e.uid}`));
  const stale = [...KNOWN_UNMEASURABLE.keys()].filter(
    (k) => !pinned.some((e) => `${e.code}/${e.uid}` === k),
  );

  assert.deepEqual(
    unexpected,
    [],
    `\n${unexpected.length} catalogue text(s) không đo được mà không được ghi vào KNOWN_UNMEASURABLE.\n` +
      `Bài như vậy không vào số "bài đủ" lẫn "bài thiếu", nên "thiếu = 0" là xanh trong khi bài chưa từng được kiểm.\n  ${unexpected.join('\n  ')}`,
  );

  assert.deepEqual(
    stale,
    [],
    `\n${stale.length} mục trong KNOWN_UNMEASURABLE không còn áp dụng — đã sửa xong thì xoá khỏi danh sách.\n  ${stale.join('\n  ')}`,
  );

  assert.equal(
    empty.length,
    KNOWN_UNMEASURABLE.size,
    `số bài không đo được = ${empty.length}, còn danh sách ghi ${KNOWN_UNMEASURABLE.size}. ` +
      `Cập nhật danh sách kèm lý do, hoặc sửa bài cho đo được.`,
  );
});