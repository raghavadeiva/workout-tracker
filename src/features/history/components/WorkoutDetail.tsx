import { ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import type { WorkoutSession, Exercise } from '../../../db/database';

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return (
      'Today, ' +
      date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    );
  } else if (diffDays === 1) {
    return (
      'Yesterday, ' +
      date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    );
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  } else {
    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
}

function formatDuration(startedAt: number, updatedAt: number): string {
  const diffMs = updatedAt - startedAt;
  const mins = Math.floor(diffMs / 60000);
  const hrs = Math.floor(mins / 60);
  const remainingMins = mins % 60;

  if (hrs > 0) {
    return `${hrs}h ${remainingMins}m`;
  }
  return `${remainingMins}m`;
}

interface WorkoutDetailProps {
  session: WorkoutSession;
  onBack: () => void;
}

// Staggered animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.04 },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, damping: 1.0, stiffness: 300 },
  },
};

export function WorkoutDetail({ session, onBack }: WorkoutDetailProps) {
  return (
    <div className="min-h-screen bg-[--color-background] font-body text-[--color-text-primary]">
      {/* Header — translucent material */}
      <motion.header
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring' as const, damping: 1.0, stiffness: 300 }}
        className="sticky top-0 z-40 flex items-center gap-3 p-4 material border-b border-[--color-separator] dark:border-gray-800"
      >
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className="p-2 -ml-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 cursor-pointer tap-feedback"
          aria-label="Back to history"
        >
          <ChevronLeft className="w-6 h-6" />
        </motion.button>
        <div className="flex-1">
          <h1 className="text-xl font-bold font-display text-[--color-text-primary]">
            {formatDate(session.startedAt)}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {formatDuration(session.startedAt, session.updatedAt)} •{' '}
            {session.exercises.length} exercise
            {session.exercises.length !== 1 ? 's' : ''}
          </p>
        </div>
      </motion.header>

      {/* Content */}
      <motion.main
        className="max-w-md mx-auto px-4 py-4 space-y-4 pb-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {session.exercises.length === 0 ? (
          <motion.div
            variants={itemVariants}
            className="text-center py-12 text-gray-500 dark:text-gray-400"
          >
            <svg
              className="w-16 h-16 mx-auto mb-4 opacity-30"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 7h18M3 12h18M3 17h18M8 7V3h8v4M8 17v4h8v-4"
              />
            </svg>
            <p className="text-lg font-medium">No exercises logged</p>
          </motion.div>
        ) : (
          <motion.div className="space-y-4">
            {session.exercises.map((exercise: Exercise) => (
              <motion.article
                key={exercise.id}
                variants={itemVariants}
                className="bg-[--color-surface] dark:bg-gray-800 rounded-2xl border border-[--color-separator] dark:border-gray-700 overflow-hidden shadow-elevated"
              >
                {/* Exercise Header */}
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b border-[--color-separator] dark:border-gray-700">
                  <h2 className="font-semibold text-[--color-text-primary]">
                    {exercise.name}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {exercise.sets.length} set
                    {exercise.sets.length !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Sets List — Read Only */}
                <ul className="divide-y divide-[--color-separator] dark:divide-gray-700">
                  {exercise.sets.map((set) => (
                    <li
                      key={set.id}
                      className="px-4 py-3.5 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-10 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                          Set {set.setNumber}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-mono text-[--color-text-primary]">
                            {set.weight}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            × {set.reps} reps
                          </span>
                        </div>
                      </div>
                      <span className="text-sm text-gray-400 dark:text-gray-500">
                        {new Date(set.completedAt).toLocaleTimeString([], {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </li>
                  ))}
                </ul>
              </motion.article>
            ))}
          </motion.div>
        )}
      </motion.main>
    </div>
  );
}
