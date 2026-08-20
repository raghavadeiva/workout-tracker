import { useState, useCallback } from 'react';
import { Plus, Dumbbell, CheckCircle2, Save } from 'lucide-react';
import { ExerciseSelector } from './ExerciseSelector';
import { ExerciseCard } from './ExerciseCard';
import { RestTimerBanner } from './RestTimerBanner';
import { EquipmentPreferences } from '../../recommendations/components/EquipmentPreferences';
import { useWorkoutSession } from '../../../hooks/useWorkoutSession';
import { useRestTimer } from '../../../hooks/useRestTimer';
import type { Exercise } from '../../../db/database';

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

  const logSetAndStartTimer = useCallback((exerciseId: string, weight: number, reps: number) => {
    logSet(exerciseId, weight, reps);
    timerProps.startTimer(90);
  }, [logSet, timerProps]);

  const handleSaveAsTemplate = useCallback(() => {
    const name = window.prompt('Enter template name:');
    if (name?.trim()) {
      saveCurrentAsTemplate(name.trim());
    }
  }, [saveCurrentAsTemplate]);

  const handleStartFromTemplate = useCallback((template: typeof templates[0]) => {
    startFromTemplate(template);
    setShowSelector(false);
  }, [startFromTemplate]);

  // Full-page swap for loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading workout...</p>
        </div>
      </div>
    );
  }

  // Full-page swap for ExerciseSelector
  if (showSelector) {
    return (
      <ExerciseSelector
        onSelect={handleAddExercise}
        onClose={() => setShowSelector(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-28">
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between gap-3 p-4 bg-white/80 dark:bg-gray-950/80 backdrop-blur border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
            <Dumbbell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Active Workout</h1>
        </div>

        {/* Unit toggle + Save Template */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            <button
              onClick={() => setWeightUnit('lbs')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                weightUnit === 'lbs'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              lbs
            </button>
            <button
              onClick={() => setWeightUnit('kg')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                weightUnit === 'kg'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              kg
            </button>
          </div>
          
          {/* Save as Template Button */}
          {exercises.length > 0 && (
            <button
              onClick={handleSaveAsTemplate}
              className="p-2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors"
              aria-label="Save as template"
            >
              <Save className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-md mx-auto px-4 py-4 space-y-4 pb-20">
        {exercises.length === 0 ? (
          // Empty State: Show Templates
          <div className="space-y-4">
            {templates.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1">
                  Your Templates
                </h2>
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleStartFromTemplate(template)}
                    className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 transition-colors text-left cursor-pointer"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{template.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {template.exerciseNames.length} exercise{template.exerciseNames.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      {template.exerciseNames.slice(0, 3).map((exName, i) => (
                        <span key={i} className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                          {exName}
                        </span>
                      ))}
                      {template.exerciseNames.length > 3 && (
                        <span className="text-xs text-gray-500">+{template.exerciseNames.length - 3} more</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Start Blank Workout */}
            <button
              onClick={() => setShowSelector(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-2xl transition-colors"
            >
              <Plus className="w-5 h-5" />
              Start Blank Workout
            </button>
          </div>
        ) : (
          // Active Workout State
          <div className="space-y-4">
            {/* Add Exercise Button */}
            <button
              onClick={() => setShowSelector(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-2xl transition-colors cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              Add Exercise
            </button>

            {/* Exercise Cards */}
            <div className="space-y-4">
              {exercises.map((exercise: Exercise) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  weightUnit={weightUnit}
                  availableEquipment={availableEquipment}
                  onLogSet={logSetAndStartTimer}
                  onDeleteSet={deleteSet}
                  onDeleteExercise={deleteExercise}
                  onSwapExercise={swapExercise}
                  onReorder={reorderExercise}
                />
              ))}
            </div>

            {/* Summary */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>{exercises.length} exercise{exercises.length !== 1 ? 's' : ''}</span>
                <span>{totalSets} set{totalSets !== 1 ? 's' : ''} logged</span>
              </div>
            </div>

            {/* Finish Workout Button */}
            <button
              onClick={finishWorkout}
              className="w-full flex items-center justify-center gap-2 px-4 py-4 text-base font-semibold text-white bg-green-600 hover:bg-green-700 active:bg-green-800 rounded-2xl transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5" />
              Finish Workout
            </button>
          </div>
        )}
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