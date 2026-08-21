import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  getHistory,
  type WorkoutSession,
  type Exercise,
} from '../../../db/database';
import { MaterialIcon } from '../../../components/MaterialIcon';
import { WorkoutDetail } from './WorkoutDetail';

function formatDay(ts: number): string {
  const d = new Date(ts);
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return d.toLocaleDateString(undefined, { weekday: 'long' });
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function duration(startedAt: number, updatedAt: number): string {
  const mins = Math.max(1, Math.round((updatedAt - startedAt) / 60000));
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, '0')}m`;
}

export function HistoryScreen() {
  const [history, setHistory] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<WorkoutSession | null>(null);

  useEffect(() => {
    let alive = true;
    getHistory().then((sessions) => {
      if (alive) {
        setHistory(sessions);
        setLoading(false);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  if (selected) {
    return <WorkoutDetail session={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="px-5 pt-3">
      {/* Header */}
      <header className="mb-6">
        <h1 className="display-lg text-ink mb-1">History</h1>
        <p className="body-md text-tertiary">
          {loading
            ? 'Loading…'
            : `${history.length} workout${history.length !== 1 ? 's' : ''}`}
        </p>
      </header>

      {loading ? null : history.length === 0 ? (
        <div className="card p-6 text-center">
          <div
            className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4"
            style={{ background: 'var(--color-sunken)' }}
          >
            <MaterialIcon
              name="calendar_month"
              size={28}
              style={{ color: 'var(--color-faint)' }}
            />
          </div>
          <h2 className="headline-sm text-ink mb-1">No workouts yet</h2>
          <p className="body-md text-secondary">
            Finished workouts will appear here.
          </p>
        </div>
      ) : (
        <motion.div
          className="card overflow-hidden"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.04 } },
          }}
        >
          {history.map((session) => {
            const sets = session.exercises.reduce(
              (n, e: Exercise) => n + e.sets.length,
              0
            );
            return (
              <motion.button
                key={session.id}
                variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
                type="button"
                onClick={() => setSelected(session)}
                className="pressable group w-full flex items-center justify-between p-4 bg-card border-none cursor-pointer text-left hover:bg-sunken hairline-b last:border-b-0"
              >
                <span className="flex-1 min-w-0 pr-4">
                  <span className="block headline-sm text-ink mb-1">
                    {formatDay(session.startedAt)}
                  </span>
                  <span className="block body-md text-tertiary truncate">
                    {session.exercises.map((e: Exercise) => e.name).join(', ') ||
                      'No exercises'}
                  </span>
                </span>
                <span className="flex items-center gap-2 flex-shrink-0">
                  <span className="body-md text-tertiary tnum whitespace-nowrap">
                    {duration(session.startedAt, session.updatedAt)} · {sets}{' '}
                    sets
                  </span>
                  <MaterialIcon
                    name="chevron_right"
                    size={22}
                    style={{ color: 'var(--color-faint)' }}
                  />
                </span>
              </motion.button>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
