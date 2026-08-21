/**
 * Muscle activation fractional multipliers for exercises.
 *
 * A value of 1.0 = primary mover (a "full set"), 0.5 = significant contributor
 * ("half a set"), 0.25 = minor.
 *
 * Lookup order in getMuscleActivations():
 *   1. MUSCLE_ACTIVATION_MAP — hand-tuned overrides
 *   2. The generated 873-exercise library, whose 20-dim vectors use the same
 *      encoding (primary 1.0 / secondary 0.5), mapped onto the app's
 *      10 MuscleGroups via DATASET_DIM_TO_MUSCLE below.
 *
 * Exercises in neither source contribute zero volume.
 */

import {
  EXERCISE_LIBRARY,
  VECTOR_DIMENSIONS,
} from '../recommendations/exerciseVectors';

export type MuscleGroup =
  | 'chest'
  | 'upperBack'
  | 'shoulders'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'triceps'
  | 'biceps'
  | 'calves'
  | 'abs';

export const MUSCLE_GROUPS: MuscleGroup[] = [
  'chest',
  'upperBack',
  'shoulders',
  'quads',
  'hamstrings',
  'glutes',
  'triceps',
  'biceps',
  'calves',
  'abs',
];

/** Human-readable labels for display. */
export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: 'Chest',
  upperBack: 'Upper Back',
  shoulders: 'Shoulders',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  glutes: 'Glutes',
  triceps: 'Triceps',
  biceps: 'Biceps',
  calves: 'Calves',
  abs: 'Abs',
};

/** Hand-tuned activation overrides (take precedence over the library). */
export const MUSCLE_ACTIVATION_MAP: Record<string, Partial<Record<MuscleGroup, number>>> = {
  // Upper-body push
  'Bench Press': { chest: 1.0, triceps: 0.5, shoulders: 0.25 },
  'Incline DB Press': { chest: 0.8, shoulders: 0.4, triceps: 0.3 },
  'Overhead Press': { shoulders: 1.0, triceps: 0.5, upperBack: 0.2 },
  'Dip': { chest: 0.7, triceps: 0.8, shoulders: 0.3 },

  // Lower-body
  'Squat': { quads: 1.0, glutes: 0.7, hamstrings: 0.5, upperBack: 0.3 },
  'Deadlift': { hamstrings: 1.0, glutes: 0.8, upperBack: 0.9, calves: 0.3 },
  'RDL': { hamstrings: 0.9, glutes: 0.8, upperBack: 0.6 },
  'Leg Press': { quads: 1.0, glutes: 0.6, hamstrings: 0.3 },
  'Lunge': { quads: 0.8, glutes: 0.6, hamstrings: 0.4, calves: 0.3 },

  // Upper-body pull
  'Barbell Row': { upperBack: 1.0, biceps: 0.4, shoulders: 0.3 },
  'Pull-up': { upperBack: 1.0, biceps: 0.5, shoulders: 0.3 },
  'Lat Pulldown': { upperBack: 0.9, biceps: 0.5, shoulders: 0.2 },

  // Accessory
  'Calf Raise': { calves: 1.0 },
  'Plank': { abs: 1.0 },
  'Hammer Curl': { biceps: 1.0 },
  'Overhead Triceps Extension': { triceps: 1.0, shoulders: 0.3 },
};

// ─── Generated-library bridge ────────────────────────────────────────────
//
// Maps the seeder's 20 dataset dimensions onto the app's 10 MuscleGroups.
// upperBack aggregates lats + middle back + traps; forearms/neck/hip muscles
// have no dedicated app muscle and are ignored.

const DATASET_DIM_TO_MUSCLE: Record<string, MuscleGroup | null> = {
  abdominals: 'abs',
  abductors: null,
  adductors: null,
  biceps: 'biceps',
  calves: 'calves',
  chest: 'chest',
  forearms: null,
  glutes: 'glutes',
  hamstrings: 'hamstrings',
  lats: 'upperBack',
  'lower back': 'upperBack',
  'middle back': 'upperBack',
  neck: null,
  quadriceps: 'quads',
  shoulders: 'shoulders',
  traps: 'upperBack',
  triceps: 'triceps',
  spare_17: null,
  spare_18: null,
  spare_19: null,
};

/**
 * Activation lookup built once at module load from the generated library.
 * Each app muscle takes the MAXIMUM activation among all dataset dims that
 * map to it (max preserves 1.0-primary semantics — summing would let
 * lats+traps inflate upperBack past 1.0).
 */
const LIBRARY_ACTIVATIONS: Map<string, Partial<Record<MuscleGroup, number>>> =
  (() => {
    const map = new Map<
      string,
      Partial<Record<MuscleGroup, number>>
    >();
    for (const rec of EXERCISE_LIBRARY) {
      const activations: Partial<Record<MuscleGroup, number>> = {};
      VECTOR_DIMENSIONS.forEach((dimName: string, i: number) => {
        const value = rec.vector[i] ?? 0;
        if (value <= 0) return;
        const muscle = DATASET_DIM_TO_MUSCLE[dimName];
        if (!muscle) return;
        activations[muscle] = Math.max(activations[muscle] ?? 0, value);
      });
      map.set(rec.name, activations);
    }
    return map;
  })();

/**
 * Returns the muscle activation map for a given exercise.
 * Hand-tuned overrides take precedence; otherwise falls back to the
 * generated 873-exercise library. Empty map = zero volume contribution.
 */
export function getMuscleActivations(
  exerciseName: string
): Partial<Record<MuscleGroup, number>> {
  return (
    MUSCLE_ACTIVATION_MAP[exerciseName] ??
    LIBRARY_ACTIVATIONS.get(exerciseName) ??
    {}
  );
}
