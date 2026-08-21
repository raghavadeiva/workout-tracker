import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface RestTimerBannerProps {
  timeRemaining: number;
  isActive: boolean;
  adjustTime: (seconds: number) => void;
  stopTimer: () => void;
}

// Generates a pleasant two-tone "beep" via Web Audio API (Phase 12 sound prep)
function playBeepSound(ctx: AudioContext) {
  const oscillator1 = ctx.createOscillator();
  const oscillator2 = ctx.createOscillator();
  const gainNode = ctx.createGain();

  gainNode.connect(ctx.destination);
  gainNode.gain.setValueAtTime(0.1, ctx.currentTime);

  oscillator1.type = 'sine';
  oscillator1.frequency.setValueAtTime(880, ctx.currentTime); // high tone
  oscillator1.frequency.exponentialRampToValueAtTime(
    523,
    ctx.currentTime + 0.15
  );

  oscillator2.type = 'sine';
  oscillator2.frequency.setValueAtTime(523, ctx.currentTime + 0.1); // low tone
  oscillator2.frequency.exponentialRampToValueAtTime(
    880,
    ctx.currentTime + 0.25
  );

  oscillator1.connect(gainNode);
  oscillator2.connect(gainNode);

  oscillator1.start(ctx.currentTime);
  oscillator2.start(ctx.currentTime + 0.1);

  oscillator1.stop(ctx.currentTime + 0.3);
  oscillator2.stop(ctx.currentTime + 0.3);
}

export function RestTimerBanner({
  timeRemaining,
  isActive,
  adjustTime,
  stopTimer,
}: RestTimerBannerProps) {
  const [justCompleted, setJustCompleted] = useState(false);
  const prevTimeRef = useRef<number>(timeRemaining);

  // Sound + haptic trigger when timer reaches 0 (Phase 12 sound + Phase 11 prep)
  // Apple Design §13: causality — fires on the actual event, same frame as visual
  useEffect(() => {
    if (prevTimeRef.current > 0 && timeRemaining === 0 && isActive) {
      setJustCompleted(true);

      // Haptic feedback (medium impact)
      if (navigator.vibrate) {
        navigator.vibrate([50, 30, 50]);
      }

      // Sound alert via Web Audio API (Apple Design §13 — harmony: same frame)
      try {
        const ctx = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        if (ctx.state === 'suspended') {
          ctx.resume().then(() => playBeepSound(ctx));
        } else {
          playBeepSound(ctx);
        }
      } catch (e) {
        console.debug('Web Audio unavailable:', e);
      }

      // Hide the completion state after 3 seconds
      const timer = setTimeout(() => {
        setJustCompleted(false);
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      prevTimeRef.current = timeRemaining;
    }
  }, [timeRemaining, isActive]);

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const timeString = `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`;

  // If timer just completed, show the completion state briefly
  if (justCompleted) {
    return (
      <motion.div
        initial={{ y: 20, opacity: 0, scale: 0.9 }}
        animate={{
          y: 0,
          opacity: 1,
          scale: [1, 1.1, 1],
        }}
        exit={{ y: 20, opacity: 0, scale: 0.9 }}
        transition={{
          type: 'spring' as const,
          damping: 0.8,
          stiffness: 400,
          scale: { type: 'spring' as const, damping: 0.8, stiffness: 400 },
        }}
        className="fixed left-0 right-0 bottom-24 z-40 flex items-center justify-center px-4 pointer-events-none"
      >
        <div className="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 material rounded-full px-5 py-3 shadow-floating border border-green-200 dark:border-green-800 pointer-events-auto max-w-xs w-full">
          <div className="w-5 h-5 flex-shrink-0">
            <svg
              className="w-5 h-5 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.693 3.381c.34.853.5 1.762.5 2.663 0 4.418-3.582 8-8 8a9.004 9.004 0 01-4.976-1.496L4 22l1.496-4.485A8.005 8.005 0 014 11c0-4.418 3.582-8 8-8s8 3.582 8 8z"
              />
            </svg>
          </div>
          <span className="font-medium text-green-900 dark:text-green-100">
            Rest complete!
          </span>
        </div>
      </motion.div>
    );
  }

  // Active timer
  if (!isActive || timeRemaining <= 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ y: 20, opacity: 0, scale: 0.9 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: 20, opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring' as const, damping: 1.0, stiffness: 300 }}
      className="fixed left-0 right-0 bottom-24 z-40 flex items-center justify-center px-4 pb-[env(safe-area-inset-bottom)] pointer-events-none"
    >
      <div className="flex items-center gap-2 bg-[--color-surface] dark:bg-gray-800 material rounded-full px-4 py-2.5 shadow-floating border border-[--color-separator] dark:border-gray-700 pointer-events-auto max-w-xs w-full">
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          onClick={() => adjustTime(-15)}
          className="p-1.5 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 active:bg-gray-100 dark:active:bg-gray-700 rounded-full transition-colors cursor-pointer tap-feedback"
        >
          <span className="-mr-1 font-medium font-mono text-sm">−15s</span>
        </motion.button>

        <div className="text-2xl font-mono font-bold text-[--color-text-primary] mx-auto tracking-tight">
          {timeString}
        </div>

        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          onClick={() => adjustTime(30)}
          className="p-1.5 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 active:bg-gray-100 dark:active:bg-gray-700 rounded-full transition-colors cursor-pointer tap-feedback"
        >
          <span className="-mr-1 font-medium font-mono text-sm">+30s</span>
        </motion.button>

        <div className="w-px h-6 bg-[--color-separator] dark:bg-gray-700 mx-1" />

        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            stopTimer();
            if (navigator.vibrate) {
              navigator.vibrate([10]);
            }
          }}
          className="p-1.5 text-red-500 hover:text-red-600 active:bg-red-50 dark:active:bg-red-900/30 rounded-full transition-colors cursor-pointer tap-feedback"
          aria-label="Dismiss timer"
        >
          <svg
            className="w-6 h-6"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </motion.button>
      </div>
    </motion.div>
  );
}
