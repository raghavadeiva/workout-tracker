import { useState, useEffect, useMemo } from 'react';
import { Dumbbell, BarChart2, ChevronDown, ChevronUp } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { getHistory, type WorkoutSession } from '../../../db/database';
import { getExerciseProgression, getAllExerciseNames } from '../utils/math';

function formatDateShort(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function Analytics() {
  const [history, setHistory] = useState<WorkoutSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const sessions = await getHistory();
      if (mounted) {
        setHistory(sessions);
        setIsLoading(false);
        // Auto-select first exercise if available
        const names = getAllExerciseNames(sessions);
        if (names.length > 0) {
          setSelectedExercise(names[0]);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const exerciseNames = useMemo(() => getAllExerciseNames(history), [history]);
  const progressionData = useMemo(() => {
    if (!selectedExercise) return [];
    return getExerciseProgression(history, selectedExercise);
  }, [history, selectedExercise]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (exerciseNames.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
            <BarChart2 className="w-10 h-10 text-gray-400 dark:text-gray-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            No data yet
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Complete some workouts to see your progress
          </p>
        </div>
      </div>
    );
  }

  const current1RM = progressionData.length > 0 ? progressionData[progressionData.length - 1].oneRM : 0;
  const allTimeBest = progressionData.length > 0 ? Math.max(...progressionData.map(p => p.oneRM)) : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between p-4 bg-white/80 dark:bg-gray-950/80 backdrop-blur border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Progress</h1>
      </header>

      {/* Exercise Selector */}
      <div className="max-w-md mx-auto px-4 py-4">
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <Dumbbell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {selectedExercise || 'Select exercise'}
              </span>
            </div>
            {showDropdown ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>

          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden">
              {exerciseNames.map((name) => (
                <button
                  key={name}
                  onClick={() => {
                    setSelectedExercise(name);
                    setShowDropdown(false);
                  }}
                  className={`w-full px-4 py-3 text-left transition-colors ${
                    selectedExercise === name
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
                      : 'text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-md mx-auto px-4 pb-4 grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
            Current 1RM
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-mono">
            {current1RM > 0 ? current1RM : '—'}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
            All-Time Best
          </p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono">
            {allTimeBest > 0 ? allTimeBest : '—'}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="max-w-md mx-auto px-4 pb-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 h-72">
          {progressionData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
              No data for this exercise
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDateShort}
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => value.toString()}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="oneRM"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5, stroke: '#fff' }}
                  activeDot={{ r: 7, strokeWidth: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}