import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import {
  EXERCISE_LIBRARY,
  VECTOR_DIMENSIONS,
} from '../features/recommendations/exerciseVectors';

export interface WorkoutSession {
  id: string;
  exercises: Exercise[];
  startedAt: number;
  updatedAt: number;
  /**
   * Epoch ms stamped exactly once by finishSession(). The authoritative end
   * of the workout for duration display — `updatedAt` is mutated by
   * autosaves and cannot be trusted as a finish time.
   */
  finishedAt?: number;
  /** Unit active when the workout was finished (used by WorkoutDetail). */
  weightUnit?: WeightUnit;
  name?: string;
}

export interface SetEntry {
  id: string;
  setNumber: number;
  weight: number;
  reps: number;
  completedAt: number;
}

export interface Exercise {
  id: string;
  name: string;
  sets: SetEntry[];
  previousSets?: SetEntry[];
}

export type WeightUnit = 'lbs' | 'kg';

export interface UserSettings {
	weightUnit: WeightUnit;
	availableEquipment: string[]; // equipment the user has access to
	favoriteExercises?: string[]; // starred exercises, shown first in the picker
}

export interface Template {
  id: string;
  name: string;
  exerciseNames: string[];
  createdAt: number;
  updatedAt: number;
  lastUsedAt?: number;
}

export interface ExerciseEmbedding {
  exerciseId: string;
  vector: number[];
  metadata: {
    muscleGroups: string[];
    equipment: string[];
    movementPattern: string;
    difficulty: number;
  };
}

/**
 * Persisted rest-timer state (schema v6).
 * Stored as an ABSOLUTE end timestamp so background time counts correctly:
 * remaining = endsAt - Date.now(), regardless of interval throttling.
 */
export interface RestTimerRecord {
  endsAt: number; // absolute epoch ms
  duration: number; // original total seconds (for progress display)
  running: boolean;
}

interface WorkoutDBSchema extends DBSchema {
  activeSession: {
    key: string;
    value: WorkoutSession;
  };
  settings: {
    key: string;
    value: UserSettings;
  };
  history: {
    key: string;
    value: WorkoutSession;
    indexes: { 'by-date': number };
  };
  templates: {
    key: string;
    value: Template;
    indexes: { 'by-name': string; 'by-last-used': number };
  };
  recommendations: {
    key: string;
    value: ExerciseEmbedding;
    indexes: { 'by-exercise': string };
  };
  timerState: {
    key: string;
    value: RestTimerRecord;
  };
}

const DB_NAME = 'WorkoutDB';
// v5 skipped (was reserved for volumeMetadata, never built). v6 adds timerState.
const DB_VERSION = 6;

let dbInstance: IDBPDatabase<WorkoutDBSchema> | null = null;

export async function getDB(): Promise<IDBPDatabase<WorkoutDBSchema>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<WorkoutDBSchema>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (!db.objectStoreNames.contains('activeSession')) {
        db.createObjectStore('activeSession');
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings');
      }
      if (oldVersion < 2) {
        if (!db.objectStoreNames.contains('history')) {
          const historyStore = db.createObjectStore('history', { keyPath: 'id' });
          historyStore.createIndex('by-date', 'startedAt');
        }
      }
      if (oldVersion < 3) {
        if (!db.objectStoreNames.contains('templates')) {
          const templateStore = db.createObjectStore('templates', { keyPath: 'id' });
          templateStore.createIndex('by-name', 'name');
          templateStore.createIndex('by-last-used', 'lastUsedAt');
        }
      }
      if (oldVersion < 4) {
        if (!db.objectStoreNames.contains('recommendations')) {
          const recStore = db.createObjectStore('recommendations', { keyPath: 'exerciseId' });
          recStore.createIndex('by-exercise', 'exerciseId');
        }
      }
      if (oldVersion < 6) {
        if (!db.objectStoreNames.contains('timerState')) {
          db.createObjectStore('timerState');
        }
      }
    },
  });

  return dbInstance;
}

export async function saveSession(session: WorkoutSession): Promise<void> {
  const db = await getDB();
  await db.put('activeSession', session, 'current');
}

export async function loadSession(): Promise<WorkoutSession | null> {
  const db = await getDB();
  const session = await db.get('activeSession', 'current');
  return session ?? null;
}

export async function clearSession(): Promise<void> {
  const db = await getDB();
  await db.delete('activeSession', 'current');
}

export async function finishSession(session: WorkoutSession): Promise<void> {
  const db = await getDB();
  const finishedAt = Date.now();
  // Stamp the authoritative end time on the stored record (never mutated
  // afterwards, unlike updatedAt which autosaves touch).
  const finished: WorkoutSession = { ...session, finishedAt };
  const tx = db.transaction(['history', 'activeSession'], 'readwrite');
  await tx.objectStore('history').put(finished);
  await tx.objectStore('activeSession').delete('current');
  await tx.done;
  // Root-cause fix for "saved workouts not visible in history": History,
  // Analytics, and volume hooks live on permanent display:none panes that
  // mounted (and fetched) once at app open. They now subscribe here and
  // refetch when history actually changes.
  notifyHistoryChanged();
}

// ─── History change notifications ─────────────────────────────

const historyListeners = new Set<() => void>();

/**
 * Subscribes to history mutations. Returns an unsubscribe function.
 * Listeners fire after finishSession commits (fire-and-forget refresh
 * trigger for UI surfaces that read getHistory()).
 */
export function onHistoryChanged(listener: () => void): () => void {
  historyListeners.add(listener);
  return () => {
    historyListeners.delete(listener);
  };
}

function notifyHistoryChanged(): void {
  for (const listener of historyListeners) listener();
}

export async function getHistory(): Promise<WorkoutSession[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('history', 'by-date');
  return all.sort((a, b) => b.startedAt - a.startedAt); // Sorts newest-first
}

export async function getPreviousPerformance(exerciseName: string): Promise<SetEntry[]> {
  // FIX: Use getHistory() so the array is already sorted newest-first!
  const history = await getHistory();
  
  // Now searching from most recent to oldest actually works
  for (const session of history) {
    const exercise = session.exercises.find((ex) => ex.name === exerciseName);
    if (exercise && exercise.sets.length > 0) {
      return exercise.sets;
    }
  }
  return [];
}

export async function saveTemplate(template: Template): Promise<void> {
  const db = await getDB();
  await db.put('templates', template);
}

export async function getTemplates(): Promise<Template[]> {
  const db = await getDB();
  // FIX (Phase 13): previously queried the 'by-last-used' index, but IndexedDB
  // excludes records whose index key is undefined — freshly created templates
  // have no lastUsedAt yet, so they vanished after reload ("template save not
  // persistent"). getAll() + JS sort includes every record unconditionally.
  const all = await db.getAll('templates');
  return all.sort(
    (a, b) => (b.lastUsedAt ?? 0) - (a.lastUsedAt ?? 0) || b.createdAt - a.createdAt
  );
}

export async function deleteTemplate(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('templates', id);
}

export async function saveWeightUnit(unit: WeightUnit): Promise<void> {
  const db = await getDB();
  // Preserve availableEquipment if it exists
  const existing = await db.get('settings', 'prefs');
  await db.put('settings', {
    weightUnit: unit,
    availableEquipment: existing?.availableEquipment ?? [],
    favoriteExercises: existing?.favoriteExercises ?? [],
  }, 'prefs');
}

export async function loadWeightUnit(): Promise<WeightUnit> {
  const db = await getDB();
  const prefs = await db.get('settings', 'prefs');
  return prefs?.weightUnit ?? 'lbs';
}

export async function saveAvailableEquipment(equipment: string[]): Promise<void> {
  const db = await getDB();
  const existing = await db.get('settings', 'prefs');
  await db.put('settings', {
    weightUnit: existing?.weightUnit ?? 'lbs',
    availableEquipment: equipment,
    favoriteExercises: existing?.favoriteExercises ?? [],
  }, 'prefs');
}

export async function loadAvailableEquipment(): Promise<string[]> {
  const db = await getDB();
  const prefs = await db.get('settings', 'prefs');
  return prefs?.availableEquipment ?? [];
}

// ─── Favorite Exercises (Phase 14.1) ─────────────────────────

/** Returns the user's favorited exercise names (empty array if none). */
export async function loadFavoriteExercises(): Promise<string[]> {
  const db = await getDB();
  const prefs = await db.get('settings', 'prefs');
  return prefs?.favoriteExercises ?? [];
}

/**
 * Toggles one exercise's favorite status and persists the new list.
 * Returns the updated favorites array.
 */
export async function toggleFavoriteExercise(name: string): Promise<string[]> {
  const db = await getDB();
  const prefs = await db.get('settings', 'prefs');
  const current = prefs?.favoriteExercises ?? [];
  const next = current.includes(name)
    ? current.filter((n) => n !== name)
    : [...current, name];
  await db.put('settings', {
    weightUnit: prefs?.weightUnit ?? 'lbs',
    availableEquipment: prefs?.availableEquipment ?? [],
    favoriteExercises: next,
  }, 'prefs');
  return next;
}

// ─── Rest Timer Persistence (schema v6) ──────────────────────

const TIMER_KEY = 'active';

export async function saveTimerState(record: RestTimerRecord): Promise<void> {
  const db = await getDB();
  await db.put('timerState', record, TIMER_KEY);
}

export async function loadTimerState(): Promise<RestTimerRecord | null> {
  const db = await getDB();
  const record = await db.get('timerState', TIMER_KEY);
  return record ?? null;
}

export async function clearTimerState(): Promise<void> {
  const db = await getDB();
  await db.delete('timerState', TIMER_KEY);
}

export async function saveExerciseEmbedding(embedding: ExerciseEmbedding): Promise<void> {
  const db = await getDB();
  await db.put('recommendations', embedding);
}

export async function getExerciseEmbedding(exerciseId: string): Promise<ExerciseEmbedding | null> {
  const db = await getDB();
  const embedding = await db.get('recommendations', exerciseId);
  return embedding ?? null;
}

export async function getAllExerciseEmbeddings(): Promise<ExerciseEmbedding[]> {
  const db = await getDB();
  return await db.getAll('recommendations');
}

/**
 * Seeds the recommendations store with exercise vectors from the generated
 * 873-exercise library (Phase 14).
 *
 * Version-gated: seeds only when the stored seed version differs from the
 * library's, so the 873-record write happens once per dataset change — not
 * every app load.
 *
 * Idempotent (put overwrites existing entries). Old-schema entries for
 * exercises no longer present are left in place but never queried by the
 * vector engine (which reads from the in-memory library), so they are harmless.
 */
const SEED_VERSION_KEY = 'seed-version';
let seedPromise: Promise<void> | null = null;

export async function seedExerciseEmbeddings(): Promise<void> {
  // Coalesce concurrent calls (multiple components mounting at once)
  if (!seedPromise) {
    seedPromise = doSeed();
  }
  return seedPromise;
}

async function doSeed(): Promise<void> {
  const db = await getDB();
  const currentVersion = `v2-${EXERCISE_LIBRARY.length}`;

  // Seed marker lives in the recommendations store itself under a reserved
  // key (the settings store is strictly typed to UserSettings).
  const marker = await db.get('recommendations', SEED_VERSION_KEY);
  if ((marker as { version?: string } | undefined)?.version === currentVersion) {
    return; // up to date
  }

  const tx = db.transaction('recommendations', 'readwrite');
  for (const rec of EXERCISE_LIBRARY) {
    await tx.objectStore('recommendations').put({
      exerciseId: rec.id,
      vector: rec.vector,
      metadata: {
        muscleGroups: getMuscleGroupsFromVector(rec.vector),
        equipment: getEquipmentFromRecord(rec),
        movementPattern: 'compound', // not encoded in the new schema
        difficulty: levelToDifficulty(rec.level),
      },
    });
  }
  await tx.objectStore('recommendations').put(
    {
      exerciseId: SEED_VERSION_KEY,
      vector: [],
      metadata: { version: currentVersion },
    } as unknown as ExerciseEmbedding
    // NOTE: no explicit key argument — 'recommendations' has keyPath
    // 'exerciseId' (in-line keys), so passing one throws DataError and
    // aborts the whole seed transaction (all 873 writes rolled back,
    // re-seeded + errored on every app load).
  );
  await tx.done;
}

/** Maps dataset level strings to the 1–5 difficulty scale. */
function levelToDifficulty(level: string): number {
  switch (level?.toLowerCase()) {
    case 'beginner':
      return 1;
    case 'intermediate':
      return 3;
    case 'expert':
      return 5;
    default:
      return 3;
  }
}

/** Collects the record's raw equipment string into metadata. */
function getEquipmentFromRecord(rec: {
  equipment: string;
}): string[] {
  return rec.equipment ? [rec.equipment] : [];
}

/** Extracts active muscle-group dimension names from a vector. */
function getMuscleGroupsFromVector(vector: number[]): string[] {
  return VECTOR_DIMENSIONS.filter((_, i) => (vector[i] ?? 0) > 0);
}

export const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

export function createEmptySession(): WorkoutSession {
  return {
    id: generateId(),
    exercises: [],
    startedAt: Date.now(),
    updatedAt: Date.now(),
  };
}
