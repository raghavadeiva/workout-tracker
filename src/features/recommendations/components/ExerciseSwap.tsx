import { useState } from 'react';
import { Replace, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRecommendations } from '../../recommendations/useRecommendations';
import type { RecommendationResult } from '../../recommendations/exerciseVectors';

interface ExerciseSwapProps {
  exerciseName: string;
  availableEquipment: string[];
  onSwapExercise: (oldName: string, newName: string) => void;
}

/**
 * ExerciseSwap — shows a button that, when clicked, fetches
 * cosine-similarity-based exercise substitution suggestions and
 * allows the user to swap the current exercise for a recommended one.
 *
 * Context-aware: filters by available equipment.
 */
export function ExerciseSwap({
  exerciseName,
  availableEquipment,
  onSwapExercise,
}: ExerciseSwapProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedForSwap, setSelectedForSwap] = useState<string | null>(null);

  // Fetch recommendations for the current exercise
  const { recommendations, isLoading, error } = useRecommendations(exerciseName, {
    topN: 3,
    availableEquipment:
      availableEquipment.length > 0 ? availableEquipment : undefined,
  });

  const handleSwap = (newExercise: string) => {
    setSelectedForSwap(newExercise);
    // Small delay for visual feedback before actual swap
    setTimeout(() => {
      onSwapExercise(exerciseName, newExercise);
      setIsOpen(false);
      setSelectedForSwap(null);
    }, 150);
  };

  return (
    <div className="relative">
      <motion.button
        type="button"
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors tap-feedback"
        aria-label={`Find alternatives for ${exerciseName}`}
      >
        <Replace className="w-4 h-4" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ type: 'spring' as const, damping: 1.0, stiffness: 400 }}
            className="absolute top-full right-0 mt-1 w-56 bg-[--color-surface] dark:bg-gray-800 border border-[--color-separator] dark:border-gray-700 rounded-xl shadow-popover z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-3 border-b border-[--color-separator] dark:border-gray-700 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Alternatives
              </span>
              <motion.button
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded tap-feedback"
              >
                <X className="w-3 h-3" />
              </motion.button>
            </div>

            {/* Body */}
            <div className="p-2 max-h-60 overflow-y-auto">
              {isLoading && (
                <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                  Finding alternatives...
                </div>
              )}

              {error && (
                <div className="px-3 py-2 text-sm text-red-500">
                  {error}
                </div>
              )}

              {!isLoading && !error && recommendations && recommendations.length > 0 ? (
                <div className="space-y-1">
                  {recommendations.map((rec: RecommendationResult) => (
                    <motion.button
                      key={rec.exercise}
                      type="button"
                      whileTap={{ scale: 0.97, backgroundColor: 'rgba(0,0,0,0.03)' }}
                      onClick={() => handleSwap(rec.exercise)}
                      disabled={selectedForSwap === rec.exercise}
                      className="w-full flex items-center justify-between px-3 py-2 text-left rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors tap-feedback disabled:opacity-50"
                    >
                      <span className="font-medium text-[--color-text-primary]">
                        {rec.exercise}
                      </span>
                      <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                        {Math.round(rec.score * 100)}% match
                      </span>
                    </motion.button>
                  ))}
                </div>
              ) : (
                !isLoading &&
                !error && (
                  <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                    No alternatives found
                  </div>
                )
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
