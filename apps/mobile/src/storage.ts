import { openDatabaseSync } from 'expo-sqlite';
import { ProgressStore, ProgressStorageError, type ProgressBackend } from './storage-core';

export * from './storage-core';

/** Kept separate from content caches: clearing a WebView cache never clears a
 * reader's place. Call once at app startup, with a visible error/retry UI. */
export function openProgressStore(): ProgressStore {
  try {
    const db = openDatabaseSync('kinh-tang-pali-progress.db');
    db.execSync('PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 3000;');
    const version = db.getFirstSync<{ user_version: number }>('PRAGMA user_version')?.user_version ?? 0;
    if (version > 1) throw new Error('This database needs a newer version of the app');
    if (version === 0) {
      db.withTransactionSync(() => {
        db.execSync(`
          CREATE TABLE IF NOT EXISTS progress (
            kind TEXT NOT NULL,
            record_key TEXT NOT NULL,
            value TEXT NOT NULL,
            updated_at INTEGER NOT NULL,
            PRIMARY KEY (kind, record_key)
          );
          CREATE INDEX IF NOT EXISTS progress_recent ON progress(kind, updated_at DESC);
          PRAGMA user_version = 1;
        `);
      });
    }
    const backend: ProgressBackend = {
      get(kind, key) {
        return db.getFirstSync<{ value: string }>(
          'SELECT value FROM progress WHERE kind = ? AND record_key = ?', kind, key,
        )?.value ?? null;
      },
      put(kind, key, value, updatedAt) {
        db.runSync(`INSERT INTO progress(kind, record_key, value, updated_at) VALUES (?, ?, ?, ?)
          ON CONFLICT(kind, record_key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
        kind, key, value, updatedAt);
      },
      delete(kind, key) {
        db.runSync('DELETE FROM progress WHERE kind = ? AND record_key = ?', kind, key);
      },
      list(kind, limit) {
        const safeLimit = limit === undefined ? -1 : Math.max(0, Math.floor(limit));
        return db.getAllSync<{ value: string }>(
          'SELECT value FROM progress WHERE kind = ? ORDER BY updated_at DESC, record_key LIMIT ?',
          kind, safeLimit,
        ).map(row => row.value);
      },
      transaction(run) { db.withTransactionSync(run); },
    };
    return new ProgressStore(backend);
  } catch (cause) {
    throw new ProgressStorageError('Không mở được nơi lưu tiến độ trên thiết bị. Hãy thử mở lại ứng dụng.', { cause });
  }
}
