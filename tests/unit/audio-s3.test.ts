import test from 'node:test';
import { execFileSync } from 'node:child_process';

test('large R2 transport preserves verified bytes, destination and public registration gates', () => {
  execFileSync('python3', ['tests/python/audio_s3_test.py'], { stdio: 'pipe' });
});
