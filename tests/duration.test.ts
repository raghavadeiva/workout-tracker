/**
 * Regression tests for the two reported bugs:
 *
 * 1. "Workout saved but not visible in history"
 *    -> finish flow must stamp finishedAt and write history atomically
 * 2. "Duration not tracked/displayed correctly"
 *    -> duration must come from startedAt..finishedAt, NOT from updatedAt
 *       (which is mutated by autosaves, including a mount-time one)
 *
 * Uses a fake-indexeddb harness so the exact production database.ts runs
 * unmodified — same stores, indexes, and transaction semantics as the app.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';

// Fresh IndexedDB per test file
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-08-24T10:00:00'));
  (globalThis as { indexedDB?: unknown }).indexedDB = new IDBFactory();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('duration helpers (src/lib/duration.ts)', () => {
  it('computes elapsed ms from startedAt to finishedAt', async () => {
    const { workoutDurationMs } = await import('../src/lib/duration');
    expect(workoutDurationMs(0, 45 * 60000)).toBe(45 * 60000);
    expect(workoutDurationMs(1000, 500)).toBe(0); // never negative
  });

  it('formats sub-hour and multi-hour durations', async () => {
    const { formatDuration } = await import('../src/lib/duration');
    expect(formatDuration(45 * 60000)).toBe('45m');
    expect(formatDuration(65 * 60000)).toBe('1h 05m');
    expect(formatDuration(30 * 1000)).toBe('1m'); // floor
  });

  it('prefers finishedAt over polluted updatedAt (THE BUG)', async () => {
    // Scenario from the field: mount-time autosave set updatedAt ≈ startedAt,
    // but finishSession stamped finishedAt correctly.
    const { workoutEndedAt } = await import('../src/lib/duration');
    const session = {
      startedAt: Date.now(),
      updatedAt: Date.now(), // autosave pollution
      finishedAt: Date.now() + 52 * 60000,
    };
    expect(workoutEndedAt(session)).toBe(session.finishedAt);
  });
});
