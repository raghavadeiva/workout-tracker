import { useState } from 'react';
import { ChevronLeft, Dumbbell, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Template } from '../../../db/database';

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
  templates?: Template[];
  onStartFromTemplate?: (template: Template) => void;
}

export function ExerciseSelector({
  onSelect,
  onClose,
  templates = [],
  onStartFromTemplate,
}: ExerciseSelectorProps) {
  const [query, setQuery] = useState('');

  const filtered = COMMON_EXERCISES.filter((ex) =>
    ex.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (name: string) => {
    onSelect(name);
    onClose();
  };

  const hasTemplates = templates.length > 0;
  const hasQuery = query.length > 0;
  const showTemplates = hasTemplates && !hasQuery;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ type: 'spring' as const, damping: 1.0, stiffness: 300 }}
      className="min-h-screen bg-[--color-background] font-body text-[--color-text-primary] flex flex-col"
    >
      {/* Header — translucent material */}
      <header className="sticky top-0 z-10 flex items-center gap-3 p-4 border-b border-[--color-separator] dark:border-gray-700 material">
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 cursor-pointer tap-feedback"
          aria-label="Back"
        >
          <ChevronLeft className="w-6 h-6" />
        </motion.button>
        <h1 className="flex-1 text-lg font-semibold font-display text-[--color-text-primary] text-center">
          Add Exercise
        </h1>
        <div className="w-10" />
      </header>

      {/* Search */}
      <div className="p-4 border-b border-[--color-separator] dark:border-gray-700 bg-[--color-surface] dark:bg-gray-900">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search exercises..."
          className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl text-base text-[--color-text-primary] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoComplete="off"
        />
      </div>

      {/* Templates section (only when no search query) */}
      {showTemplates && onStartFromTemplate && (
        <div className="px-4 py-3 border-b border-[--color-separator] dark:border-gray-700">
          <h2 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Your Templates
          </h2>
          <div className="space-y-2">
            {templates.map((template) => (
              <motion.button
                key={template.id}
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  onStartFromTemplate(template);
                  onClose();
                }}
                className="w-full flex items-center gap-3 p-3 bg-[--color-surface] dark:bg-gray-800 rounded-xl border border-[--color-separator] dark:border-gray-700 text-left tap-feedback"
              >
                <Dumbbell className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[--color-text-primary] truncate">
                    {template.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {template.exerciseNames.length} exercise
                    {template.exerciseNames.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <Plus className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Exercise list or start-blank-workout prompt */}
      <div className="flex-1 overflow-y-auto">
        {showTemplates && (
          <div className="px-4 py-3 border-b border-[--color-separator] dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Or browse exercises
            </p>
          </div>
        )}
        <ul className="divide-y divide-[--color-separator] dark:divide-gray-700">
          {filtered.map((exercise) => (
            <li key={exercise}>
              <motion.button
                type="button"
                whileTap={{ scale: 0.97, backgroundColor: 'rgba(0,0,0,0.03)' }}
                onClick={() => handleSelect(exercise)}
                className="w-full px-4 py-4 text-left text-lg text-[--color-text-primary] dark:active:bg-gray-700 min-h-[56px] cursor-pointer tap-feedback flex items-center"
              >
                <Dumbbell className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3 flex-shrink-0" />
                {exercise}
              </motion.button>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
              No exercises found
            </li>
          )}
        </ul>
      </div>
    </motion.div>
  );
}
