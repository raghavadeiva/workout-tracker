import { useState, useEffect } from 'react';
import { Dumbbell, Clock, List } from 'lucide-react';
import { motion } from 'framer-motion';
import { getHistory, type WorkoutSession, type Exercise } from '../../../db/database';
import { WorkoutDetail } from './WorkoutDetail';

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
      weekday: 'short',
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

// Staggered animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.03, delayChildren: 0.04 },
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

export function History() {
  const [history, setHistory] = useState<WorkoutSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const sessions = await getHistory();
      if (mounted) {
        setHistory(sessions);
        setIsLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  // Show detail view if a session is selected
  if (selectedSession) {
    return (
      <WorkoutDetail
        session={selectedSession}
        onBack={() => setSelectedSession(null)}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[--color-background] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-body">
            Loading history...
          </p>
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="min-h-screen bg-[--color-background] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
            <Dumbbell className="w-10 h-10 text-gray-400 dark:text-gray-500" />
          </div>
          <h2 className="text-2xl font-bold font-display text-[--color-text-primary] mb-2">
            No workouts yet
          </h2>
          <p className="text-gray-500 dark:text-gray-400 font-body">
            Complete your first workout to see it here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[--color-background] font-body text-[--color-text-primary]">
      {/* Header — translucent material */}
      <header className="sticky top-0 z-40 flex items-center justify-between p-4 material border-b border-[--color-separator] dark:border-gray-800">
        <h1 className="text-xl font-bold font-display text-[--color-text-primary]">
          History
        </h1>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {history.length} workout{history.length !== 1 ? 's' : ''}
        </span>
      </header>

      {/* List */}
      <motion.main
        className="max-w-md mx-auto px-4 py-4 space-y-3 pb-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {history.map((session) => {
          const exerciseNames = session.exercises
            .map((e: Exercise) => e.name)
            .join(', ');
          const totalSets = session.exercises.reduce(
            (sum, e: Exercise) => sum + e.sets.length,
            0
          );
          const duration = formatDuration(session.startedAt, session.updatedAt);

          return (
            <motion.div key={session.id} variants={itemVariants}>
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedSession(session)}
                className="w-full bg-[--color-surface] dark:bg-gray-800 rounded-2xl border border-[--color-separator] dark:border-gray-700 p-4 flex items-center justify-between gap-4 text-left cursor-pointer tap-feedback shadow-elevated"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-[--color-text-primary]">
                      {formatDate(session.startedAt)}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {duration}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <List className="w-3.5 h-3.5" />
                      {session.exercises.length} exercise
                      {session.exercises.length !== 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {totalSets} set{totalSets !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 truncate">
                    {exerciseNames || 'No exercises'}
                  </p>
                </div>
                <motion.div
                  className="w-5 h-5 text-gray-400 flex-shrink-0"
                  initial={{ x: 0 }}
                  whileTap={{ x: 2 }}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </motion.div>
              </motion.button>
            </motion.div>
          );
        })}
      </motion.main>
    </div>
  );
}
