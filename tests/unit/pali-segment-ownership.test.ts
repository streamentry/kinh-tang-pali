/**
 * Every segment of the pinned Pāli must be claimed by exactly one catalog UID.
 *
 * This is not a stylistic check. `segmentPrefixesForUid` expands a range UID into the
 * single integers it spans, which cannot express a *composite sub-range* such as
 * `an1.297-305`. A bilara file inside a range bundle may well carry one:
 * `an1.296-305_root-pli-ms.json` contains both `an1.296:*` and `an1.297-305:*`. The
 * composite keys matched no generated prefix, so they entered no `sourceIds` set —
 * which meant `requireComplete` iterated a set that never contained them and a
 * `published` text served with those segments simply absent. Six published texts were
 * missing 94 segments and `npm run validate` reported nothing.
 *
 * So: assert both halves. Membership must accept the sub-range, and nothing anywhere in
 * the pinned Pāli may be unclaimed.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import {
  loadCatalog,
  sourcePathFor,
  upstreamFile,
  segmentBelongsToUid,
} from '../../src/lib/canon/load'

const COLLECTIONS = ['an', 'dn', 'kn', 'mn', 'sn'] as const

test('a range UID owns a composite sub-range inside its own span', () => {
  assert.equal(segmentBelongsToUid('an1.296-305', 'an1.296:1.1'), true, 'the plain first member')
  assert.equal(segmentBelongsToUid('an1.296-305', 'an1.297-305:1.1'), true, 'the composite sub-range')
  assert.equal(segmentBelongsToUid('an1.296-305', 'an1.305:1.1'), true, 'the plain last member')
  assert.equal(segmentBelongsToUid('an1.296-305', 'an1.297-283:1.1'), false, 'outside the span')
  assert.equal(segmentBelongsToUid('an1.296-305', 'an1.400:1.1'), false, 'beyond the end')
  assert.equal(segmentBelongsToUid('an1.296-305', 'an1.297-305'), false, 'needs the trailing colon')
})

test('a non-range UID claims only itself', () => {
  assert.equal(segmentBelongsToUid('mn118', 'mn118:1.1'), true)
  assert.equal(segmentBelongsToUid('mn118', 'mn119:1.1'), false)
  assert.equal(segmentBelongsToUid('an1.1', 'an1.2:1.1'), false)
})

test('no segment of the pinned Pāli is unclaimed by the catalog', () => {
  const claimed = new Map<string, string>()
  const files = new Map<string, string>()

  for (const collection of COLLECTIONS) {
    for (const item of loadCatalog(collection).texts as any[]) {
      const relative = sourcePathFor(collection, item.uid, item.sourcePath)
      if (!relative) continue
      files.set(`${collection}/${item.uid}`, relative)
      const file = upstreamFile(relative)
      if (!existsSync(file)) continue
      const segments = JSON.parse(readFileSync(file, 'utf8')) as Record<string, string>
      for (const id of Object.keys(segments)) {
        if (segmentBelongsToUid(item.uid, id)) claimed.set(id, `${collection}/${item.uid}`)
      }
    }
  }

  const orphans: string[] = []
  for (const [owner, relative] of files) {
    const file = upstreamFile(relative)
    if (!existsSync(file)) continue
    const segments = JSON.parse(readFileSync(file, 'utf8')) as Record<string, string>
    for (const id of Object.keys(segments)) {
      if (!claimed.has(id)) orphans.push(`${owner} → ${id}`)
    }
  }

  assert.deepEqual(
    orphans,
    [],
    `${orphans.length} pinned Pāli segment(s) belong to no catalog UID; a text can then be ` +
    `'published' while missing them and validate cannot see it. First: ${orphans.slice(0, 5).join(', ')}`,
  )
})

test('a published text has every segment its pinned source declares', () => {
  // The specific failure this suite exists for: `requireComplete` cannot catch a
  // segment that never entered `sourceIds`.
  const offenders: string[] = []
  for (const collection of COLLECTIONS) {
    for (const item of loadCatalog(collection).texts as any[]) {
      const metaFile = path.join(process.cwd(), 'content/meta/sutta', collection, `${item.uid}.yaml`)
      if (!existsSync(metaFile)) continue
      const status = readFileSync(metaFile, 'utf8').match(/^status: (\S+)/m)?.[1]
      if (status !== 'published') continue
      const translationFile = path.join(
        process.cwd(), 'content/translation/vi/project/sutta', collection,
        `${item.uid}_translation-vi-project.json`,
      )
      if (!existsSync(translationFile)) continue
      const relative = sourcePathFor(collection, item.uid, item.sourcePath)
      if (!relative) continue
      const file = upstreamFile(relative)
      if (!existsSync(file)) continue
      const source = JSON.parse(readFileSync(file, 'utf8')) as Record<string, string>
      const translation = JSON.parse(readFileSync(translationFile, 'utf8')) as Record<string, string>
      for (const id of Object.keys(source)) {
        if (!segmentBelongsToUid(item.uid, id)) continue
        if (!String(translation[id] ?? '').trim()) offenders.push(`${collection}/${item.uid} ${id}`)
      }
    }
  }
  assert.deepEqual(offenders, [], `${offenders.length} segment(s) missing from a published text. First: ${offenders.slice(0, 5).join(', ')}`)
})
