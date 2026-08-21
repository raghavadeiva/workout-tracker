import {
  useState,
  useEffect,
  useCallback,
  useRef,
  createContext,
  useContext,
  type ReactNode,
} from 'react';
import {
  saveTimerState,
  loadTimerState,
  clearTimerState,
} from '../db/database';

/**
 * Rest Timer Engine (Phase 12)
 *
 * - Timestamp-based: remaining = ceil((endsAt − now)/1000). Background
 *   throttling cannot make it drift; time spent away counts down correctly.
 * - Persisted to IndexedDB (`timerState` store, schema v6) on every state
 *   change, restored on mount → survives reloads and app restarts.
 * - Lives at App level via context → persists across in-app tab switches.
 * - While running and visible: document.title shows the countdown.
 * - While hidden at zero-crossing: fires a Notification + sound + haptics.
 * - Wake Lock held while resting and visible so the screen stays on.
 */

export interface RestTimerApi {
  /** Seconds remaining, floor 0. Recomputed from endsAt every tick. */
  remaining: number;
  isActive: boolean;
  startTimer: (seconds: number) => void;
  stopTimer: () => void;
  adjustTime: (deltaSeconds: number) => void;
}

const RestTimerContext = createContext<RestTimerApi | null>(null);

const TITLE_BASE = 'Hypertrophy';

function fmt(totalSeconds: number): string {
  const m = Math.floor(Math.max(0, totalSeconds) / 60);
  const s = Math.max(0, totalSeconds) % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Two-tone completion chime — same frame as the visual state change. */
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
      (
        [
          [880, 0],
          [1174.66, 0.15],
        ] as [number, number][]
      ).forEach(([freq, at]) => {
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

// ─── Wake Lock (screen stays on while resting) ───────────────
type WakeLockSentinelLike = { release: () => Promise<void> };

export function RestTimerProvider({ children }: { children: ReactNode }) {
  const [remaining, setRemaining] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const endsAtRef = useRef<number | null>(null);
  const wakeLockRef = useRef<WakeLockSentinelLike | null>(null);

  // ── Restore persisted timer on mount ──
  useEffect(() => {
    let alive = true;
    loadTimerState().then((record) => {
      if (!alive || !record || !record.running) return;
      const msLeft = record.endsAt - Date.now();
      if (msLeft <= 0) {
        // Finished while we were closed — show completed state briefly
        setRemaining(0);
        setIsActive(true); // banner shows "Rest complete"
        clearTimerState();
      } else {
        endsAtRef.current = record.endsAt;
        setRemaining(Math.ceil(msLeft / 1000));
        setIsActive(true);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  // ── Completion side effects (fire exactly once per run) ──
  const firedRef = useRef(false);
  useEffect(() => {
    if (isActive && remaining === 0 && !firedRef.current) {
      firedRef.current = true;

      playChime();
      navigator.vibrate?.([40, 60, 40]);

      // Notification only makes sense when the page is hidden
      if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('Rest complete', {
          body: 'Time for your next set.',
          tag: 'rest-timer',
        });
      }
      endsAtRef.current = null;
      releaseWakeLock(wakeLockRef);
      clearTimerState();
    }
    if (!isActive) firedRef.current = false;
  }, [isActive, remaining]);

  // ── Tick loop: recompute from absolute timestamp ──
  useEffect(() => {
    if (!isActive || endsAtRef.current == null) return;

    const tick = () => {
      if (endsAtRef.current == null) return;
      const left = Math.ceil((endsAtRef.current - Date.now()) / 1000);
      setRemaining(Math.max(0, left));
    };

    tick();
    // 250ms cadence keeps the display honest across second boundaries
    // without meaningfully costing battery (cheap Date.now() math).
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [isActive]);

  // ── Visibility change: recompute immediately when returning ──
  useEffect(() => {
    const onVisible = () => {
      if (!document.hidden && isActive && endsAtRef.current != null) {
        const left = Math.ceil((endsAtRef.current - Date.now()) / 1000);
        setRemaining(Math.max(0, left));
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [isActive]);

  // ── Document title countdown while visible & running ──
  useEffect(() => {
    if (isActive && remaining > 0) {
      document.title = `${fmt(remaining)} · Rest — ${TITLE_BASE}`;
    } else {
      document.title = TITLE_BASE;
    }
    return () => {
      document.title = TITLE_BASE;
    };
  }, [isActive, remaining]);

  // ── App badge (iOS home screen / macOS dock) ──
  useEffect(() => {
    const nav = navigator as Navigator & {
      setAppBadge?: (n?: number) => Promise<void>;
      clearAppBadge?: () => Promise<void>;
    };
    if (isActive && remaining > 0 && nav.setAppBadge) {
      nav.setAppBadge(remaining).catch(() => {});
    } else if (nav.clearAppBadge) {
      nav.clearAppBadge().catch(() => {});
    }
    return () => {
      if (nav.clearAppBadge) nav.clearAppBadge().catch(() => {});
    };
  }, [isActive, remaining]);

  // ── Wake Lock while resting & visible ──
  useEffect(() => {
    const shouldHold = isActive && remaining > 0 && !document.hidden;
    if (shouldHold && wakeLockRef.current == null) {
      requestWakeLock(wakeLockRef);
    } else if (!shouldHold) {
      releaseWakeLock(wakeLockRef);
    }
  }, [isActive, remaining]);

  // Release wake lock if the tab hides mid-rest (browser may kill it anyway)
  useEffect(() => {
    const onHide = () => {
      if (document.hidden) releaseWakeLock(wakeLockRef);
    };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, []);

  // ── Actions ──
  const startTimer = useCallback((seconds: number) => {
    const endsAt = Date.now() + seconds * 1000;
    endsAtRef.current = endsAt;
    firedRef.current = false;
    setRemaining(seconds);
    setIsActive(true);
    void saveTimerState({ endsAt, duration: seconds, running: true });
  }, []);

  const stopTimer = useCallback(() => {
    endsAtRef.current = null;
    setRemaining(0);
    setIsActive(false);
    void clearTimerState();
  }, []);

  const adjustTime = useCallback((deltaSeconds: number) => {
    setRemaining((prevRemaining) => {
      // Compute new absolute end from current displayed remaining
      const base =
        endsAtRef.current ?? Date.now() + prevRemaining * 1000;
      const newEndsAt = Math.max(
        Date.now(),
        base + deltaSeconds * 1000
      );
      endsAtRef.current = newEndsAt;
      const newRemaining = Math.max(
        0,
        Math.ceil((newEndsAt - Date.now()) / 1000)
      );
      if (newRemaining > 0) {
        void saveTimerState({
          endsAt: newEndsAt,
          duration: Math.max(newRemaining, 1),
          running: true,
        });
      } else {
        void clearTimerState();
      }
      return newRemaining;
    });
  }, []);

  const api: RestTimerApi = { remaining, isActive, startTimer, stopTimer, adjustTime };

  return <RestTimerContext.Provider value={api}>{children}</RestTimerContext.Provider>;
}

async function requestWakeLock(ref: React.MutableRefObject<WakeLockSentinelLike | null>) {
  try {
    const nav = navigator as Navigator & {
      wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinelLike> };
    };
    if (!nav.wakeLock) return;
    ref.current = await nav.wakeLock.request('screen');
  } catch {
    /* denied or unsupported */
  }
}

async function releaseWakeLock(ref: React.MutableRefObject<WakeLockSentinelLike | null>) {
  const lock = ref.current;
  if (lock) {
    ref.current = null;
    try {
      await lock.release();
    } catch {
      /* already released */
    }
  }
}

/** Consume the rest timer anywhere in the app. Throws outside the provider. */
export function useRestTimer(): RestTimerApi {
  const ctx = useContext(RestTimerContext);
  if (!ctx) throw new Error('useRestTimer must be used within <RestTimerProvider>');
  return ctx;
}
