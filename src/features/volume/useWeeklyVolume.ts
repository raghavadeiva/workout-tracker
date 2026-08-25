/**
 * React hook for fetching and computing weekly muscle group volume.
 *
 * Fetches workout history from IndexedDB and returns structured weekly
 * volume time-series data for rendering in the analytics UI.
 */

import { useState, useEffect, useMemo } from 'react';
import { getHistory, onHistoryChanged } from '../../db/database';
import type { WorkoutSession } from '../../db/database';
import { calculateWeeklyVolume, type WeeklyVolumeEntry } from './volumeUtils';

/**
 * Reactive hook that fetches workout history and computes weekly volume
 * time-series data.
 *
 * @returns {
 *   weeklyVolume: WeeklyVolumeEntry[] | null,
 *   isLoading: boolean,
 *   error: string | null
 * }
 */
export function useWeeklyVolume() {
  const [history, setHistory] = useState<WorkoutSession[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const sessions = await getHistory();
        if (mounted) {
          setHistory(sessions);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load history');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    load();
    // Refetch when a workout finishes — this hook lives on the permanently
    // mounted Progress pane, so a one-shot fetch would go stale.
    const unsubscribe = onHistoryChanged(() => {
      void load();
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const weeklyVolume = useMemo<WeeklyVolumeEntry[] | null>(() => {
    if (!history) return null;
    return calculateWeeklyVolume(history);
  }, [history]);

  return { weeklyVolume, isLoading, error };
}
