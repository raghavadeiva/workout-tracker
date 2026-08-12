import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';

const COMMON_EXERCISES = [
  'Bench Press',
  'Squat',
  'Deadlift',
  'Overhead Press',
  'Barbell Row',
  'Pull-ups',
  'Dips',
  'Incline Bench Press',
  'Romanian Deadlift',
  'Front Squat',
  'Lunges',
  'Leg Press',
  'Lat Pulldown',
  'Seated Cable Row',
  'Dumbbell Press',
  'Lateral Raises',
  'Bicep Curls',
  'Tricep Extensions',
  'Face Pulls',
  'Calf Raises',
];

interface ExerciseSelectorProps {
  onSelect: (name: string) => void;
  onClose: () => void;
}

export function ExerciseSelector({ onSelect, onClose }: ExerciseSelectorProps) {
  const [query, setQuery] = useState('');

  const filtered = COMMON_EXERCISES.filter((ex) =>
    ex.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (name: string) => {
    onSelect(name);
    onClose(); // Added this back!
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur">
        <button
          type="button"
          onClick={onClose}
          className="p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 cursor-pointer"
          aria-label="Back"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="flex-1 text-lg font-semibold text-gray-900 dark:text-gray-100 text-center">
          Add Exercise
        </h1>
        <div className="w-10" />
      </header>

      {/* Search */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search exercises..."
          className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl text-base text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoComplete="off"
        />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {filtered.map((exercise) => (
            <li key={exercise}>
              <button
                type="button"
                onClick={() => handleSelect(exercise)}
                className="w-full px-4 py-5 text-left text-lg text-gray-900 dark:text-gray-100 active:bg-gray-100 dark:active:bg-gray-800 min-h-[56px] cursor-pointer"
              >
                {exercise}
              </button>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
              No exercises found
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
