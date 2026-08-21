import { motion } from 'framer-motion';
import type {
  WorkoutSession,
  Exercise,
  WeightUnit,
} from '../../../db/database';
import { MaterialIcon } from '../../../components/MaterialIcon';

interface WorkoutDetailProps {
  session: WorkoutSession;
  onBack: () => void;
}

function formatDay(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function WorkoutDetail({ session, onBack }: WorkoutDetailProps) {
  const totalSets = session.exercises.reduce((n, e) => n + e.sets.length, 0);

  // Infer unit from the largest logged weight (detail view has no stored unit)
  const maxWeight = Math.max(
    0,
    ...session.exercises.flatMap((e) => e.sets.map((s) => s.weight))
  );
  const unit: WeightUnit = maxWeight >= 100 ? 'lbs' : 'kg';

  return (
    <div>
      {/* Sticky top bar */}
      <header
        className="sticky top-0 z-10 material border-b"
        style={{
          borderColor: 'rgba(209,209,214,0.5)',
          paddingTop: 'env(safe-area-inset-top)',
        }}
      >
        <div className="flex items-center px-3 h-14 gap-1">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to history"
            className="pressable w-11 h-11 -ml-1 flex items-center justify-center rounded-full bg-transparent border-none cursor-pointer"
          >
            <MaterialIcon
              name="chevron_left"
              size={26}
              style={{ color: 'var(--color-blue)' }}
            />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-[19px] font-bold tracking-tight text-ink truncate">
              {formatDay(session.startedAt)}
            </h1>
            <p className="body-md text-tertiary leading-tight">
              {session.exercises.length} exercise
              {session.exercises.length !== 1 ? 's' : ''} · {totalSets} set
              {totalSets !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </header>

      <div className="px-5 pt-4 pb-4">
        {session.exercises.length === 0 ? (
          <div className="card p-6 text-center body-md text-secondary">
            No exercises were logged in this workout.
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.05 } },
            }}
            className="flex flex-col gap-4"
          >
            {session.exercises.map((ex: Exercise) => (
              <motion.section
                key={ex.id}
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0 },
                }}
                className="card overflow-hidden"
              >
                {/* Card header bar */}
                <div
                  className="px-5 py-3 border-b"
                  style={{
                    background: 'var(--color-sunken)',
                    borderColor: 'rgba(209,209,214,0.5)',
                  }}
                >
                  <h2 className="headline-sm text-ink">{ex.name}</h2>
                </div>

                {/* Table */}
                <div className="px-5 py-2">
                  {/* Column headers */}
                  <div
                    className="flex items-center py-2 label-caps text-tertiary border-b"
                    style={{ borderColor: 'rgba(209,209,214,0.5)' }}
                  >
                    <span className="w-[16%]">Set</span>
                    <span className="w-[32%] text-right">Weight</span>
                    <span className="w-[24%] text-right">Reps</span>
                    <span className="w-[28%] text-right">Time</span>
                  </div>

                  {ex.sets.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center py-3 tnum text-[15px] border-b last:border-b-0"
                      style={{ borderColor: 'rgba(209,209,214,0.35)' }}
                    >
                      <span className="w-[16%] font-bold text-faint">
                        {s.setNumber}
                      </span>
                      <span className="w-[32%] text-right font-medium">
                        {s.weight}{' '}
                        <span className="text-faint font-normal text-[12px]">
                          {unit}
                        </span>
                      </span>
                      <span className="w-[24%] text-right font-medium">
                        {s.reps}
                      </span>
                      <span className="w-[28%] text-right text-tertiary text-[13px]">
                        {new Date(s.completedAt).toLocaleTimeString(undefined, {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.section>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
