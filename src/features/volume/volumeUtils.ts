/**
 * Volume calculation utilities for weekly muscle group load tracking.
 *
 * Computes: volume = sets * reps * weight * muscleMultiplier
 * Groups totals by ISO week and per-muscle-group.
 */

import type { WorkoutSession } from '../../db/database';
import {
  getMuscleActivations,
  MUSCLE_GROUPS,
  type MuscleGroup,
} from './muscleMaps';

/** Volume for a single muscle group within a single ISO week. */
export interface MuscleVolumeData {
  chest: number;
  upperBack: number;
  shoulders: number;
  quads: number;
  hamstrings: number;
  glutes: number;
  triceps: number;
  biceps: number;
  calves: number;
  abs: number;
}

/** Aggregated weekly volume entry. */
export interface WeeklyVolumeEntry {
  weekKey: string;
  weekLabel: string;
  volumes: MuscleVolumeData;
}

/** Zeroed-out volume template for initialization. */
function zeroVolumes(): MuscleVolumeData {
  const volumes = {} as MuscleVolumeData;
  for (const muscle of MUSCLE_GROUPS) {
    volumes[muscle] = 0;
  }
  return volumes;
}

/**
 * Gets the ISO week identifier (e.g. "2024-W23") and a human-readable label
 * (e.g. "2024 Week 23") from a timestamp.
 */
function getISOWeek(timestamp: number): { weekKey: string; weekLabel: string } {
  const date = new Date(timestamp);
  const year = date.getFullYear();

  // ISO week calculation
  const d = new Date(Date.UTC(year, date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

  const weekKey = `${d.getUTCFullYear()}-W${week}`;
  const weekLabel = `${d.getUTCFullYear()} Week ${week}`;
  return { weekKey, weekLabel };
}

/**
 * Calculates the volume contribution of a single set for a given muscle group.
 * volume = weight * reps * multiplier
 */
function calculateSetVolume(
  weight: number,
  reps: number,
  multiplier: number
): number {
  return weight * reps * multiplier;
}

/**
 * Computes the total volume for a single set across all muscle groups.
 * Returns a partial volumes object with only affected muscles.
 */
function calculateSetMuscleVolumes(
  weight: number,
  reps: number,
  activations: Partial<Record<MuscleGroup, number>>
): Partial<MuscleVolumeData> {
  const result: Partial<MuscleVolumeData> = {};
  for (const muscle of MUSCLE_GROUPS) {
    const multiplier = activations[muscle] ?? 0;
    if (multiplier > 0) {
      result[muscle] = calculateSetVolume(weight, reps, multiplier);
    }
  }
  return result;
}

/**
 * Aggregates historical set volume weekly using weighted multi-dimensional
 * muscle activation maps.
 *
 * Iterates through all completed workout sessions, applies fractional muscle
 * multipliers to each set (volume = sets * reps * weight * multiplier),
 * and groups totals by ISO week and muscle group.
 *
 * @param history - Array of completed workout sessions.
 * @returns Array of weekly volume entries sorted by week ascending.
 */
export function calculateWeeklyVolume(
  history: WorkoutSession[]
): WeeklyVolumeEntry[] {
  const weeklyMap = new Map<string, WeeklyVolumeEntry>();

  for (const session of history) {
    const { weekKey, weekLabel } = getISOWeek(session.startedAt);

    let entry = weeklyMap.get(weekKey);
    if (!entry) {
      entry = {
        weekKey,
        weekLabel,
        volumes: zeroVolumes(),
      };
      weeklyMap.set(weekKey, entry);
    }

    for (const exercise of session.exercises) {
      const activations = getMuscleActivations(exercise.name);
      if (Object.keys(activations).length === 0) continue;

      for (const set of exercise.sets) {
        const setVolumes = calculateSetMuscleVolumes(set.weight, set.reps, activations);
        for (const muscle of MUSCLE_GROUPS) {
          if (setVolumes[muscle] !== undefined) {
            entry.volumes[muscle] += setVolumes[muscle]!;
          }
        }
      }
    }
  }

  // Sort by week ascending (chronological order)
  return Array.from(weeklyMap.values()).sort((a, b) =>
    a.weekKey.localeCompare(b.weekKey)
  );
}

/**
 * Gets the latest week's volume per muscle group for summary display.
 */
export function getLatestWeekVolumes(
  history: WorkoutSession[]
): MuscleVolumeData | null {
  const weekly = calculateWeeklyVolume(history);
  if (weekly.length === 0) return null;
  return weekly[weekly.length - 1].volumes;
}

/** Thresholds for overtraining/undertraining detection (in volume units). */
const OVERTRAINING_THRESHOLD = 10000; // volume above this per muscle per week = overreaching risk
const UNDERTRAINING_THRESHOLD = 500;  // volume below this per muscle per week = undertraining risk

/** Result of overtraining/undertraining analysis for a single week. */
export interface VolumeRiskResult {
  muscle: MuscleGroup;
  volume: number;
  risk: 'overtrained' | 'undertrained' | 'normal';
  label: string;
}

/**
 * Detects overtraining and undertraining risks based on the latest week's
 * per-muscle volume.
 *
 * - Overtrained: volume exceeds OVERTRAINING_THRESHOLD for a muscle group
 * - Undertrained: volume is below UNDERTRAINING_THRESHOLD (but > 0) for a muscle group
 *
 * @param history - Array of completed workout sessions.
 * @returns Array of risk results for the latest week, only including at-risk muscles.
 */
export function detectVolumeRisks(
  history: WorkoutSession[]
): VolumeRiskResult[] {
  const latestVolumes = getLatestWeekVolumes(history);
  if (!latestVolumes) return [];

  const results: VolumeRiskResult[] = [];
  for (const muscle of MUSCLE_GROUPS) {
    const volume = latestVolumes[muscle];
    if (volume === 0) continue; // no data for this muscle
    if (volume >= OVERTRAINING_THRESHOLD) {
      results.push({
        muscle,
        volume,
        risk: 'overtrained',
        label: 'Overtrained',
      });
    } else if (volume < UNDERTRAINING_THRESHOLD) {
      results.push({
        muscle,
        volume,
        risk: 'undertrained',
        label: 'Undertrained',
      });
    }
  }
  return results;
}

/** Result of muscle group balance analysis. */
export interface MuscleBalanceResult {
  muscle: MuscleGroup;
  volume: number;
  percentage: number;
  deviation: number;
}

/**
 * Analyzes muscle group balance based on the latest week's volume.
 *
 * Computes each muscle's share of total volume and its deviation from
 * the ideal even split (100% / numMuscleGroups). Muscles with high
 * deviation indicate imbalance.
 *
 * @param history - Array of completed workout sessions.
 * @returns Array of balance results for all muscle groups, sorted by deviation descending.
 */
export function analyzeMuscleBalance(
  history: WorkoutSession[]
): MuscleBalanceResult[] {
  const latestVolumes = getLatestWeekVolumes(history);
  if (!latestVolumes) return [];

  const totalVolume = MUSCLE_GROUPS.reduce(
    (sum, m) => sum + latestVolumes[m],
    0
  );
  if (totalVolume === 0) return [];

  const idealShare = 100 / MUSCLE_GROUPS.length;

  const results: MuscleBalanceResult[] = [];
  for (const muscle of MUSCLE_GROUPS) {
    const volume = latestVolumes[muscle];
    const percentage = totalVolume > 0 ? (volume / totalVolume) * 100 : 0;
    const deviation = Math.abs(percentage - idealShare);
    results.push({
      muscle,
      volume,
      percentage,
      deviation,
    });
  }

  // Sort by deviation descending — highest imbalance first
  return results.sort((a, b) => b.deviation - a.deviation);
}
