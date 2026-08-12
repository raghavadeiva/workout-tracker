export interface Exercise {
  id: string;
  name: string;
  sets: SetEntry[];
}

export interface SetEntry {
  id: string;
  setNumber: number;
  weight: number;
  reps: number;
  completedAt: number;
}

export interface WorkoutSession {
  id: string;
  startedAt: number;
  exercises: Exercise[];
  isActive: boolean;
}

export type WeightUnit = 'lbs' | 'kg';