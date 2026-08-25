/**
 * Workout duration helpers.
 *
 * A workout's elapsed time is the span from `startedAt` to its **finish**
 * timestamp (`finishedAt`, stamped once by `finishSession`).
 *
 * The old implementation derived duration from `updatedAt`, which is mutated
 * by every autosave — including the one fired on app mount before any set is
 * logged — so recorded durations collapsed to ~0–1 minutes regardless of how
 * long the workout actually ran. `finishedAt` is immutable after finish, so
 * it is the only trustworthy endpoint.
 */

/** Elapsed milliseconds of a workout, floored at 0 (never negative). */
export function workoutDurationMs(startedAt: number, endedAt: number): number {
  return Math.max(0, endedAt - startedAt);
}

/**
 * Human-readable duration: "45m", "1h 05m". Sub-minute workouts read "1m".
 */
export function formatDuration(ms: number): string {
  const mins = Math.max(1, Math.round(ms / 60000));
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, '0')}m`;
}

/**
 * Best available duration endpoint for a stored session.
 * Prefers the immutable `finishedAt`; falls back to `updatedAt` for legacy
 * records created before the field existed.
 */
export function workoutEndedAt(session: {
  finishedAt?: number;
  updatedAt: number;
}): number {
  return session.finishedAt ?? session.updatedAt;
}
