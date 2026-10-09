import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const profile = JSON.parse(fs.readFileSync('source/narration-profile.json', 'utf8'));
const mn1 = JSON.parse(fs.readFileSync('content/audio/mn1.json', 'utf8'));

test('shared narration profile preserves the MN1 voice and pace approved by the editor', () => {
  for (const key of ['model', 'voice', 'style']) assert.equal(profile[key], mn1[key]);
  assert.equal(profile.approval.reference_mp3_sha256, mn1.sha256);
  assert.equal(profile.approval.scope, 'voice-and-pace');
  assert.equal(profile.chunk_max_chars, 1400);
  assert.equal(profile.chunk_pause_seconds, 0.35);
  assert.equal(profile.summary_to_scripture_pause_seconds, 1.6);
  assert.equal(profile.postprocess_speed, 1);
  assert.equal(profile.default_playback_rate, 1);
  assert.deepEqual(mn1.narration_profile, profile);
});

test('generator and uploader enforce the pinned profile before making network calls', () => {
  const output = execFileSync('python3', ['-c', `
import sys
sys.path.insert(0, 'scripts')
from narration_config import load_profile, profile_digest, profile_metadata, assert_profile_metadata, APPROVED_PROFILE_SHA256
from unittest.mock import patch
import json
p = load_profile()
assert profile_digest(p) == APPROVED_PROFILE_SHA256
m = {**profile_metadata(p), **{k:p[k] for k in ('model','voice','style')}}
assert_profile_metadata(m,p)
m['voice'] = 'different-voice'
try:
    assert_profile_metadata(m,p)
except RuntimeError:
    print('drift blocked')
else:
    raise AssertionError('Voice drift was accepted')
p['style'] = 'speaking rapidly'
with patch('narration_config.PROFILE_PATH') as profile_file:
    profile_file.read_text.return_value = json.dumps(p)
    try:
        load_profile()
    except RuntimeError:
        print('pace drift blocked')
    else:
        raise AssertionError('Pace drift was accepted')
`], { encoding: 'utf8' });
  assert.match(output, /drift blocked/);
  assert.match(output, /pace drift blocked/);
  const result = (() => {
    try { execFileSync('python3', ['scripts/gemini_tts.py', '--voice', 'different-voice', '--prepare-only'], { stdio: 'pipe' }); }
    catch (error) { return error as { status: number; stderr: Buffer }; }
    throw new Error('CLI voice override was accepted');
  })();
  assert.equal(result.status, 2);
  assert.match(result.stderr.toString(), /unrecognized arguments/);
});
