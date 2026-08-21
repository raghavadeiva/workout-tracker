import { Trash2, GripVertical, X } from 'lucide-react';
import { motion, useAnimation } from 'framer-motion';
import { SetInput } from './SetInput';
import { SetRow } from './SetRow';
import { ExerciseSwap } from '../../recommendations/components/ExerciseSwap';
import type { Exercise, WeightUnit } from '../../../db/database';

interface ExerciseCardProps {
  exercise: Exercise;
  weightUnit: WeightUnit;
  availableEquipment: string[];
  onLogSet: (exerciseId: string, weight: number, reps: number) => void;
  onDeleteSet: (exerciseId: string, setId: string) => void;
  onDeleteExercise: (exerciseId: string) => void;
  onSwapExercise: (exerciseId: string, newName: string) => void;
  onReorder?: (exerciseId: string, direction: 'up' | 'down') => void;
}

// Swipe threshold for committing to delete reveal (Apple Design §6 — momentum projection)
const SWIPE_THRESHOLD = 80;

export function ExerciseCard({
  exercise,
  weightUnit,
  availableEquipment,
  onLogSet,
  onDeleteSet,
  onDeleteExercise,
  onSwapExercise,
  onReorder,
}: ExerciseCardProps) {
  const lastSet = exercise.sets[exercise.sets.length - 1];
  const hasPreviousSets = exercise.previousSets && exercise.previousSets.length > 0;
  const controls = useAnimation();

  // Swipe-to-delete gesture handler (Apple Design §2, §4, §5, §6)
  const handleDragEnd = (
    _event: MouseEvent | TouchEvent,
    info: { offset: { x: number }; velocity: { x: number } }
  ) => {
    const { x: offsetX } = info.offset;
    const { x: velocityX } = info.velocity;

    // Project endpoint using Apple's exponential decay function (Apple Design §6)
    const decelerationRate = 0.998;
    const projectedX =
      offsetX + (velocityX / 1000) * decelerationRate / (1 - decelerationRate);

    if (Math.abs(projectedX) > SWIPE_THRESHOLD) {
      // Commit to delete — animate to full reveal
      controls.start({
        x: projectedX > 0 ? 100 : -100,
        transition: { type: 'spring' as const, damping: 0.8, stiffness: 400 },
      });
      if (navigator.vibrate) {
        navigator.vibrate([15]);
      }
    } else {
      // Snap back to center
      controls.start({
        x: 0,
        transition: { type: 'spring' as const, damping: 1.0, stiffness: 500 },
      });
    }
  };

  const confirmDelete = () => {
    onDeleteExercise(exercise.id);
    if (navigator.vibrate) {
      navigator.vibrate([30]);
    }
  };

  return (
    <div className="relative">
      {/* Delete backdrop (revealed on swipe) */}
      <div
        className="absolute inset-0 flex items-center justify-center bg-red-500 rounded-2xl cursor-pointer"
        onClick={confirmDelete}
      >
        <X className="w-6 h-6 text-white" />
      </div>

      {/* Main card with horizontal drag gesture */}
      <motion.div
        layout
        drag="x"
        dragConstraints={{ left: -120, right: 120 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        variants={{
          initial: { opacity: 0, y: 12, scale: 0.97 },
          animate: { opacity: 1, y: 0, scale: 1 },
        }}
        initial="initial"
        animate={controls}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{
          type: 'spring' as const,
          damping: 1.0,
          stiffness: 300,
          restDelta: 0.5,
          delay: 0.04,
        }}
        className="relative space-y-3 bg-[--color-surface] dark:bg-gray-800 rounded-2xl border border-[--color-separator] dark:border-gray-700 shadow-elevated"
      >
        {/* Header: Delete · Reorder Handle · Exercise Swap */}
        <div className="flex items-center justify-between -mx-4 px-4 py-2">
          {/* Delete button (always accessible) */}
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              onDeleteExercise(exercise.id);
              if (navigator.vibrate) {
                navigator.vibrate([30]);
              }
            }}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors tap-feedback"
            aria-label="Delete exercise"
          >
            <Trash2 className="w-5 h-5" />
          </motion.button>

          <div className="flex items-center gap-1">
            {/* Reorder handle */}
            {onReorder && exercise.sets.length > 0 && (
              <motion.button
                type="button"
                drag
                dragConstraints={{ top: -10, bottom: 10 }}
                dragElastic={0.3}
                whileTap={{ scale: 0.9, backgroundColor: 'rgba(0,0,0,0.03)' }}
                onClick={() => onReorder(exercise.id, 'up')}
                className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors tap-feedback cursor-grab active:cursor-grabbing"
                aria-label="Move exercise up"
                title="Drag to reorder"
              >
                <GripVertical className="w-5 h-5" />
              </motion.button>
            )}
            <ExerciseSwap
              exerciseName={exercise.name}
              availableEquipment={availableEquipment}
              onSwapExercise={onSwapExercise}
            />
          </div>
        </div>

        {/* Ghost Previous Sets (read-only, strictly scoped by exercise name) */}
        {hasPreviousSets && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{
              type: 'spring' as const,
              damping: 1.0,
              stiffness: 400,
              delay: 0.06,
            }}
            className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
              <span className="w-3.5 h-3.5 flex items-center justify-center">
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="9" strokeWidth="1.5" />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 7v5l2 2"
                  />
                </svg>
              </span>
              <span className="font-medium">Previous Workout</span>
            </div>
            <div className="space-y-1">
              {exercise.previousSets!.map((set) => (
                <div
                  key={set.id}
                  className="flex items-center gap-2 text-sm font-mono text-gray-500 dark:text-gray-400"
                >
                  <span className="w-8 text-center">Set {set.setNumber}</span>
                  <span className="flex-1 text-right">{set.weight}</span>
                  <span className="w-8">× {set.reps}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Set Input */}
        <SetInput
          exerciseName={exercise.name}
          previousWeight={lastSet?.weight}
          previousReps={lastSet?.reps}
          nextSetNumber={exercise.sets.length + 1}
          weightUnit={weightUnit}
          onLogSet={(weight, reps) => {
            onLogSet(exercise.id, weight, reps);
            // Haptic feedback on set log
            if (navigator.vibrate) {
              navigator.vibrate([10]);
            }
          }}
        />

        {/* Completed Sets (most recent first) */}
        {exercise.sets.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{
              type: 'spring' as const,
              damping: 1.0,
              stiffness: 400,
              delay: 0.08,
            }}
            className="space-y-2"
          >
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
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
