import { useState, useEffect, useCallback } from 'react';

interface RestTimerState {
  timeRemaining: number;
  isActive: boolean;
}

export function useRestTimer() {
  const [state, setState] = useState<RestTimerState>({
    timeRemaining: 0,
    isActive: false,
  });

  // Handle tick
  useEffect(() => {
    let intervalId: number | null = null;

    if (state.isActive && state.timeRemaining > 0) {
      intervalId = window.setInterval(() => {
        setState((prev) => {
          if (prev.timeRemaining <= 1) {
            return { ...prev, timeRemaining: 0, isActive: false };
          }
          return { ...prev, timeRemaining: prev.timeRemaining - 1 };
        });
      }, 1000);
    } else if (state.timeRemaining === 0) {
      setState((prev) => ({ ...prev, isActive: false }));
    }

    return () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
      }
    };
  }, [state.isActive, state.timeRemaining]);

  const startTimer = useCallback((seconds: number) => {
    setState({ timeRemaining: seconds, isActive: true });
  }, []);

  const stopTimer = useCallback(() => {
    setState({ timeRemaining: 0, isActive: false });
  }, []);

  const adjustTime = useCallback((seconds: number) => {
    setState((prev) => {
      const newTime = prev.timeRemaining + seconds;
      // Clamp between 0 and 3600 (1 hour max)
      const clamped = Math.max(0, Math.min(3600, newTime));
      return { ...prev, timeRemaining: clamped, isActive: clamped > 0 };
    });
  }, []);

  return {
    ...state,
    startTimer,
    stopTimer,
    adjustTime,
  };
}