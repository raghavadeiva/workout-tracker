import { Trash2, GripVertical, Clock } from 'lucide-react';
import { SetInput } from './SetInput';
import { SetRow } from './SetRow';
import type { Exercise, WeightUnit } from '../../../db/database';

interface ExerciseCardProps {
  exercise: Exercise;
  weightUnit: WeightUnit;
  onLogSet: (exerciseId: string, weight: number, reps: number) => void;
  onDeleteSet: (exerciseId: string, setId: string) => void;
  onDeleteExercise: (exerciseId: string) => void;
  onReorder?: (exerciseId: string, direction: 'up' | 'down') => void;
}

export function ExerciseCard({
  exercise,
  weightUnit,
  onLogSet,
  onDeleteSet,
  onDeleteExercise,
  onReorder,
}: ExerciseCardProps) {
  const lastSet = exercise.sets[exercise.sets.length - 1];
  const hasPreviousSets = exercise.previousSets && exercise.previousSets.length > 0;

  return (
    <div className="relative space-y-3">
      {/* Drag handle + delete exercise */}
      <div className="flex items-center justify-between -mx-4 px-4 py-2">
        <button
          onClick={() => onDeleteExercise(exercise.id)}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          aria-label="Delete exercise"
        >
          <Trash2 className="w-5 h-5" />
        </button>
        {onReorder && exercise.sets.length > 0 && (
          <button
            onClick={() => onReorder(exercise.id, 'up')}
            className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            aria-label="Move up"
          >
            <GripVertical className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Previous Sets Ghost Data */}
      {hasPreviousSets && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
            <Clock className="w-3.5 h-3.5" />
            <span className="font-medium">Previous Workout</span>
          </div>
          <div className="space-y-1">
            {exercise.previousSets!.map((set) => (
              <div key={set.id} className="flex items-center gap-2 text-sm font-mono text-gray-500 dark:text-gray-400">
                <span className="w-8 text-center">Set {set.setNumber}</span>
                <span className="flex-1 text-right">{set.weight}</span>
                <span className="w-8">× {set.reps}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Set Input */}
      <SetInput
        exerciseName={exercise.name}
        previousWeight={lastSet?.weight}
        previousReps={lastSet?.reps}
        nextSetNumber={exercise.sets.length + 1}
        weightUnit={weightUnit}
        onLogSet={(weight, reps) => onLogSet(exercise.id, weight, reps)}
      />

      {/* Completed Sets */}
      {exercise.sets.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Completed Sets
            </span>
          </div>
          {exercise.sets
            .slice()
            .reverse()
            .map((set, index) => (
              <SetRow
                key={set.id}
                setNumber={exercise.sets.length - index}
                weight={set.weight}
                reps={set.reps}
                onDelete={() => onDeleteSet(exercise.id, set.id)}
                weightUnit={weightUnit}
              />
            ))}
        </div>
      )}
    </div>
  );
}