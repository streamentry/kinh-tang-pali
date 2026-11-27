import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

test('source map records pinned source path hashes without TTS or uploads', () => {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'english-audio-source-map-'));
  const preflight = path.join(folder, 'preflight.json');
  const output = path.join(folder, 'source-map.json');
  try {
    execFileSync(process.execPath, [
      '--import', 'tsx', 'scripts/audio-english-preflight.ts', '--collection', 'dn', '--require-ready', '--output', preflight,
    ], { stdio: 'pipe' });
    execFileSync(process.execPath, [
      '--import', 'tsx', 'scripts/audio-english-source-map.ts', '--preflight', preflight, '--output', output,
    ], { stdio: 'pipe' });
    const reportText = fs.readFileSync(output, 'utf8');
    const report = JSON.parse(reportText);
    const uidMap = report.uid_source_map as Array<{
      uid: string;
      english_segment_count: number;
      english_sujato_segment_count: number;
      english_project_segment_count: number;
      uses_sujato: boolean;
      uses_english_project: boolean;
      sujato_source_path: string | null;
      sujato_source_sha256: string | null;
    }>;
    assert.equal(report.provider_calls, 0);
    assert.equal(report.uploads, 0);
    assert.equal(report.source_commit, report.upstream_manifest_commit);
    assert.equal(uidMap.length, report.preflight_candidate_count);
    const mapStart = reportText.indexOf('  "uid_source_map": [\n');
    const mapEnd = reportText.indexOf('\n  ],\n  "provider_calls":', mapStart);
    assert.ok(mapStart >= 0 && mapEnd > mapStart);
    const recordLines = reportText.slice(mapStart, mapEnd).split('\n').filter((line) => /^    \{"uid":/.test(line));
    assert.equal(recordLines.length, uidMap.length, 'one compact, reviewable JSON line per UID');
    assert.ok(uidMap.every((row) => row.english_segment_count === row.english_sujato_segment_count + row.english_project_segment_count));
    assert.ok(uidMap.filter((row) => row.uses_sujato).every((row) => row.sujato_source_path?.startsWith('translation/en/sujato/sutta/')
      && /^[0-9a-f]{64}$/.test(row.sujato_source_sha256 ?? '')));
    assert.deepEqual(new Set(uidMap.filter((row) => !row.uses_sujato && row.uses_english_project).map((row) => row.uid)), new Set(report.project_only_uids));
    assert.equal(report.sujato_source_units.reduce((sum: number, unit: { candidate_texts: number }) => sum + unit.candidate_texts, 0), report.uses_sujato_texts);
    assert.equal(report.project_only_uids.length, 0);
    assert.match(report.rights_gate, /grants no TTS/);
  } finally {
    fs.rmSync(folder, { recursive: true, force: true });
  }
});
