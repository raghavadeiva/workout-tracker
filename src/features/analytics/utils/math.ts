export function calculateEpley1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  return Math.round(weight * (1 + reps / 30));
}

export function getBestSet1RM(sets: { weight: number; reps: number }[]): number {
  let best1RM = 0;
  for (const set of sets) {
    const epley = calculateEpley1RM(set.weight, set.reps);
    if (epley > best1RM) {
      best1RM = epley;
    }
  }
  return best1RM;
}

export function getExerciseProgression(
  history: { id: string; startedAt: number; exercises: { name: string; sets: { weight: number; reps: number }[] }[] }[],
  exerciseName: string
): { date: number; oneRM: number }[] {
  const progression: { date: number; oneRM: number }[] = [];

  for (const session of history) {
    const exercise = session.exercises.find((ex) => ex.name === exerciseName);
    if (exercise && exercise.sets.length > 0) {
      const best1RM = getBestSet1RM(exercise.sets);
      if (best1RM > 0) {
        progression.push({
          date: session.startedAt,
          oneRM: best1RM,
        });
      }
    }
  }

  // Sort by date ascending for chart; startedAt is ms-precision so ties are
  // near-impossible, but the id tie-break keeps ordering stable if they occur.
  return progression.sort(
    (a, b) => a.date - b.date || a.oneRM - b.oneRM
  );
}

export function getAllExerciseNames(history: { exercises: { name: string }[] }[]): string[] {
  const names = new Set<string>();
  for (const session of history) {
    for (const exercise of session.exercises) {
      names.add(exercise.name);
    }
  }
  return Array.from(names).sort();
}