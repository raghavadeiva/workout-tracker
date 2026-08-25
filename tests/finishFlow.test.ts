/**
 * Integration regression test: runs the PRODUCTION src/db/database.ts
 * unmodified against a fake-indexeddb backend.
 *
 * RED condition (the reported bug): finishSession() must record when the
 * workout actually ended so duration can be displayed correctly, and the
 * stored history record must be intact (visible to getHistory()).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
// idb references IDBRequest/IDBDatabase/etc. globals — install them all.
import 'fake-indexeddb/auto';
// NOTE: real timers — fake-indexeddb resolves its internal queue via timers,
// which vi.useFakeTimers() would freeze into a deadlock.

beforeEach(() => {
  // Fresh database instance per test (auto already provided the classes)
  (globalThis as { indexedDB: unknown }).indexedDB = new IDBFactory();
});

describe('finish flow (production database.ts)', () => {
  it('stamps finishedAt and the session is returned by getHistory()', async () => {
    const db = await import('../src/db/database');

    const startedAt = Date.now();
    const session = {
      id: 's1',
      startedAt,
      // Field bug: updatedAt stays frozen at creation because autosave only
      // touches the IndexedDB copy, never React state.
      updatedAt: startedAt,
      exercises: [
        {
          id: 'e1',
          name: 'Bench Press',
          sets: [
            { id: 'set1', setNumber: 1, weight: 135, reps: 8, completedAt: startedAt + 30 },
          ],
        },
      ],
    };

    await db.finishSession(session as never);

    const history = await db.getHistory();
    expect(history).toHaveLength(1); // saved AND visible
    expect(history[0].id).toBe('s1');

    // THE BUG under test: finish endpoint must be recorded at finish time,
    // not inherited from the stale updatedAt (= startedAt).
    const finishedAt = (history[0] as { finishedAt?: number }).finishedAt;
    expect(finishedAt).toBeDefined();
    expect(finishedAt!).toBeGreaterThanOrEqual(session.updatedAt);
    expect(finishedAt!).not.toBe(session.updatedAt || undefined);
  });
});
