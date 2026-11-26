import type { NativeTrack, ReadingPosition } from '../../src/lib/native/protocol';
import type { ProgressBackend, RecordKind } from '../../apps/mobile/src/storage-core';

export const siteUrl = 'https://streamentry.github.io/kinh-tang-pali/';
export function reading(uid = 'mn1'): ReadingPosition {
  return { pageUrl: `${siteUrl}sutta/mn/${uid}/`, title: `Kinh ${uid}`, uid, segmentId: `${uid}:1.2`,
    segmentOffset: 0.25, scrollRatio: 0.4, mode: 'vi', column: 'vi', textSize: 2 };
}
export function track(uid = 'mn1'): NativeTrack {
  return { uid, title: `Kinh ${uid}`, pageUrl: reading(uid).pageUrl, version: {
    id: 'original', label: 'Kinh văn Việt 2026', description: 'Kinh văn', kind: 'sutta',
    url: `https://audio.example.org/${uid}.mp3`, duration_seconds: 120,
    start_seconds: 10, scripture_start_seconds: 10, review_status: 'pending',
  } };
}

export class MemoryBackend implements ProgressBackend {
  records = new Map<string, { value: string; updatedAt: number }>();
  failKey: string | null = null;
  private key(kind: RecordKind, key: string) { return `${kind}:${key}`; }
  get(kind: RecordKind, key: string) { return this.records.get(this.key(kind, key))?.value ?? null; }
  put(kind: RecordKind, key: string, value: string, updatedAt: number) {
    if (key === this.failKey) throw new Error('Disk full');
    this.records.set(this.key(kind, key), { value, updatedAt });
  }
  delete(kind: RecordKind, key: string) { this.records.delete(this.key(kind, key)); }
  list(kind: RecordKind, limit?: number) {
    const values = [...this.records.entries()].filter(([key]) => key.startsWith(`${kind}:`))
      .sort((a, b) => b[1].updatedAt - a[1].updatedAt).map(([, item]) => item.value);
    return limit === undefined ? values : values.slice(0, limit);
  }
  transaction(run: () => void) {
    const original = new Map(this.records);
    try { run(); } catch (error) { this.records = original; throw error; }
  }
}
