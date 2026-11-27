import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

test('fresh all-books English preflight covers the pinned catalog without provider or upload calls', () => {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'english-audio-source-preflight-'));
  const output = path.join(folder, 'inventory.json');
  try {
    execFileSync(process.execPath, [
      '--import', 'tsx', 'scripts/audio-english-preflight.ts', '--require-ready', '--output', output,
    ], { stdio: 'pipe' });
    const report = JSON.parse(fs.readFileSync(output, 'utf8'));
    const byCollection = Object.values(report.by_collection) as Array<{
      catalog_texts: number;
      candidates: number;
      no_english: number;
      partial: number;
      blocked: number;
      project_only: number;
    }>;
    assert.equal(report.source_commit, report.upstream_manifest_commit);
    assert.equal(report.scope.join(','), 'dn,mn,sn,an,kn');
    assert.equal(report.provider_calls, 0);
    assert.equal(report.uploads, 0);
    assert.equal(report.candidate_uids.length, report.totals.candidates);
    assert.equal(new Set(report.candidate_uids).size, report.candidate_uids.length);
    assert.equal(report.totals.candidates + report.totals.no_english + report.totals.partial + report.totals.blocked,
      report.totals.catalog_texts);
    assert.equal(byCollection.reduce((sum, row) => sum + row.catalog_texts, 0), report.totals.catalog_texts);
    assert.equal(byCollection.reduce((sum, row) => sum + row.candidates, 0), report.totals.candidates);
    assert.equal(byCollection.filter((row) => row.project_only > 0).length, 1);
    assert.equal(report.by_collection.kn.project_only, byCollection.reduce((sum, row) => sum + row.project_only, 0));
    assert.match(report.rights_gate, /no provider or upload authorization implied/);
  } finally {
    fs.rmSync(folder, { recursive: true, force: true });
  }
});
