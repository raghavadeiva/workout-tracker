import { useState } from 'react';
import { MaterialIcon } from '../../../components/MaterialIcon';
import type { Template } from '../../../db/database';

const COMMON_EXERCISES = [
  'Bench Press', 'Squat', 'Deadlift', 'Overhead Press', 'Barbell Row',
  'Pull-ups', 'Dips', 'Incline Bench Press', 'Romanian Deadlift',
  'Front Squat', 'Lunges', 'Leg Press', 'Lat Pulldown', 'Seated Cable Row',
  'Dumbbell Press', 'Lateral Raises', 'Bicep Curls', 'Tricep Extensions',
  'Face Pulls', 'Calf Raises',
];

interface ExerciseSelectorProps {
  templates: Template[];
  onSelect: (name: string) => void;
  onStartTemplate: (template: Template) => void;
  onClose: () => void;
}

export function ExerciseSelector({
  templates,
  onSelect,
  onStartTemplate,
  onClose,
}: ExerciseSelectorProps) {
  const [query, setQuery] = useState('');

  const filtered = COMMON_EXERCISES.filter((ex) =>
    ex.toLowerCase().includes(query.toLowerCase())
  );
  const showTemplates = query.length === 0 && templates.length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-app flex flex-col" role="dialog" aria-label="Add exercise">
      {/* Top bar */}
      <header
        className="relative flex items-center justify-center bg-app"
        style={{ height: 56, paddingTop: 'env(safe-area-inset-top)' }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="pressable absolute left-2 w-11 h-11 flex items-center justify-center rounded-full bg-transparent border-none cursor-pointer"
        >
          <MaterialIcon
            name="arrow_back_ios_new"
            size={22}
            style={{ color: 'var(--color-blue)' }}
          />
        </button>
        <h1
          className="headline-sm text-ink absolute left-1/2 -translate-x-1/2 bottom-3"
        >
          Add Exercise
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto overscroll-contain px-5 pt-4 pb-10">
        {/* Search */}
        <div className="relative mb-6">
          <span className="absolute left-4 top-1/2 -translate-y-1/2">
            <MaterialIcon name="search" size={22} style={{ color: 'var(--color-faint)' }} />
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search exercises"
            autoFocus
            className="w-full rounded-xl pl-12 pr-4 py-3 body-lg text-ink placeholder:text-faint outline-none border-none appearance-none focus:ring-1 focus:ring-blue"
            style={{ background: 'var(--color-sunken-high)' }}
          />
        </div>

        {/* Templates */}
        {showTemplates && (
          <section className="mb-7">
            <h2 className="section-label mb-2 ml-1">Templates</h2>
            <div className="card row-sep overflow-hidden">
              {templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onStartTemplate(t)}
                  className="pressable w-full flex items-center justify-between p-4 bg-card border-none cursor-pointer text-left hover:bg-sunken"
                >
                  <span className="min-w-0 pr-3">
                    <span className="block headline-sm text-ink truncate">
                      {t.name}
                    </span>
                    <span className="block body-md text-secondary mt-1 truncate">
                      {t.exerciseNames.join(', ')}
                    </span>
                  </span>
                  <MaterialIcon
                    name="bookmark"
                    size={22}
                    style={{ color: 'var(--color-blue)', flexShrink: 0 }}
                  />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Exercises */}
        <section>
          <h2 className="section-label mb-2 ml-1">Exercises</h2>
          <div className="card row-sep overflow-hidden">
            {filtered.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => onSelect(ex)}
                className="pressable w-full flex items-center justify-between p-4 bg-card border-none cursor-pointer text-left hover:bg-sunken"
              >
                <span className="headline-sm text-ink">{ex}</span>
                <MaterialIcon
                  name="add"
                  size={22}
                  style={{ color: 'var(--color-blue)' }}
                />
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="p-6 text-center body-md text-tertiary">
                No exercises match “{query}”
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
