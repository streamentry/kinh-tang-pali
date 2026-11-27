import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

test('English preflight derives its UID set from the current store without provider or upload work', () => {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'english-audio-preflight-'));
  const output = path.join(folder, 'inventory.json');
  try {
    execFileSync(process.execPath, [
      '--import', 'tsx', 'scripts/audio-english-preflight.ts', '--require-ready', '--output', output,
    ], { stdio: 'pipe' });
    const report = JSON.parse(fs.readFileSync(output, 'utf8'));
    assert.equal(report.source_commit, report.upstream_manifest_commit);
    assert.equal(report.provider_calls, 0);
    assert.equal(report.uploads, 0);
    assert.equal(report.candidate_uids.length, report.totals.candidates);
    assert.equal(new Set(report.candidate_uids).size, report.candidate_uids.length);
    assert.equal(report.totals.candidate_vietnamese_original_audio_available
      + report.totals.candidate_missing_vietnamese_original_audio, report.totals.candidates);
    assert.equal(report.candidate_missing_vietnamese_original_audio_uids.length,
      report.totals.candidate_missing_vietnamese_original_audio);
    assert.equal(report.rights_gate, 'not assessed by this inventory; no provider or upload authorization implied');
  } finally {
    fs.rmSync(folder, { recursive: true, force: true });
  }
});
