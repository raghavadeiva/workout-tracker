/**
 * exerciseVectors.ts — recommendation data + query API (Phase 14)
 *
 * Data source: exercises.json → scripts/exercises-seeder.js
 * → exerciseVectors.generated.ts (873 exercises, 20-dim muscle vectors).
 *
 * This module is the app-facing API over that generated dataset:
 *   - EXERCISE_LIBRARY        the full dataset
 *   - getRecommendations()    cosine-similarity substitutes
 *   - getAllExerciseNames()   library names
 *   - normalizeEquipment()    raw dataset string → app filter type
 *
 * Vector schema (20 dims, see GENERATED_MUSCLE_DIMENSIONS):
 *   primaryMuscles → 1.0 · secondaryMuscles → 0.5 · else 0.0
 */

import {
  GENERATED_EXERCISE_VECTORS,
  GENERATED_MUSCLE_DIMENSIONS,
  type GeneratedExerciseVector,
} from './exerciseVectors.generated';
import { calculateCosineSimilarity } from './vectorUtils';

// ─── Public types ──────────────────────────────────────────────

export interface RecommendationResult {
  /** Exercise name as shown in the UI. */
  exercise: string;
  /** Cosine similarity in [0, 1] for non-negative activation vectors. */
  score: number;
}

export type ExerciseVector = number[];

/** The full generated library, name-normalized once at module load. */
export const EXERCISE_LIBRARY: readonly GeneratedExerciseVector[] =
  GENERATED_EXERCISE_VECTORS;

/** Dimension labels, index-aligned with every vector. */
export const VECTOR_DIMENSIONS: readonly string[] = GENERATED_MUSCLE_DIMENSIONS;

// ─── Name index ────────────────────────────────────────────────

/**
 * Lookup by display name. Dataset ids contain characters the UI never shows
 * (e.g. "3_4_Sit-Up" vs name "3/4 Sit-Up"), so recommendations key off
 * `name`, which is what ExerciseSwap and the analytics picker display.
 */
const BY_NAME: Map<string, GeneratedExerciseVector> = new Map(
  EXERCISE_LIBRARY.map((rec) => [rec.name, rec])
);

// ─── Equipment normalization ───────────────────────────────────

/**
 * Raw dataset equipment strings → the app's four filter buckets
 * (kept identical to the legacy EQUIPMENT_TYPES contract).
 *
 * "other" and unmapped strings return null: those exercises are treated as
 * always available so an unknown tool never hides a good substitute.
 */
const EQUIPMENT_MAP: Record<string, EquipmentType | null> = {
  'barbell': 'barbell',
  'dumbbell': 'dumbbell',
  'machine': 'machine',
  'cable': 'machine', // cable stacks are machine-family
  'e-z curl bar': 'barbell',
  'body only': 'bodyweight',
  'exercise ball': null,
  'kettlebells': 'dumbbell',
  'bands': null,
  'medicine ball': null,
  'foam roll': null,
  'other': null,
};

export type EquipmentType = 'barbell' | 'dumbbell' | 'machine' | 'bodyweight';

export const EQUIPMENT_TYPES: EquipmentType[] = [
  'barbell',
  'dumbbell',
  'machine',
  'bodyweight',
];

/** Map a raw dataset equipment string to a filter bucket (null = unrestricted). */
export function normalizeEquipment(raw: string): EquipmentType | null {
  return EQUIPMENT_MAP[raw?.toLowerCase().trim()] ?? null;
}

// Precomputed per-record equipment buckets (module-level, computed once).
const EQUIPMENT_BUCKETS: ReadonlyMap<string, Set<EquipmentType>> = new Map(
  EXERCISE_LIBRARY.map((rec) => {
    const buckets = new Set<EquipmentType>();
    const normalized = normalizeEquipment(rec.equipment);
    if (normalized) buckets.add(normalized);
    return [rec.name, buckets] as const;
  })
);

// ─── Queries ───────────────────────────────────────────────────

/**
 * Returns the highest-scoring exercise substitutes for a target exercise,
 * ranked by cosine similarity. The target itself is excluded.
 *
 * Cosine similarity runs over whatever dimension count the vectors carry —
 * magnitude/dot product loop to `vector.length`, so the 20-dim arrays just work.
 *
 * @param targetExerciseName - Display name of the exercise to substitute.
 * @param topN - Number of results (default 2).
 */
export function getRecommendations(
  targetExerciseName: string,
  topN: number = 2
): RecommendationResult[] {
  const target = BY_NAME.get(targetExerciseName);
  if (!target) return [];

  const results: RecommendationResult[] = [];
  for (const candidate of EXERCISE_LIBRARY) {
    if (candidate.name === targetExerciseName) continue;
    results.push({
      exercise: candidate.name,
      score: calculateCosineSimilarity(target.vector, candidate.vector),
    });
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, Math.max(0, topN));
}

/** All exercise names in the library (display names, sorted). */
export function getAllExerciseNames(): string[] {
  return EXERCISE_LIBRARY.map((r) => r.name).sort((a, b) =>
    a.localeCompare(b)
  );
}

/** Look up one library record by display name (null if absent). */
export function getLibraryEntry(name: string): GeneratedExerciseVector | null {
  return BY_NAME.get(name) ?? null;
}

/** Equipment buckets for one exercise by display name. */
export function getEquipmentBuckets(
  name: string
): ReadonlySet<EquipmentType> {
  return EQUIPMENT_BUCKETS.get(name) ?? new Set();
}
