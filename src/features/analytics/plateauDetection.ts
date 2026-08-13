/**
 * Plateau detection for exercise 1RM progression.
 *
 * A plateau is flagged when there is <= 0 growth in Epley 1RM
 * over the last 3 logged sessions of a given exercise.
 */

/** A single data point in the 1RM progression series. */
export interface OneRMDataPoint {
  date: number;
  oneRM: number;
}

/**
 * Detects a strength plateau from an exercise's 1RM progression.
 *
 * Examines the last 3 data points (sorted ascending by date).
 * A plateau is detected when the growth between the oldest and
 * newest of those 3 points is <= 0.
 *
 * @param progressionData - Array of { date, oneRM } points.
 *                          May be unsorted; will be sorted by date ascending.
 * @returns true if a plateau is detected, false otherwise.
 */
export function detectPlateau(progressionData: OneRMDataPoint[]): boolean {
  if (progressionData.length < 3) {
    return false;
  }

  // Sort by date ascending to ensure correct temporal ordering
  const sorted = [...progressionData].sort((a, b) => a.date - b.date);

  // Examine the last 3 data points
  const lastThree = sorted.slice(-3);

  const oldest = lastThree[0].oneRM;
  const newest = lastThree[lastThree.length - 1].oneRM;

  // Plateau: no positive growth between oldest and newest of last 3 sessions
  return newest - oldest <= 0;
}
