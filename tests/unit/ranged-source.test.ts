import assert from 'node:assert/strict';
import test from 'node:test';
import { segmentMapForUid } from '../../src/lib/canon/load';

test('filters a ranged Bilara source down to the requested sutta UID', () => {
  const source = {
    'an1.1:0.1': 'Aṅguttara Nikāya 1',
    'an1.1:2.1': 'first',
    'an1.2:1.1': 'second',
  };

  assert.deepEqual(segmentMapForUid(source, 'an1.1'), {
    'an1.1:0.1': 'Aṅguttara Nikāya 1',
    'an1.1:2.1': 'first',
  });
});
