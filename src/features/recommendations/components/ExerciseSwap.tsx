import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRecommendations } from '../useRecommendations';
import { MaterialIcon } from '../../../components/MaterialIcon';

interface ExerciseSwapProps {
  exerciseName: string;
  availableEquipment: string[];
  onSwap: (newName: string) => void;
}

export function ExerciseSwap({
  exerciseName,
  availableEquipment,
  onSwap,
}: ExerciseSwapProps) {
  const [open, setOpen] = useState(false);

  // Fetch lazily only while open
  const { recommendations, isLoading, error } = useRecommendations(
    open ? exerciseName : null,
    {
      topN: 3,
      availableEquipment:
        availableEquipment.length > 0 ? availableEquipment : undefined,
    }
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Find alternatives for ${exerciseName}`}
        aria-expanded={open}
        className="pressable w-8 h-8 flex items-center justify-center rounded-full bg-transparent border-none cursor-pointer hover:bg-sunken"
      >
        <MaterialIcon name="swap_horiz" size={18} style={{ color: 'var(--color-faint)' }} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Scrim */}
            <div
              className="fixed inset-0 z-30"
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className="absolute right-0 top-full mt-1 z-40 w-64 card p-1.5"
              style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
              role="menu"
              aria-label={`Alternatives for ${exerciseName}`}
            >
              <span className="section-label block px-2.5 pt-1.5 pb-1">
                Alternatives
              </span>
              {isLoading && (
                <div className="flex items-center gap-2 px-2.5 py-2.5 body-md text-tertiary">
                  <span
                    className="inline-block w-4 h-4 rounded-full animate-spin"
                    style={{
                      border: '2px solid var(--color-line)',
                      borderTopColor: 'var(--color-blue)',
                    }}
                  />
                  Finding…
                </div>
              )}
              {error && (
                <div className="px-2.5 py-2.5 body-md" style={{ color: 'var(--color-red)' }}>
                  {error}
                </div>
              )}
              {!isLoading && recommendations?.length === 0 && (
                <div className="px-2.5 py-2.5 body-md text-tertiary">
                  No alternatives found
                </div>
              )}
              {recommendations?.map((rec) => (
                <button
                  key={rec.exercise}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onSwap(rec.exercise);
                    setOpen(false);
                  }}
                  className="pressable w-full flex items-center justify-between gap-2 px-2.5 py-2.5 rounded-lg bg-transparent border-none cursor-pointer text-left hover:bg-sunken"
                >
                  <span className="text-[15px] font-semibold text-ink truncate">
                    {rec.exercise}
                  </span>
                  <span
                    className="text-[12px] font-bold tnum flex-shrink-0"
                    style={{ color: 'var(--color-green-deep)' }}
                  >
                    {Math.round(rec.score * 100)}%
                  </span>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
