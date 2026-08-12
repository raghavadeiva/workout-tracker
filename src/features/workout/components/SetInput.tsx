import { useState, useEffect, useRef, type KeyboardEvent } from 'react';
import { Loader2, Check } from 'lucide-react';

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

  // Auto-focus weight input on mount
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

    // Reset for next set, pre-fill with current values
    setTimeout(() => {
      setWeight(w);
      setReps('');
      setIsLogging(false);
      weightInputRef.current?.focus();
    }, 100);
  };

  const canLog = typeof weight === 'number' && typeof reps === 'number' && weight > 0 && reps > 0;

  return (
    <div className="space-y-3 p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
      {/* Exercise name + set number */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {exerciseName}
        </h3>
        <span className="px-3 py-1 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-full">
          Set {nextSetNumber}
        </span>
      </div>

      {/* Inputs row */}
      <div className="grid grid-cols-2 gap-3">
        {/* Weight */}
        <div className="relative">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
            Weight ({weightUnit})
          </label>
          <div className="relative">
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
              className="w-full px-4 py-3.5 text-2xl font-mono text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="0"
              autoComplete="off"
            />
          </div>
        </div>

        {/* Reps */}
        <div className="relative">
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
            className="w-full px-4 py-3.5 text-2xl font-mono text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="0"
            autoComplete="off"
          />
        </div>
      </div>

      {/* Log Set Button */}
      <button
        onClick={handleLogSet}
        disabled={disabled || isLogging || !canLog}
        className="w-full py-3.5 text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl transition-colors flex items-center justify-center gap-2"
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
      </button>
    </div>
  );
}