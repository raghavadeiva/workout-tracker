import { motion, AnimatePresence } from 'framer-motion';
import { MaterialIcon } from '../../../components/MaterialIcon';
import { useRestTimer } from '../../../hooks/useRestTimer';

/**
 * Floating rest timer pill. Consumes the app-level RestTimerProvider,
 * so it renders (and keeps counting) above every tab.
 */
export function RestTimerBanner() {
  const { remaining, isActive, adjustTime, stopTimer } = useRestTimer();

  // "Rest complete" confirmation shows briefly after zero-crossing
  const done = isActive && remaining === 0;

  if (!isActive) return null;

  const m = Math.floor(remaining / 60);
  const s = remaining % 60;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        className="fixed left-1/2 -translate-x-1/2 z-40"
        style={{ bottom: `calc(96px + env(safe-area-inset-bottom))` }}
      >
        <div
          className="flex items-center rounded-full pl-5 pr-2 h-[52px] gap-1"
          style={{
            background: done ? 'var(--color-green)' : '#000000',
            color: '#ffffff',
            boxShadow: '0 8px 24px rgba(0,0,0,0.16)',
          }}
          role="timer"
          aria-label={
            done
              ? 'Rest complete'
              : `Rest timer, ${m} minutes ${s} seconds remaining`
          }
        >
          {done ? (
            <span className="body-lg font-semibold pr-3">Rest complete</span>
          ) : (
            <>
              <span className="text-[19px] font-bold tnum tracking-tight min-w-[58px] text-center">
                {m}:{String(s).padStart(2, '0')}
              </span>
              <div
                className="flex items-center"
                style={{
                  borderLeft: '1px solid rgba(255,255,255,0.3)',
                  paddingLeft: 4,
                }}
              >
                <button
                  type="button"
                  onClick={() => adjustTime(-15)}
                  className="pressable px-2 py-1.5 rounded bg-transparent border-none text-white text-[14px] font-medium cursor-pointer"
                >
                  −15s
                </button>
                <button
                  type="button"
                  onClick={() => adjustTime(30)}
                  className="pressable px-2 py-1.5 rounded bg-transparent border-none text-white text-[14px] font-medium cursor-pointer"
                >
                  +30s
                </button>
              </div>
            </>
          )}
          <button
            type="button"
            onClick={stopTimer}
            aria-label={done ? 'Dismiss' : 'Cancel rest timer'}
            className="pressable w-10 h-10 flex items-center justify-center rounded-full bg-transparent border-none cursor-pointer ml-1"
          >
            <MaterialIcon name="close" size={20} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
