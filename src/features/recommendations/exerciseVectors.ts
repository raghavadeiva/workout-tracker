/**
 * Hardcoded exercise embedding vectors for the recommendation engine.
 *
 * Vector dimension schema (20 dimensions):
 *  Muscle Groups (0-9):
 *    0  chest
 *    1  upperBack  (lats, rhomboids, traps)
 *    2  shoulders  (deltoids)
 *    3  quads
 *    4  hamstrings
 *    5  glutes
 *    6  triceps
 *    7  biceps
 *    8  calves
 *    9  abs
 *  Equipment (10-13):
 *    10 barbell
 *    11 dumbbell
 *    12 machine
 *    13 bodyweight
 *  Movement Patterns (14-19):
 *    14 push
 *    15 pull
 *    16 hinge
 *    17 squat
 *    18 lunge
 *    19 carry
 */

import { calculateCosineSimilarity } from './vectorUtils';

/** Ordered dimension names matching the vector indices above. */
export const VECTOR_DIMENSIONS = [
  'chest', 'upperBack', 'shoulders', 'quads', 'hamstrings',
  'glutes', 'triceps', 'biceps', 'calves', 'abs',
  'barbell', 'dumbbell', 'machine', 'bodyweight',
  'push', 'pull', 'hinge', 'squat', 'lunge', 'carry',
] as const;

export type ExerciseVector = Float32Array;

export interface RecommendationResult {
  exercise: string;
  score: number;
}

/**
 * Build a Float32Array vector from a named-dimension map.
 * Unspecified dimensions default to 0.
 */
function buildVector(
  dims: Partial<Record<(typeof VECTOR_DIMENSIONS)[number], number>>
): ExerciseVector {
  const vec = new Float32Array(VECTOR_DIMENSIONS.length);
  for (let i = 0; i < VECTOR_DIMENSIONS.length; i++) {
    const dim = VECTOR_DIMENSIONS[i];
    vec[i] = dims[dim] ?? 0;
  }
  return vec;
}

/**
 * Hardcoded exercise embedding vectors.
 * Values represent proportional activation/usage (0.0 to 1.0).
 */
export const EXERCISE_VECTORS: Record<string, ExerciseVector> = {
  // Upper-body push compound movements
  'Bench Press': buildVector({
    chest: 1.0, triceps: 0.5, shoulders: 0.2,
    barbell: 1.0, push: 1.0,
  }),
  'Incline DB Press': buildVector({
    chest: 0.8, shoulders: 0.4, triceps: 0.3,
    dumbbell: 1.0, push: 0.9,
  }),
  'Overhead Press': buildVector({
    shoulders: 1.0, triceps: 0.5,
    dumbbell: 0.7, barbell: 0.3, push: 0.8,
  }),
  'Dip': buildVector({
    chest: 0.6, triceps: 0.8, shoulders: 0.3,
    bodyweight: 1.0, push: 0.8,
  }),

  // Lower-body compound movements
  'Squat': buildVector({
    quads: 1.0, glutes: 0.7, hamstrings: 0.5, upperBack: 0.3,
    barbell: 1.0, squat: 1.0,
  }),
  'Deadlift': buildVector({
    hamstrings: 1.0, glutes: 0.8, upperBack: 0.9, calves: 0.3,
    barbell: 1.0, hinge: 1.0,
  }),
  'RDL': buildVector({
    hamstrings: 0.9, glutes: 0.8, upperBack: 0.6,
    barbell: 1.0, hinge: 0.9,
  }),
  'Leg Press': buildVector({
    quads: 1.0, glutes: 0.6, hamstrings: 0.3,
    machine: 1.0, squat: 0.8,
  }),
  'Lunge': buildVector({
    quads: 0.8, glutes: 0.6, hamstrings: 0.4, calves: 0.3,
    dumbbell: 0.7, bodyweight: 0.3, lunge: 1.0,
  }),

  // Upper-body pull movements
  'Barbell Row': buildVector({
    upperBack: 1.0, biceps: 0.4, shoulders: 0.3,
    barbell: 1.0, pull: 0.9,
  }),
  'Pull-up': buildVector({
    upperBack: 1.0, biceps: 0.5, shoulders: 0.3,
    bodyweight: 1.0, pull: 1.0,
  }),
  'Lat Pulldown': buildVector({
    upperBack: 0.9, biceps: 0.5, shoulders: 0.2,
    machine: 1.0, pull: 0.8,
  }),

  // Accessory / isolation movements
  'Calf Raise': buildVector({
    calves: 1.0, quads: 0.2, glutes: 0.1,
    machine: 0.7, barbell: 0.3, squat: 0.5,
  }),
  'Plank': buildVector({
    abs: 1.0, glutes: 0.2, upperBack: 0.3,
    bodyweight: 1.0, carry: 0.3,
  }),
  'Hammer Curl': buildVector({
    biceps: 1.0,
    dumbbell: 1.0,
  }),
  'Overhead Triceps Extension': buildVector({
    triceps: 1.0, shoulders: 0.3,
    dumbbell: 1.0,
  }),
};

/**
 * Returns the highest-scoring exercise substitutes for a target exercise,
 * ranked by cosine similarity. The target exercise itself is excluded.
 *
 * @param targetExerciseName - The exercise to find alternatives for.
 * @param topN - Number of results to return (default: 2).
 * @returns Array of { exercise, score } sorted by score descending.
 */
export function getRecommendations(
  targetExerciseName: string,
  topN: number = 2
): RecommendationResult[] {
  const targetVector = EXERCISE_VECTORS[targetExerciseName];
  if (!targetVector) {
    return [];
  }

  const results: RecommendationResult[] = [];

  for (const [name, vector] of Object.entries(EXERCISE_VECTORS)) {
    if (name === targetExerciseName) continue;

    const score = calculateCosineSimilarity(targetVector, vector);
    results.push({ exercise: name, score });
  }

  // Sort by similarity score descending and take top N
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, topN);
}

/**
 * Returns all available exercise names in the vector library.
 */
export function getAllExerciseNames(): string[] {
  return Object.keys(EXERCISE_VECTORS);
}
