import { useState, useEffect, useRef, type KeyboardEvent } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface SetInputProps {
  exerciseName: string;
  previousWeight?: number;
  previousReps?: number;
  nextSetNumber: number;
  weightUnit: 'lbs' | 'kg';
  onLogSet: (weight: number, reps: number) => void;
  disabled?: boolean;
}

export function SetInput({
  exerciseName,
  previousWeight,
  previousReps,
  nextSetNumber,
  weightUnit,
  onLogSet,
  disabled = false,
}: SetInputProps) {
  const [weight, setWeight] = useState<number | ''>(previousWeight ?? '');
  const [reps, setReps] = useState<number | ''>(previousReps ?? '');
  const [isLogging, setIsLogging] = useState(false);
  const weightInputRef = useRef<HTMLInputElement>(null);
  const repsInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus weight input on mount and when exercise/set number changes
  useEffect(() => {
    weightInputRef.current?.focus();
  }, [exerciseName, nextSetNumber]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, field: 'weight' | 'reps') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (field === 'weight') {
        repsInputRef.current?.focus();
      } else if (field === 'reps') {
        handleLogSet();
      }
    }
  };

  const handleLogSet = () => {
    const w = typeof weight === 'number' ? weight : Number(weight);
    const r = typeof reps === 'number' ? reps : Number(reps);

    if (!Number.isFinite(w) || !Number.isFinite(r) || w <= 0 || r <= 0) {
      return;
    }

    setIsLogging(true);
    onLogSet(w, r);

    // Reset for next set: pre-fill weight, clear reps, refocus
    setTimeout(() => {
      setWeight(w);
      setReps('');
      setIsLogging(false);
      weightInputRef.current?.focus();
    }, 100);
  };

  const canLog =
    typeof weight === 'number' && typeof reps === 'number' && weight > 0 && reps > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 1.0, stiffness: 300, delay: 0.06 }}
      className="space-y-3 p-4 bg-[--color-surface] dark:bg-gray-800 rounded-2xl border border-[--color-separator] dark:border-gray-700 shadow-elevated"
    >
      {/* Exercise name + set number badge */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold font-display text-[--color-text-primary]">
          {exerciseName}
        </h3>
        <span className="px-3 py-1 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-full">
          Set {nextSetNumber}
        </span>
      </div>

      {/* Weight + Reps inputs */}
      <div className="grid grid-cols-2 gap-3">
        {/* Weight */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
            Weight ({weightUnit})
          </label>
          <input
            ref={weightInputRef}
            type="number"
            inputMode="decimal"
            step={weightUnit === 'lbs' ? 5 : 2.5}
            min={0}
            value={weight}
            onChange={(e) => {
              const val = e.target.value;
              setWeight(val === '' ? '' : Number(val));
            }}
            onKeyDown={(e) => handleKeyDown(e, 'weight')}
            disabled={disabled || isLogging}
            className="w-full px-4 py-3.5 text-2xl font-mono text-[--color-text-primary] bg-gray-50 dark:bg-gray-900 border-2 border-[--color-separator] dark:border-gray-700 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="0"
            autoComplete="off"
          />
        </div>

        {/* Reps */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
            Reps
          </label>
          <input
            ref={repsInputRef}
            type="number"
            inputMode="numeric"
            step={1}
            min={1}
            max={100}
            value={reps}
            onChange={(e) => {
              const val = e.target.value;
              setReps(val === '' ? '' : Number(val));
            }}
            onKeyDown={(e) => handleKeyDown(e, 'reps')}
            disabled={disabled || isLogging}
            className="w-full px-4 py-3.5 text-2xl font-mono text-[--color-text-primary] bg-gray-50 dark:bg-gray-900 border-2 border-[--color-separator] dark:border-gray-700 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="0"
            autoComplete="off"
          />
        </div>
      </div>

      {/* Log Set Button */}
      <motion.button
        type="button"
        onClick={handleLogSet}
        disabled={disabled || isLogging || !canLog}
        whileTap={{ scale: 0.97 }}
        className="w-full py-3.5 text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl transition-colors flex items-center justify-center gap-2 tap-feedback"
      >
        {isLogging ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Logging...
          </>
        ) : (
          <>
            <Check className="w-5 h-5" />
            Log Set
          </>
        )}
      </motion.button>
    </motion.div>
  );
}
