import { X } from 'lucide-react';

interface SetRowProps {
  setNumber: number;
  weight: number;
  reps: number;
  onDelete: () => void;
  weightUnit: 'lbs' | 'kg';
}

export function SetRow({ setNumber, weight, reps, onDelete, weightUnit }: SetRowProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      {/* Set Number */}
      <div className="w-10 text-center">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Set {setNumber}
        </span>
      </div>

      {/* Weight */}
      <div className="flex-1 flex items-center gap-2">
        <span className="w-16 text-right text-lg font-mono text-gray-900 dark:text-gray-100">
          {weight}
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400 w-12">{weightUnit}</span>
      </div>

      {/* Reps */}
      <div className="flex-1 flex items-center gap-2">
        <span className="text-lg font-mono text-gray-900 dark:text-gray-100">
          × {reps}
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400">reps</span>
      </div>

      {/* Delete */}
      <button
        onClick={onDelete}
        className="p-2 -mr-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
        aria-label="Delete set"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}