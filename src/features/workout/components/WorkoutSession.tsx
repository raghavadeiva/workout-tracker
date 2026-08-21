import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SetInput } from './SetInput';
import { SetRow } from './SetRow';
import { ExerciseSelector } from './ExerciseSelector';
import { ExerciseSwap } from '../../recommendations/components/ExerciseSwap';
import { MaterialIcon } from '../../../components/MaterialIcon';
import { useWorkoutSession } from '../../../hooks/useWorkoutSession';
import { useRestTimer } from '../../../hooks/useRestTimer';
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
  onRenameTemplate: (id: string, newName: string) => void;
  onDeleteTemplate: (id: string) => void;
  onStartTemplate: (template: Template) => void;
  onSetWeightUnit: (unit: WeightUnit) => void;
  started: boolean;
  onSetStarted: (started: boolean) => void;
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
    renameTemplate,
    removeTemplate,
    startFromTemplate,
  } = useWorkoutSession();

  // Start screen gate — lives here so Finish can reset it
  const [started, setStarted] = useState(false);

  return (
    <WorkoutSessionView
      exercises={exercises}
      weightUnit={weightUnit}
      availableEquipment={availableEquipment}
      templates={templates}
      isLoading={isLoading}
      started={started}
      onSetStarted={setStarted}
      onAddExercise={addExercise}
      onLogSet={logSet}
      onDeleteSet={deleteSet}
      onDeleteExercise={deleteExercise}
      onReorder={reorderExercise}
      onSwap={(id, newName) => void swapExercise(id, newName)}
      onFinish={() => {
        void finishWorkout();
        setStarted(false);
      }}
      onSaveTemplate={(name) => void saveCurrentAsTemplate(name)}
      onRenameTemplate={(id, newName) => void renameTemplate(id, newName)}
      onDeleteTemplate={(id) => void removeTemplate(id)}
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
  onRenameTemplate,
  onDeleteTemplate,
  onStartTemplate,
  onSetWeightUnit,
  started,
  onSetStarted,
}: ViewProps) {
  const [selectorOpen, setSelectorOpen] = useState(false);
  const { startTimer } = useRestTimer();

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

      {/* Start screen — shown before a workout begins */}
      {!started && exercises.length === 0 ? (
        <div>
          {/* Hero */}
          <div className="card p-6 pt-7 text-center mb-4">
            <div
              className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4"
              style={{ background: 'var(--color-blue-soft)' }}
            >
              <MaterialIcon
                name="fitness_center"
                size={30}
                fill={1}
                style={{ color: 'var(--color-blue)' }}
              />
            </div>
            <h2 className="headline-md text-ink mb-1.5">Ready to train?</h2>
            <p className="body-md text-secondary mb-6 max-w-[30ch] mx-auto">
              Start an empty workout or pick up one of your templates.
            </p>
            <button
              type="button"
              className="btn-primary pressable mb-2.5"
              style={{ minHeight: 56, fontSize: 18 }}
              onClick={() => setSelectorOpen(true)}
            >
              <MaterialIcon name="play_arrow" size={24} fill={1} /> Start
              Workout
            </button>
            <p className="label-caps text-tertiary" style={{ textTransform: 'none' }}>
              You'll add exercises next
            </p>
          </div>

          {/* Template quick-start */}
          {templates.length > 0 && (
            <section>
              <h3 className="section-label mb-2 ml-1">Quick start</h3>
              <div className="card row-sep overflow-hidden">
                {templates.map((t) => (
                  <div key={t.id} className="flex items-center hover:bg-sunken">
                    <button
                      type="button"
                      onClick={() => {
                        onStartTemplate(t);
                        onSetStarted(true);
                      }}
                      className="pressable flex-1 min-w-0 flex items-center gap-3 p-4 bg-transparent border-none cursor-pointer text-left"
                    >
                      <MaterialIcon
                        name="bookmark"
                        size={22}
                        style={{ color: 'var(--color-blue)', flexShrink: 0 }}
                      />
                      <span className="flex-1 min-w-0">
                        <span className="block text-[15px] font-semibold text-ink truncate">
                          {t.name}
                        </span>
                        <span className="block body-md text-tertiary truncate">
                          {t.exerciseNames.join(' · ')}
                        </span>
                      </span>
                      <MaterialIcon
                        name="chevron_right"
                        size={22}
                        style={{ color: 'var(--color-faint)', flexShrink: 0 }}
                      />
                    </button>
                    {/* Manage: rename + delete */}
                    <button
                      type="button"
                      onClick={() => {
                        const name = window.prompt('Rename template', t.name);
                        if (name?.trim()) void onRenameTemplate(t.id, name.trim());
                      }}
                      aria-label={`Rename ${t.name}`}
                      className="pressable w-10 h-10 mr-0.5 flex items-center justify-center rounded-full bg-transparent border-none cursor-pointer hover:bg-sunken-high"
                    >
                      <MaterialIcon
                        name="edit"
                        size={18}
                        style={{ color: 'var(--color-tertiary)' }}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          window.confirm(
                            `Delete template "${t.name}"? This cannot be undone.`
                          )
                        ) {
                          void onDeleteTemplate(t.id);
                        }
                      }}
                      aria-label={`Delete ${t.name}`}
                      className="pressable w-10 h-10 mr-2 flex items-center justify-center rounded-full bg-transparent border-none cursor-pointer hover:bg-red-soft"
                    >
                      <MaterialIcon
                        name="delete"
                        size={18}
                        style={{ color: 'var(--color-red)' }}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      ) : exercises.length === 0 ? (
        /* In-progress but empty — user removed all exercises mid-workout */
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
            Add your first exercise to get going.
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
              onClick={() => {
                onSetStarted(false);
                setSelectorOpen(true);
              }}
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

                {/* Set logger — keyed by exercise id + set count so switching
                    exercises remounts with clean prefill (ghost-bleed fix) */}
                <SetInput
                  key={`${ex.id}:${ex.sets.length}`}
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
                    startTimer(90);
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
            onSetStarted(true);
            setSelectorOpen(false);
          }}
          onStartTemplate={(t: Template) => {
            onStartTemplate(t);
            onSetStarted(true);
            setSelectorOpen(false);
          }}
          onRenameTemplate={(id, newName) => void onRenameTemplate(id, newName)}
          onDeleteTemplate={(id) => void onDeleteTemplate(id)}
          onClose={() => setSelectorOpen(false)}
        />
      )}
    </div>
  );
}
