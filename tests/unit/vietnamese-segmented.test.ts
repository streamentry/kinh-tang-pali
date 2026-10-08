/**
 * Segmented Vietnamese goes in the column; whole-text Vietnamese never does.
 *
 * The maintainer's rule (2026-10-08): wherever SuttaCentral has a Vietnamese translation
 * *segmented* in bilara-data, it is shown in the "Việt hiện hành" column, segment by segment.
 * Whole-text (legacy HTML) Vietnamese has no segment ids, so it is shown whole at the foot of
 * the page and never placed in the column. See AGENTS.md, "Việt hiện hành".
 *
 * The hazard is quiet in both directions. A re-pin could bring a new segmented Vietnamese
 * translator that no layer reads — the column would stay empty for texts that could fill it,
 * and nothing would say so. Or a whole-text source could be wired into the column, and the
 * reader would see sentences paired with the wrong Pāli. These tests close both.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { storeLayer, storeLayers } from '../../src/lib/canon/layers';
import { loadLock } from '../../src/lib/canon/load';
import { externalReferences } from '../../src/lib/canon/external';

interface ManifestShape { commit: string; vietnameseTranslators?: string[] }
const manifest = JSON.parse(readFileSync('source/upstream-manifest.json', 'utf8')) as ManifestShape;

test('the manifest records every Vietnamese translator directory at the pinned commit', () => {
  assert.equal(manifest.commit, loadLock().commit, 'the manifest describes the pinned commit');
  assert.ok(
    Array.isArray(manifest.vietnameseTranslators) && manifest.vietnameseTranslators.length > 0,
    'run `npm run manifest:fetch` to record translation/vi at the pin',
  );
});

test('every segmented Vietnamese translation at the pin is read into the column or declared non-scripture', () => {
  const readByLayer = new Set(
    storeLayers()
      .map((layer) => (layer.location as { type: string; path?: string }))
      .filter((location) => location.type === 'upstream' && location.path)
      .map((location) => location.path as string),
  );
  const nonScripture = new Set(
    loadLock().referenceEditions.filter((edition) => edition.kind === 'credits').map((edition) => edition.path),
  );
  for (const translator of manifest.vietnameseTranslators ?? []) {
    const upstreamPath = `translation/vi/${translator}`;
    assert.ok(
      readByLayer.has(upstreamPath) || nonScripture.has(upstreamPath),
      `${upstreamPath} is segmented Vietnamese at the pin but no layer reads it. `
        + 'Segmented Vietnamese belongs in the Việt hiện hành column: extend the vietnamese-current '
        + 'layer (source/layers.yaml) and pin it with its licence in source/suttacentral.lock.json.',
    );
  }
});

test('the Việt hiện hành column is fed by bilara segments only', () => {
  const layer = storeLayer('vietnamese-current');
  assert.equal(layer.kind, 'reference');
  assert.equal((layer.location as { type: string }).type, 'upstream', 'the column reads the pinned bilara snapshot');
  // Whole-text Vietnamese is declared as a reference with no alignment, never as a layer.
  const layerIds = new Set(storeLayers().map((entry) => entry.id));
  for (const reference of externalReferences()) {
    assert.equal(reference.alignment, 'none', `${reference.id} claims no segment alignment`);
    assert.equal(layerIds.has(reference.id), false, `${reference.id} must not be a store layer`);
  }
});
