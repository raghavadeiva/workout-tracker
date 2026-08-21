import { useState, useEffect, useCallback } from 'react';
import {
  saveSession,
  loadSession,
  clearSession,
  finishSession,
  saveWeightUnit,
  loadWeightUnit,
  saveAvailableEquipment,
  loadAvailableEquipment,
  seedExerciseEmbeddings,
  generateId,
  createEmptySession,
  deleteTemplate,
  type WorkoutSession,
  type Exercise,
  type SetEntry,
  type WeightUnit,
  type Template,
  saveTemplate,
  getTemplates,
  getPreviousPerformance,
} from '../db/database';

export function useWorkoutSession() {
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [weightUnit, setWeightUnitState] = useState<WeightUnit>('lbs');
  const [availableEquipment, setAvailableEquipmentState] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [templates, setTemplates] = useState<Template[]>([]);

  // Load session, settings, and templates on mount
  useEffect(() => {
    let mounted = true;

    async function load() {
      const [savedSession, savedUnit, savedTemplates, savedEquipment] = await Promise.all([
        loadSession(),
        loadWeightUnit(),
        getTemplates(),
        loadAvailableEquipment(),
      ]);

      if (mounted) {
        setSession(savedSession ?? createEmptySession());
        setWeightUnit(savedUnit);
        setAvailableEquipmentState(savedEquipment);
        setTemplates(savedTemplates);
        setIsLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  // Auto-save session whenever it changes
  useEffect(() => {
    if (session && !isLoading) {
      saveSession({ ...session, updatedAt: Date.now() });
    }
  }, [session, isLoading]);

  // Auto-save weight unit
  useEffect(() => {
    if (!isLoading) {
      saveWeightUnit(weightUnit);
    }
  }, [weightUnit, isLoading]);

  // Auto-save available equipment
  useEffect(() => {
    if (!isLoading) {
      saveAvailableEquipment(availableEquipment);
    }
  }, [availableEquipment, isLoading]);

  // Seed exercise embeddings on first mount (idempotent)
  useEffect(() => {
    seedExerciseEmbeddings().catch(console.error);
  }, []);

  const setWeightUnit = useCallback((unit: WeightUnit) => {
    setWeightUnitState(unit);
  }, []);

  const setAvailableEquipment = useCallback((equipment: string[]) => {
    setAvailableEquipmentState(equipment);
  }, []);

  const addExercise = useCallback((name: string) => {
    const newExercise: Exercise = {
      id: generateId(),
      name,
      sets: [],
    };
    setSession((prev) =>
      prev ? { ...prev, exercises: [...prev.exercises, newExercise] } : null
    );
  }, []);

  const logSet = useCallback((exerciseId: string, weight: number, reps: number) => {
    const newSet: SetEntry = {
      id: generateId(),
      setNumber: 0,
      weight,
      reps,
      completedAt: Date.now(),
    };
    setSession((prev) =>
      prev
        ? {
            ...prev,
            exercises: prev.exercises.map((ex) =>
              ex.id === exerciseId
                ? {
                    ...ex,
                    sets: [...ex.sets, { ...newSet, setNumber: ex.sets.length + 1 }],
                  }
                : ex
            ),
          }
        : null
    );
  }, []);

  const deleteSet = useCallback((exerciseId: string, setId: string) => {
    setSession((prev) =>
      prev
        ? {
            ...prev,
            exercises: prev.exercises.map((ex) =>
              ex.id === exerciseId
                ? {
                    ...ex,
                    sets: ex.sets
                      .filter((s) => s.id !== setId)
                      .map((s, idx) => ({ ...s, setNumber: idx + 1 })),
                  }
                : ex
            ),
          }
        : null
    );
  }, []);

  const deleteExercise = useCallback((exerciseId: string) => {
    setSession((prev) =>
      prev
        ? {
            ...prev,
            exercises: prev.exercises.filter((ex) => ex.id !== exerciseId),
          }
        : null
    );
  }, []);

  const reorderExercise = useCallback((exerciseId: string, direction: 'up' | 'down') => {
    setSession((prev) => {
      if (!prev) return null;
      const idx = prev.exercises.findIndex((ex) => ex.id === exerciseId);
      if (idx === -1) return prev;
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.exercises.length) return prev;
      const next = [...prev.exercises];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return { ...prev, exercises: next };
    });
  }, []);

  const swapExercise = useCallback(async (exerciseId: string, newName: string) => {
    const previousSets = await getPreviousPerformance(newName);
    setSession((prev) =>
      prev
        ? {
            ...prev,
            exercises: prev.exercises.map((ex) =>
              ex.id === exerciseId
                ? {
                    ...ex,
                    name: newName,
                    previousSets: previousSets.length > 0 ? previousSets : ex.previousSets,
                  }
                : ex
            ),
          }
        : null
    );
  }, []);

  const finishWorkout = useCallback(async () => {
    if (!session || session.exercises.length === 0) return;
    await finishSession(session);
    setSession(createEmptySession());
  }, [session]);

  const clearWorkout = useCallback(async () => {
    await clearSession();
    setSession(createEmptySession());
  }, []);

  const saveCurrentAsTemplate = useCallback(async (name: string) => {
    if (!session || session.exercises.length === 0) return;

    const template: Template = {
      id: generateId(),
      name,
      exerciseNames: session.exercises.map((ex) => ex.name),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await saveTemplate(template);
    setTemplates((prev) => [template, ...prev]);
  }, [session]);

  /** Rename a template in place (Phase 13). */
  const renameTemplate = useCallback(async (id: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const existing = templates.find((t) => t.id === id);
    if (!existing) return;
    const updated: Template = { ...existing, name: trimmed, updatedAt: Date.now() };
    await saveTemplate(updated);
    setTemplates((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }, [templates]);

  /** Delete a template permanently (Phase 13). */
  const removeTemplate = useCallback(async (id: string) => {
    await deleteTemplate(id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const startFromTemplate = useCallback(async (template: Template) => {
    // Create new empty session with template name
    const newSession: WorkoutSession = {
      id: generateId(),
      exercises: [],
      startedAt: Date.now(),
      updatedAt: Date.now(),
    };

    // For each exercise name, fetch previous performance and create exercise with previousSets
    const exercisesWithHistory = await Promise.all(
      template.exerciseNames.map(async (name) => {
        const previousSets = await getPreviousPerformance(name);
        return {
          id: generateId(),
          name,
          sets: [],
          previousSets: previousSets.length > 0 ? previousSets : undefined,
        };
      })
    );

    newSession.exercises = exercisesWithHistory;

    // Update template lastUsedAt
    const updatedTemplate = { ...template, lastUsedAt: Date.now() };
    await saveTemplate(updatedTemplate);
    setTemplates((prev) =>
      prev.map((t) => (t.id === template.id ? updatedTemplate : t))
    );

    setSession(newSession);
  }, []);

  const totalSets = session?.exercises.reduce((sum, ex) => sum + ex.sets.length, 0) ?? 0;

  return {
    session,
    exercises: session?.exercises ?? [],
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
    reorderExercise,
    swapExercise,
    finishWorkout,
    clearWorkout,
    saveCurrentAsTemplate,
    renameTemplate,
    removeTemplate,
    startFromTemplate,
    totalSets,
  };
}