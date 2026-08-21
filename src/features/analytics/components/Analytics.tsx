import { useState, useEffect, useMemo } from 'react';
import {
  Dumbbell,
  BarChart2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from 'lucide-react';
import { motion } from 'framer-motion';
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
import { detectPlateau, type OneRMDataPoint } from '../plateauDetection';
import { useRecommendations } from '../../recommendations/useRecommendations';
import type { RecommendationResult } from '../../recommendations/exerciseVectors';
import { useWeeklyVolume } from '../../volume/useWeeklyVolume';
import { MUSCLE_GROUPS, MUSCLE_LABELS } from '../../volume/muscleMaps';
import type { MuscleGroup } from '../../volume/muscleMaps';
import { detectVolumeRisks, analyzeMuscleBalance } from '../../volume/volumeUtils';
import type { VolumeRiskResult, MuscleBalanceResult } from '../../volume/volumeUtils';

function formatDateShort(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, damping: 1.0, stiffness: 300 },
  },
};

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

  const isPlateaued = useMemo(() => {
    const dataPoints: OneRMDataPoint[] = progressionData.map((p) => ({
      date: p.date,
      oneRM: p.oneRM,
    }));
    return detectPlateau(dataPoints);
  }, [progressionData]);

  const { recommendations } = useRecommendations(selectedExercise, { topN: 2 });

  const {
    weeklyVolume,
    isLoading: volumeLoading,
    error: volumeError,
  } = useWeeklyVolume();

  const volumeRisks = useMemo(() => detectVolumeRisks(history), [history]);
  const muscleBalance = useMemo(() => analyzeMuscleBalance(history), [history]);

  // ─── Loading state ───
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[--color-background] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-body">
            Loading analytics...
          </p>
        </div>
      </div>
    );
  }

  // ─── Empty state ───
  if (exerciseNames.length === 0) {
    return (
      <div className="min-h-screen bg-[--color-background] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
            <BarChart2 className="w-10 h-10 text-gray-400 dark:text-gray-500" />
          </div>
          <h2 className="text-2xl font-bold font-display text-[--color-text-primary] mb-2">
            No data yet
          </h2>
          <p className="text-gray-500 dark:text-gray-400 font-body">
            Complete some workouts to see your progress
          </p>
        </div>
      </div>
    );
  }

  const current1RM =
    progressionData.length > 0
      ? progressionData[progressionData.length - 1].oneRM
      : 0;
  const allTimeBest =
    progressionData.length > 0
      ? Math.max(...progressionData.map((p) => p.oneRM))
      : 0;

  return (
    <div className="min-h-screen bg-[--color-background] font-body text-[--color-text-primary]">
      {/* Header — translucent material */}
      <motion.header
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring' as const, damping: 1.0, stiffness: 300 }}
        className="sticky top-0 z-40 flex items-center justify-between p-4 material border-b border-[--color-separator] dark:border-gray-800"
      >
        <h1 className="text-xl font-bold font-display text-[--color-text-primary]">
          Progress
        </h1>
      </motion.header>

      <motion.main
        className="max-w-md mx-auto px-4 py-4 space-y-4 pb-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ─── Exercise Selector Dropdown ─── */}
        <motion.div variants={itemVariants} className="relative">
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-full flex items-center justify-between px-4 py-3 bg-[--color-surface] dark:bg-gray-800 border border-[--color-separator] dark:border-gray-700 rounded-xl text-left tap-feedback shadow-elevated"
          >
            <div className="flex items-center gap-3">
              <div className="w-32 h-32 flex-shrink-0 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <Dumbbell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="font-medium text-[--color-text-primary]">
                {selectedExercise || 'Select exercise'}
              </span>
            </div>
            {showDropdown ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </motion.button>

          {/* Dropdown — spring open */}
          {showDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ type: 'spring' as const, damping: 1.0, stiffness: 400 }}
              className="absolute top-full left-0 right-0 mt-1 bg-[--color-surface] dark:bg-gray-800 border border-[--color-separator] dark:border-gray-700 rounded-xl shadow-popover z-50 overflow-hidden"
            >
              {exerciseNames.map((name) => (
                <motion.button
                  key={name}
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setSelectedExercise(name);
                    setShowDropdown(false);
                  }}
                  className={`w-full px-4 py-3 text-left transition-colors tap-feedback ${
                    selectedExercise === name
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
                      : 'text-[--color-text-primary] hover:bg-gray-50 dark:hover:bg-gray-700'
                  }}`}
                >
                  {name}
                </motion.button>
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* ─── Stats Cards (Current 1RM + All-Time Best) ─── */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-2 gap-3"
        >
          <div className="bg-[--color-surface] dark:bg-gray-800 rounded-xl p-4 border border-[--color-separator] dark:border-gray-700 shadow-elevated">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              Current 1RM
            </p>
            <p className="text-2xl font-bold font-mono text-[--color-text-primary]">
              {current1RM > 0 ? Math.round(current1RM) : '—'}
            </p>
          </div>
          <div className="bg-[--color-surface] dark:bg-gray-800 rounded-xl p-4 border border-[--color-separator] dark:border-gray-700 shadow-elevated">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              All-Time Best
            </p>
            <p className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">
              {allTimeBest > 0 ? Math.round(allTimeBest) : '—'}
            </p>
          </div>
        </motion.div>

        {/* ─── Plateau Detection + Recommendations ─── */}
        {isPlateaued && selectedExercise && (
          <motion.div
            variants={itemVariants}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring' as const, damping: 1.0, stiffness: 300 }}
            className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4"
          >
            <div className="flex items-start gap-3 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-900 dark:text-amber-100">
                  Plateau Detected
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-0.5">
                  No strength growth in the last 3 sessions for{' '}
                  <span className="font-semibold">{selectedExercise}</span>.
                  Here are alternative exercises to try:
                </p>
              </div>
            </div>

            {recommendations && recommendations.length > 0 && (
              <div className="space-y-2">
                {recommendations.map((rec: RecommendationResult) => (
                  <div
                    key={rec.exercise}
                    className="flex items-center justify-between bg-[--color-surface] dark:bg-gray-800 rounded-lg px-3 py-2 border border-amber-100 dark:border-amber-800/30"
                  >
                    <span className="font-medium text-[--color-text-primary]">
                      {rec.exercise}
                    </span>
                    <span className="text-xs font-mono text-amber-700 dark:text-amber-300">
                      {Math.round(rec.score * 100)}% match
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ─── 1RM Progress Chart ─── */}
        <motion.div variants={itemVariants}>
          <motion.div
            className="bg-[--color-surface] dark:bg-gray-800 rounded-2xl p-4 border border-[--color-separator] dark:border-gray-700 shadow-elevated h-72"
            whileHover={{ boxShadow: 'var(--shadow-popover)' }}
          >
            {progressionData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                No data for this exercise
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={progressionData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                    vertical={false}
                  />
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
                      backgroundColor: 'var(--color-surface)',
                      border: '1px solid var(--color-separator)',
                      borderRadius: '8px',
                      boxShadow: 'var(--shadow-floating)',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="oneRM"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5, stroke: 'var(--color-surface)' }}
                    activeDot={{ r: 7, strokeWidth: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </motion.div>
        </motion.div>

        {/* ─── Weekly Muscle Volume ─── */}
        {!volumeLoading && weeklyVolume && weeklyVolume.length > 0 && (
          <motion.div variants={itemVariants}>
            <motion.div
              className="bg-[--color-surface] dark:bg-gray-800 rounded-2xl p-4 border border-[--color-separator] dark:border-gray-700 shadow-elevated"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="text-sm font-medium text-[--color-text-primary] mb-3">
                Weekly Muscle Volume
              </h3>
              {volumeError ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Unable to load volume data
                </p>
              ) : (
                <div className="space-y-3">
                  {MUSCLE_GROUPS.slice()
                    .reverse()
                    .map((muscle: MuscleGroup) => {
                      const volumes = weeklyVolume.map((w) => w.volumes[muscle]);
                      const maxVolume = Math.max(...volumes);
                      if (maxVolume === 0) return null;

                      return (
                        <motion.div
                          key={muscle}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            type: 'spring' as const,
                            damping: 1.0,
                            stiffness: 300,
                          }}
                          className="space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600 dark:text-gray-400 w-24">
                              {MUSCLE_LABELS[muscle]}
                            </span>
                            <span className="text-xs font-mono text-[--color-text-primary]">
                              {Math.round(maxVolume)}
                            </span>
                          </div>
                          <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-teal-500 dark:bg-teal-400 rounded-full"
                              initial={{ width: 0 }}
                              animate={{
                                width: `${Math.min(
                                  (maxVolume / 5000) * 100,
                                  100
                                )}%`,
                              }}
                              transition={{
                                type: 'spring' as const,
                                damping: 1.0,
                                stiffness: 300,
                                delay: 0.04,
                              }}
                            />
                          </div>
                          <div className="flex -space-x-1">
                            {weeklyVolume
                              .map((week) => (
                                <span
                                  key={week.weekKey}
                                  className="text-xs text-gray-500 dark:text-gray-500"
                                  title={`${week.weekLabel}: ${Math.round(week.volumes[muscle])} volume`}
                                >
                                  {week.weekLabel.split(' ')[1]}
                                </span>
                              ))
                              .reverse()
                              .slice(0, 4)}
                          </div>
                        </motion.div>
                      );
                    })}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* ─── Volume Alerts ─── */}
        {volumeRisks.length > 0 && (
          <motion.div variants={itemVariants}>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-1">
              Volume Alerts
            </h3>
            <div className="space-y-2">
              {volumeRisks.map((risk: VolumeRiskResult) => (
                <motion.div
                  key={risk.muscle}
                  whileTap={{ scale: 0.97 }}
                  className={`flex items-center justify-between p-3 rounded-xl border tap-feedback ${
                    risk.risk === 'overtrained'
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        risk.risk === 'overtrained'
                          ? 'bg-red-500'
                          : 'bg-amber-500'
                      }`}
                    />
                    <span className="font-medium text-[--color-text-primary]">
                      {MUSCLE_LABELS[risk.muscle]}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {risk.label}
                    </span>
                  </div>
                  <span className="text-sm font-mono text-gray-600 dark:text-gray-300">
                    {Math.round(risk.volume)} vol
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ─── Muscle Balance ─── */}
        {muscleBalance.length > 0 && (
          <motion.div variants={itemVariants}>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-1">
              Muscle Balance
            </h3>
            <div className="space-y-3">
              {muscleBalance.slice(0, 5).map((m: MuscleBalanceResult) => {
                const isOver = m.percentage > 15;
                const isUnder = m.percentage < 5;
                return (
                  <motion.div
                    key={m.muscle}
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: '100%' }}
                    transition={{
                      type: 'spring' as const,
                      damping: 1.0,
                      stiffness: 300,
                    }}
                    className="space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 dark:text-gray-400 w-24">
                        {MUSCLE_LABELS[m.muscle]}
                      </span>
                      <span className="text-xs font-mono text-[--color-text-primary]">
                        {Math.round(m.percentage)}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full transition-colors ${
                          isOver
                            ? 'bg-red-500 dark:bg-red-400'
                            : isUnder
                            ? 'bg-amber-500 dark:bg-amber-400'
                            : 'bg-teal-500 dark:bg-teal-400'
                        }`}
                        initial={{ width: 0 }}
                        animate={{
                          width: `${Math.min(m.percentage, 100)}%`,
                        }}
                        transition={{
                          type: 'spring' as const,
                          damping: 1.0,
                          stiffness: 300,
                          delay: 0.06,
                        }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </motion.main>
    </div>
  );
}
