import test from 'node:test';
import { execFileSync } from 'node:child_process';

test('offline compilation preserves PCM order, exact chapters and fail-closed cache/source gates', () => {
  execFileSync('python3', ['tests/python/audio_compilation_test.py'], { stdio: 'pipe' });
});
