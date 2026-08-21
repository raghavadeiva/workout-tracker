import { useEffect, useMemo, useState } from 'react';
import { MaterialIcon } from '../../../components/MaterialIcon';
import { getAllExerciseNames, getLibraryEntry } from '../../recommendations/exerciseVectors';
import {
  loadFavoriteExercises,
  toggleFavoriteExercise,
} from '../../../db/database';
import type { Template } from '../../../db/database';

interface ExerciseSelectorProps {
  templates: Template[];
  onSelect: (name: string) => void;
  onStartTemplate: (template: Template) => void;
  onRenameTemplate: (id: string, newName: string) => void;
  onDeleteTemplate: (id: string) => void;
  onClose: () => void;
}

export function ExerciseSelector({
  templates,
  onSelect,
  onStartTemplate,
  onRenameTemplate,
  onDeleteTemplate,
  onClose,
}: ExerciseSelectorProps) {
  const [query, setQuery] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  // Load favorites once
  useEffect(() => {
    let alive = true;
    loadFavoriteExercises().then((favs) => {
      if (alive) setFavorites(new Set(favs));
    });
    return () => {
      alive = false;
    };
  }, []);

  /** Toggle star; optimistic UI update, DB write is the source of truth. */
  const toggleFav = (name: string) => {
    // Optimistic flip
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
    void toggleFavoriteExercise(name).then((next) => {
      setFavorites(new Set(next)); // reconcile with persisted truth
    });
  };

  // Full 873-exercise library, searched across name + equipment + level
  const allNames = useMemo(() => getAllExerciseNames(), []);

  const filtered = useMemo(() => {
    let names = allNames;
    if (onlyFavorites) names = names.filter((n) => favorites.has(n));

    const q = query.trim().toLowerCase();
    if (!q) return names;
    // Multi-term: every term must match somewhere (name, equipment, level)
    return names.filter((name) => {
      const entry = getLibraryEntry(name);
      const haystack = `${name} ${entry?.equipment ?? ''} ${entry?.level ?? ''}`.toLowerCase();
      return q.split(/\s+/).every((term) => haystack.includes(term));
    });
  }, [query, allNames, onlyFavorites, favorites]);

  // Favorites float to the top of every list view
  const sorted = useMemo(
    () =>
      [...filtered].sort((a, b) => {
        const fa = favorites.has(a) ? 0 : 1;
        const fb = favorites.has(b) ? 0 : 1;
        return fa - fb || a.localeCompare(b);
      }),
    [filtered, favorites]
  );

  const showTemplates = query.length === 0 && !onlyFavorites && templates.length > 0;

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
        <div className="relative mb-2.5">
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

        {/* Favorites filter chip */}
        <div className="flex items-center gap-2 mb-5">
          <button
            type="button"
            onClick={() => setOnlyFavorites((v) => !v)}
            aria-pressed={onlyFavorites}
            className="pressable flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-none cursor-pointer text-[13px] font-semibold transition-colors"
            style={
              onlyFavorites
                ? { background: 'var(--color-blue)', color: '#fff' }
                : { background: 'var(--color-sunken-high)', color: 'var(--color-secondary)' }
            }
          >
            <MaterialIcon
              name="star"
              size={16}
              fill={onlyFavorites ? 1 : 0}
              style={{ color: onlyFavorites ? '#fff' : 'var(--color-blue)' }}
            />
            Favorites{favorites.size > 0 ? ` (${favorites.size})` : ''}
          </button>
          {onlyFavorites && favorites.size === 0 && (
            <span className="body-md text-faint">
              Tap a star below to favorite an exercise
            </span>
          )}
        </div>

        {/* Templates */}
        {showTemplates && (
          <section className="mb-7">
            <h2 className="section-label mb-2 ml-1">Templates</h2>
            <div className="card row-sep overflow-hidden">
              {templates.map((t) => (
                <div key={t.id} className="flex items-center hover:bg-sunken">
                  <button
                    type="button"
                    onClick={() => onStartTemplate(t)}
                    className="pressable flex-1 min-w-0 flex items-center gap-3 p-4 bg-transparent border-none cursor-pointer text-left"
                  >
                    <MaterialIcon
                      name="bookmark"
                      size={22}
                      style={{ color: 'var(--color-blue)', flexShrink: 0 }}
                    />
                    <span className="flex-1 min-w-0">
                      <span className="block headline-sm text-ink truncate">
                        {t.name}
                      </span>
                      <span className="block body-md text-secondary mt-1 truncate">
                        {t.exerciseNames.join(', ')}
                      </span>
                    </span>
                  </button>
                  {/* Manage: rename + delete */}
                  <button
                    type="button"
                    onClick={() => {
                      const name = window.prompt('Rename template', t.name);
                      if (name?.trim()) onRenameTemplate(t.id, name.trim());
                    }}
                    aria-label={`Rename ${t.name}`}
                    className="pressable w-10 h-10 mr-0.5 flex items-center justify-center rounded-full bg-transparent border-none cursor-pointer hover:bg-sunken-high"
                  >
                    <MaterialIcon
                      name="edit"
                      size={18}
                      style={{ color: 'var(--color-tertiary)' }}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          `Delete template "${t.name}"? This cannot be undone.`
                        )
                      ) {
                        onDeleteTemplate(t.id);
                      }
                    }}
                    aria-label={`Delete ${t.name}`}
                    className="pressable w-10 h-10 mr-3 flex items-center justify-center rounded-full bg-transparent border-none cursor-pointer hover:bg-red-soft"
                  >
                    <MaterialIcon
                      name="delete"
                      size={18}
                      style={{ color: 'var(--color-red)' }}
                    />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Exercises */}
        <section>
          <h2 className="section-label mb-2 ml-1">
            {onlyFavorites ? 'Favorite exercises' : 'Exercises'}
          </h2>
          <div className="card row-sep overflow-hidden">
            {sorted.map((ex) => {
              const isFav = favorites.has(ex);
              return (
                <div key={ex} className="flex items-center hover:bg-sunken">
                  <button
                    type="button"
                    onClick={() => onSelect(ex)}
                    className="pressable flex-1 min-w-0 flex items-center justify-between p-4 bg-transparent border-none cursor-pointer text-left"
                  >
                    <span className="headline-sm text-ink truncate pr-2">{ex}</span>
                    <MaterialIcon
                      name="add"
                      size={22}
                      style={{ color: 'var(--color-blue)', flexShrink: 0 }}
                    />
                  </button>
                  {/* Favorite star */}
                  <button
                    type="button"
                    onClick={() => toggleFav(ex)}
                    aria-label={
                      isFav ? `Remove ${ex} from favorites` : `Add ${ex} to favorites`
                    }
                    aria-pressed={isFav}
                    className="pressable w-11 h-11 mr-2 flex items-center justify-center rounded-full bg-transparent border-none cursor-pointer"
                  >
                    <MaterialIcon
                      name="star"
                      size={22}
                      fill={isFav ? 1 : 0}
                      style={{
                        color: isFav ? 'var(--color-orange)' : 'var(--color-faint)',
                      }}
                    />
                  </button>
                </div>
              );
            })}
            {sorted.length === 0 && (
              <div className="p-6 text-center body-md text-tertiary">
                {onlyFavorites && !query
                  ? 'No favorites yet — tap a star to add one'
                  : `No exercises match “${query}”`}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
