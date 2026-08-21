import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SetInput } from './SetInput';
import { SetRow } from './SetRow';
import { RestTimerBanner } from './RestTimerBanner';
import { ExerciseSelector } from './ExerciseSelector';
import { ExerciseSwap } from '../../recommendations/components/ExerciseSwap';
import { MaterialIcon } from '../../../components/MaterialIcon';
import { useWorkoutSession } from '../../../hooks/useWorkoutSession';
import type { Exercise, WeightUnit, Template } from '../../../db/database';

const spring = { type: 'spring' as const, stiffness: 400, damping: 34 };

interface ViewProps {
  exercises: Exercise[];
  weightUnit: WeightUnit;
  availableEquipment: string[];
  templates: Template[];
  isLoading: boolean;
  onAddExercise: (name: string) => void;
  onLogSet: (exerciseId: string, weight: number, reps: number) => void;
  onDeleteSet: (exerciseId: string, setId: string) => void;
  onDeleteExercise: (exerciseId: string) => void;
  onReorder: (exerciseId: string, direction: 'up' | 'down') => void;
  onSwap: (exerciseId: string, newName: string) => void;
  onFinish: () => void;
  onSaveTemplate: (name: string) => void;
  onStartTemplate: (template: Template) => void;
  onSetWeightUnit: (unit: WeightUnit) => void;
}

/** Self-contained container — App renders <WorkoutSession /> with no props. */
export function WorkoutSession() {
  const {
    exercises,
    weightUnit,
    setWeightUnit,
    availableEquipment,
    templates,
    isLoading,
    addExercise,
    logSet,
    deleteSet,
    deleteExercise,
    reorderExercise,
    swapExercise,
    finishWorkout,
    saveCurrentAsTemplate,
    startFromTemplate,
  } = useWorkoutSession();

  return (
    <WorkoutSessionView
      exercises={exercises}
      weightUnit={weightUnit}
      availableEquipment={availableEquipment}
      templates={templates}
      isLoading={isLoading}
      onAddExercise={addExercise}
      onLogSet={logSet}
      onDeleteSet={deleteSet}
      onDeleteExercise={deleteExercise}
      onReorder={reorderExercise}
      onSwap={(id, newName) => void swapExercise(id, newName)}
      onFinish={() => void finishWorkout()}
      onSaveTemplate={(name) => void saveCurrentAsTemplate(name)}
      onStartTemplate={(t) => void startFromTemplate(t)}
      onSetWeightUnit={setWeightUnit}
    />
  );
}

function WorkoutSessionView({
  exercises,
  weightUnit,
  availableEquipment,
  templates,
  onAddExercise,
  onLogSet,
  onDeleteSet,
  onDeleteExercise,
  onReorder,
  onSwap,
  onFinish,
  onSaveTemplate,
  onStartTemplate,
  onSetWeightUnit,
}: ViewProps) {
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [remaining, setRemaining] = useState(0);

  // Rest countdown
  useEffect(() => {
    if (!timerActive) return;
    const id = setInterval(
      () => setRemaining((r) => (r <= 0 ? 0 : r - 1)),
      1000
    );
    return () => clearInterval(id);
  }, [timerActive]);

  const totalSets = exercises.reduce((n, e) => n + e.sets.length, 0);

  return (
    <div className="px-5 pt-3">
      {/* Header */}
      <header className="flex items-center justify-between mb-5 gap-3">
        <h1 className="display-lg text-ink">Workout</h1>
        <div className="segmented flex-shrink-0" role="group" aria-label="Weight unit">
          {(['lbs', 'kg'] as WeightUnit[]).map((u) => (
            <button
              key={u}
              type="button"
              className={weightUnit === u ? 'on' : ''}
              onClick={() => onSetWeightUnit(u)}
            >
              {u}
            </button>
          ))}
        </div>
      </header>

      {/* Empty state */}
      {exercises.length === 0 ? (
        <div className="card p-6 text-center">
          <div
            className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4"
            style={{ background: 'var(--color-blue-soft)' }}
          >
            <MaterialIcon
              name="add"
              size={28}
              fill={0}
              style={{ color: 'var(--color-blue)' }}
            />
          </div>
          <h2 className="headline-sm text-ink mb-1">No exercises yet</h2>
          <p className="body-md text-secondary mb-5 max-w-[30ch] mx-auto">
            Add your first exercise or start from a saved template.
          </p>
          <button
            type="button"
            className="btn-primary pressable mb-2.5"
            onClick={() => setSelectorOpen(true)}
          >
            <MaterialIcon name="add" size={20} /> Add Exercise
          </button>
          {templates.length > 0 && (
            <button
              type="button"
              className="btn-outline pressable"
              onClick={() => setSelectorOpen(true)}
            >
              <MaterialIcon name="bookmark" size={20} /> Browse Templates
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Subtitle */}
          <p className="body-md text-tertiary -mt-3 mb-4">
            {exercises.length} exercise{exercises.length !== 1 ? 's' : ''} ·{' '}
            {totalSets} set{totalSets !== 1 ? 's' : ''}
          </p>

          {/* Exercise cards */}
          <AnimatePresence initial={false}>
            {exercises.map((ex) => (
              <motion.section
                key={ex.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={spring}
                className="card p-5 mb-4"
              >
                {/* Card header */}
                <div className="flex justify-between items-center mb-4">
                  <h2 className="headline-sm text-ink truncate pr-2">
                    {ex.name}
                  </h2>
                  <div className="flex items-center gap-0.5 flex-shrink-0 -mr-1.5">
                    <ExerciseSwap
                      exerciseName={ex.name}
                      availableEquipment={availableEquipment}
                      onSwap={(newName: string) => onSwap(ex.id, newName)}
                    />
                    <button
                      type="button"
                      onClick={() => onReorder(ex.id, 'up')}
                      disabled={exercises[0]?.id === ex.id}
                      aria-label={`Move ${ex.name} up`}
                      className="pressable w-8 h-8 flex items-center justify-center rounded-full bg-transparent border-none cursor-pointer disabled:opacity-25 hover:bg-sunken"
                    >
                      <MaterialIcon name="arrow_upward" size={18} style={{ color: 'var(--color-faint)' }} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onReorder(ex.id, 'down')}
                      disabled={exercises[exercises.length - 1]?.id === ex.id}
                      aria-label={`Move ${ex.name} down`}
                      className="pressable w-8 h-8 flex items-center justify-center rounded-full bg-transparent border-none cursor-pointer disabled:opacity-25 hover:bg-sunken"
                    >
                      <MaterialIcon name="arrow_downward" size={18} style={{ color: 'var(--color-faint)' }} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteExercise(ex.id)}
                      aria-label={`Remove ${ex.name}`}
                      className="pressable w-8 h-8 flex items-center justify-center rounded-full bg-transparent border-none cursor-pointer hover:bg-red-soft"
                    >
                      <MaterialIcon name="delete" size={18} style={{ color: 'var(--color-red)' }} />
                    </button>
                  </div>
                </div>

                {/* Last time ghost */}
                {ex.previousSets && ex.previousSets.length > 0 && (
                  <div
                    className="rounded-xl px-4 py-3 mb-4 flex justify-between items-center"
                    style={{
                      background: 'var(--color-sunken)',
                      border: '0.5px solid rgba(209,209,214,0.4)',
                    }}
                  >
                    <span className="body-md font-medium text-secondary">
                      Last time
                    </span>
                    <span className="text-[15px] font-semibold tnum">
                      {ex.previousSets.length} ×{' '}
                      {ex.previousSets[0]?.weight} {weightUnit} ×{' '}
                      {ex.previousSets[0]?.reps}
                    </span>
                  </div>
                )}

                {/* Logged sets */}
                {ex.sets.length > 0 && (
                  <div className="mb-5">
                    <AnimatePresence initial={false}>
                      {[...ex.sets].reverse().map((s, i) => (
                        <SetRow
                          key={s.id}
                          setNumber={ex.sets.length - i}
                          weight={s.weight}
                          reps={s.reps}
                          weightUnit={weightUnit}
                          onDelete={() => onDeleteSet(ex.id, s.id)}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}

                {/* Set logger */}
                <SetInput
                  exerciseName={ex.name}
                  previousWeight={
                    ex.sets.at(-1)?.weight ?? ex.previousSets?.at(-1)?.weight
                  }
                  previousReps={
                    ex.sets.at(-1)?.reps ?? ex.previousSets?.at(-1)?.reps
                  }
                  nextSetNumber={ex.sets.length + 1}
                  weightUnit={weightUnit}
                  onLogSet={(w, r) => {
                    onLogSet(ex.id, w, r);
                    setRemaining(90);
                    setTimerActive(true);
                  }}
                />
              </motion.section>
            ))}
          </AnimatePresence>

          {/* Bottom actions */}
          <div className="flex flex-col gap-3 mt-5 mb-2">
            <button
              type="button"
              className="btn-outline pressable"
              onClick={() => setSelectorOpen(true)}
            >
              <MaterialIcon name="add" size={20} /> Add Exercise
            </button>
            <button
              type="button"
              className="btn-finish pressable"
              onClick={onFinish}
            >
              Finish Workout
            </button>
            <button
              type="button"
              onClick={() => {
                const name = window.prompt('Template name', 'My Workout');
                if (name?.trim()) onSaveTemplate(name.trim());
              }}
              className="pressable w-full flex items-center justify-center gap-1.5 py-2 bg-transparent border-none cursor-pointer body-md font-medium"
              style={{ color: 'var(--color-blue)' }}
            >
              <MaterialIcon name="bookmark_add" size={18} /> Save as template
            </button>
          </div>
        </>
      )}

      {/* Modals */}
      {selectorOpen && (
        <ExerciseSelector
          templates={templates}
          onSelect={(name: string) => {
            onAddExercise(name);
            setSelectorOpen(false);
          }}
          onStartTemplate={(t: Template) => {
            onStartTemplate(t);
            setSelectorOpen(false);
          }}
          onClose={() => setSelectorOpen(false)}
        />
      )}
      <RestTimerBanner
        isActive={timerActive}
        timeRemaining={remaining}
        adjustTime={(d) => setRemaining((r) => Math.max(0, r + d))}
        stopTimer={() => setTimerActive(false)}
      />
    </div>
  );
}
