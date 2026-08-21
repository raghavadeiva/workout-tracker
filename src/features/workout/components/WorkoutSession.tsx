import { useState, useCallback } from 'react';
import { Plus, Dumbbell, CheckCircle2, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExerciseSelector } from './ExerciseSelector';
import { ExerciseCard } from './ExerciseCard';
import { RestTimerBanner } from './RestTimerBanner';
import { EquipmentPreferences } from '../../recommendations/components/EquipmentPreferences';
import { useWorkoutSession } from '../../../hooks/useWorkoutSession';
import { useRestTimer } from '../../../hooks/useRestTimer';
import type { Exercise } from '../../../db/database';

// Animation variants for staggered children
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.04,
    },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, damping: 1.0, stiffness: 300, restDelta: 0.5 },
  },
};

export function WorkoutSession() {
  const {
    exercises,
    weightUnit,
    setWeightUnit,
    availableEquipment,
    setAvailableEquipment,
    isLoading,
    templates,
    addExercise,
    logSet,
    deleteSet,
    deleteExercise,
    swapExercise,
    reorderExercise,
    finishWorkout,
    saveCurrentAsTemplate,
    startFromTemplate,
    totalSets,
  } = useWorkoutSession();

  const timerProps = useRestTimer();

  // All hooks must go before conditional returns!
  const [showSelector, setShowSelector] = useState(false);

  const handleAddExercise = useCallback((name: string) => {
    addExercise(name);
    setShowSelector(false);
  }, [addExercise]);

  const logSetAndStartTimer = useCallback(
    (exerciseId: string, weight: number, reps: number) => {
      logSet(exerciseId, weight, reps);
      timerProps.startTimer(90);
    },
    [logSet, timerProps]
  );

  const handleSaveAsTemplate = useCallback(() => {
    const name = window.prompt('Enter template name:');
    if (name?.trim()) {
      saveCurrentAsTemplate(name.trim());
    }
  }, [saveCurrentAsTemplate]);

  const handleStartFromTemplate = useCallback(
    (template: (typeof templates)[0]) => {
      startFromTemplate(template);
      setShowSelector(false);
    },
    [startFromTemplate]
  );

  // Full-page swap for loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[--color-background] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-body">
            Loading workout...
          </p>
        </div>
      </div>
    );
  }

  // Full-page swap for ExerciseSelector (per architecture waR: iOS touch bug)
  if (showSelector) {
    return (
      <ExerciseSelector
        onSelect={handleAddExercise}
        onClose={() => setShowSelector(false)}
        templates={templates}
        onStartFromTemplate={handleStartFromTemplate}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[--color-background] font-body text-[--color-text-primary]">
      {/* Header — translucent material */}
      <header className="sticky top-0 z-40 flex items-center justify-between gap-3 p-4 material border-b border-[--color-separator] dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-32 h-32 flex-shrink-0 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 rounded-2xl">
            <Dumbbell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-xl font-bold font-display text-[--color-text-primary]">
            Active Workout
          </h1>
        </div>

        {/* Unit toggle + Save Template */}
        <div className="flex items-center gap-2">
          {/* Weight unit segmented control */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setWeightUnit('lbs')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all tap-feedback ${
                weightUnit === 'lbs'
                  ? 'bg-[--color-surface] dark:bg-gray-700 text-[--color-text-primary] shadow-elevated'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }}`}
            >
              lbs
            </button>
            <button
              type="button"
              onClick={() => setWeightUnit('kg')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all tap-feedback ${
                weightUnit === 'kg'
                  ? 'bg-[--color-surface] dark:bg-gray-700 text-[--color-text-primary] shadow-elevated'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }}`}
            >
              kg
            </button>
          </div>

          {/* Save as Template Button */}
          {exercises.length > 0 && (
            <motion.button
              type="button"
              onClick={handleSaveAsTemplate}
              whileTap={{ scale: 0.9 }}
              className="p-2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors tap-feedback"
              aria-label="Save as template"
            >
              <Save className="w-5 h-5" />
            </motion.button>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-md mx-auto px-4 py-4 space-y-4 pb-24">
        <AnimatePresence>
          {exercises.length === 0 ? (
            // ─── Empty State: Show Templates + Start Button ───
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', damping: 1.0, stiffness: 300 }}
              className="space-y-4"
            >
              {/* Template previews */}
              {templates.length > 0 && (
                <motion.div
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-3"
                >
                  <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1">
                    Your Templates
                  </h2>
                  {templates.map((template) => (
                    <motion.button
                      key={template.id}
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleStartFromTemplate(template)}
                      className="w-full flex items-center justify-between p-4 bg-[--color-surface] dark:bg-gray-800 rounded-2xl border border-[--color-separator] dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left cursor-pointer tap-feedback"
                    >
                      <div>
                        <p className="font-medium text-[--color-text-primary]">
                          {template.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                          {template.exerciseNames.length} exercise
                          {template.exerciseNames.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        {template.exerciseNames.slice(0, 3).map((exName, i) => (
                          <span
                            key={i}
                            className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full"
                          >
                            {exName}
                          </span>
                        ))}
                        {template.exerciseNames.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{template.exerciseNames.length - 3} more
                          </span>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </motion.div>
              )}

              {/* Start Blank Workout Button */}
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowSelector(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-2xl transition-colors tap-feedback"
              >
                <Plus className="w-5 h-5" />
                Start Blank Workout
              </motion.button>
            </motion.div>
          ) : (
            // ─── Active Workout State ───
            <motion.div
              key="active"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', damping: 1.0, stiffness: 300 }}
              className="space-y-4"
            >
              {/* Add Exercise Button */}
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowSelector(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-2xl transition-colors tap-feedback"
              >
                <Plus className="w-5 h-5" />
                Add Exercise
              </motion.button>

              {/* Exercise Cards */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-4"
              >
                {exercises.map((exercise: Exercise) => (
                  <motion.div key={exercise.id} variants={itemVariants}>
                    <ExerciseCard
                      exercise={exercise}
                      weightUnit={weightUnit}
                      availableEquipment={availableEquipment}
                      onLogSet={logSetAndStartTimer}
                      onDeleteSet={deleteSet}
                      onDeleteExercise={deleteExercise}
                      onSwapExercise={swapExercise}
                      onReorder={reorderExercise}
                    />
                  </motion.div>
                ))}
              </motion.div>

              {/* Summary */}
              <motion.div
                variants={itemVariants}
                className="pt-4 border-t border-[--color-separator] dark:border-gray-800"
              >
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>
                    {exercises.length} exercise
                    {exercises.length !== 1 ? 's' : ''}
                  </span>
                  <span>
                    {totalSets} set{totalSets !== 1 ? 's' : ''} logged
                  </span>
                </div>
              </motion.div>

              {/* Finish Workout Button */}
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={finishWorkout}
                className="w-full flex items-center justify-center gap-2 px-4 py-4 text-base font-semibold text-white bg-green-600 hover:bg-green-700 active:bg-green-800 rounded-2xl transition-colors tap-feedback"
              >
                <CheckCircle2 className="w-5 h-5" />
                Finish Workout
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Rest Timer Banner */}
      <RestTimerBanner {...timerProps} />

      {/* Equipment Preferences */}
      <EquipmentPreferences
        availableEquipment={availableEquipment}
        onSetAvailableEquipment={setAvailableEquipment}
      />
    </div>
  );
}
