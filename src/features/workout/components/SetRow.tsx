import { X } from 'lucide-react';
import { motion } from 'framer-motion';

interface SetRowProps {
  setNumber: number;
  weight: number;
  reps: number;
  onDelete: () => void;
  weightUnit: 'lbs' | 'kg';
}

export function SetRow({ setNumber, weight, reps, onDelete, weightUnit }: SetRowProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, scale: 0.97 }}
      transition={{ type: 'spring', damping: 1.0, stiffness: 400 }}
      className="flex items-center gap-3 p-3 bg-[--color-surface] dark:bg-gray-800 rounded-xl border border-[--color-separator] dark:border-gray-700 shadow-elevated"
    >
      {/* Set Number */}
      <div className="w-10 text-center">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Set {setNumber}
        </span>
      </div>

      {/* Weight */}
      <div className="flex-1 flex items-center gap-2">
        <span className="w-16 text-right text-lg font-mono text-[--color-text-primary]">
          {weight}
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400 w-12">{weightUnit}</span>
      </div>

      {/* Reps */}
      <div className="flex-1 flex items-center gap-2">
        <span className="text-lg font-mono text-[--color-text-primary]">
          × {reps}
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400">reps</span>
      </div>

      {/* Delete */}
      <motion.button
        type="button"
        onClick={onDelete}
        whileTap={{ scale: 0.9 }}
        className="p-2 -mr-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors tap-feedback"
        aria-label="Delete set"
      >
        <X className="w-5 h-5" />
      </motion.button>
    </motion.div>
  );
}
