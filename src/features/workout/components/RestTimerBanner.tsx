import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { MaterialIcon } from '../../../components/MaterialIcon';

interface RestTimerBannerProps {
  timeRemaining: number;
  isActive: boolean;
  adjustTime: (seconds: number) => void;
  stopTimer: () => void;
}

/** Two-tone completion chime via Web Audio (no asset needed). */
function playChime() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new Ctx();
    const play = () => {
      const gain = ctx.createGain();
      gain.gain.value = 0.12;
      gain.connect(ctx.destination);
      [
        [880, 0],
        [1174.66, 0.15],
      ].forEach(([freq, at]) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;
        osc.connect(gain);
        osc.start(ctx.currentTime + at);
        osc.stop(ctx.currentTime + at + 0.28);
      });
    };
    if (ctx.state === 'suspended') ctx.resume().then(play);
    else play();
  } catch {
    /* audio unavailable */
  }
}

export function RestTimerBanner({
  timeRemaining,
  isActive,
  adjustTime,
  stopTimer,
}: RestTimerBannerProps) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (isActive && timeRemaining === 0 && !firedRef.current) {
      firedRef.current = true;
      playChime();
      navigator.vibrate?.([40, 60, 40]);
    }
    if (!isActive) firedRef.current = false;
  }, [timeRemaining, isActive]);

  if (!isActive || timeRemaining < 0) return null;

  const done = timeRemaining === 0;
  const m = Math.floor(Math.max(0, timeRemaining) / 60);
  const s = Math.max(0, timeRemaining) % 60;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        className="fixed left-1/2 -translate-x-1/2 z-20"
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
          aria-label={done ? 'Rest complete' : `Rest timer, ${m} minutes ${s} seconds remaining`}
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
                style={{ borderLeft: '1px solid rgba(255,255,255,0.3)', paddingLeft: 4 }}
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
