/**
 * Muscle activation fractional multipliers for common exercises.
 *
 * Each exercise maps to a set of muscle groups with fractional values (0.0 to 1.0)
 * representing the proportional volume contribution per set.
 * These multipliers are applied as: volume = sets * reps * weight * multiplier
 *
 * Example: Bench Press = { chest: 1.0, triceps: 0.5, anteriorDeltoid: 0.25 }
 */

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

/**
 * Fractional muscle activation multipliers per exercise.
 * A value of 1.0 = primary mover, 0.5 = significant contributor, 0.25 = minor.
 * Exercises not listed default to an empty map (zero volume contribution).
 */
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

/**
 * Returns the muscle activation map for a given exercise.
 * Falls back to an empty map if the exercise is not in the predefined library.
 */
export function getMuscleActivations(exerciseName: string): Partial<Record<MuscleGroup, number>> {
  return MUSCLE_ACTIVATION_MAP[exerciseName] ?? {};
}
