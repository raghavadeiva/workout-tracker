import { ChevronLeft, Dumbbell } from 'lucide-react';
import type { WorkoutSession, Exercise } from '../../../db/database';

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today, ' + date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Yesterday, ' + date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
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

export function WorkoutDetail({ session, onBack }: WorkoutDetailProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center gap-3 p-4 bg-white/80 dark:bg-gray-950/80 backdrop-blur border-b border-gray-200 dark:border-gray-800">
        <button
          type="button"
          onClick={onBack}
          className="p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 cursor-pointer"
          aria-label="Back to history"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {formatDate(session.startedAt)}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {formatDuration(session.startedAt, session.updatedAt)} • {session.exercises.length} exercise{session.exercises.length !== 1 ? 's' : ''}
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-md mx-auto px-4 py-4 space-y-4 pb-8">
        {session.exercises.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Dumbbell className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No exercises logged</p>
          </div>
        ) : (
          <div className="space-y-4">
            {session.exercises.map((exercise: Exercise) => (
              <article
                key={exercise.id}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* Exercise Header */}
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                    {exercise.name}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {exercise.sets.length} set{exercise.sets.length !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Sets List - Read Only */}
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {exercise.sets.map((set) => (
                    <li key={set.id} className="px-4 py-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-10 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                          Set {set.setNumber}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-mono text-gray-900 dark:text-gray-100">
                            {set.weight}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            × {set.reps} reps
                          </span>
                        </div>
                      </div>
                      <span className="text-sm text-gray-400 dark:text-gray-500">
                        {new Date(set.completedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                      </span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}