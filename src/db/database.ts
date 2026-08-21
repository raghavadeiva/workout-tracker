import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { EXERCISE_VECTORS } from '../features/recommendations/exerciseVectors';

export interface WorkoutSession {
  id: string;
  exercises: Exercise[];
  startedAt: number;
  updatedAt: number;
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
  const tx = db.transaction(['history', 'activeSession'], 'readwrite');
  await tx.objectStore('history').put(session);
  await tx.objectStore('activeSession').delete('current');
  await tx.done;
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
  }, 'prefs');
}

export async function loadAvailableEquipment(): Promise<string[]> {
  const db = await getDB();
  const prefs = await db.get('settings', 'prefs');
  return prefs?.availableEquipment ?? [];
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
 * Seeds the recommendations store with exercise vectors from exerciseVectors.ts.
 * Called on app init; idempotent (put overwrites existing entries).
 */
export async function seedExerciseEmbeddings(): Promise<void> {
  const embeddings: ExerciseEmbedding[] = [];
  for (const [name, vector] of Object.entries(EXERCISE_VECTORS)) {
    embeddings.push({
      exerciseId: name,
      vector: Array.from(vector),
      metadata: {
        muscleGroups: getMuscleGroupsFromVector(vector),
        equipment: getEquipmentFromVector(vector),
        movementPattern: getMovementPatternFromVector(vector),
        difficulty: 3, // default medium; could be expanded later
      },
    });
  }
  const db = await getDB();
  const tx = db.transaction('recommendations', 'readwrite');
  for (const emb of embeddings) {
    await tx.objectStore('recommendations').put(emb);
  }
  await tx.done;
}

/** Extracts active muscle group dimension names from a vector. */
function getMuscleGroupsFromVector(vector: Float32Array): string[] {
  const muscleIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const muscleNames = ['chest', 'upperBack', 'shoulders', 'quads', 'hamstrings', 'glutes', 'triceps', 'biceps', 'calves', 'abs'];
  return muscleIndices
    .filter((i) => vector[i] > 0)
    .map((i) => muscleNames[i]);
}

/** Extracts active equipment dimension names from a vector. */
function getEquipmentFromVector(vector: Float32Array): string[] {
  const equipIndices = [10, 11, 12, 13];
  const equipNames = ['barbell', 'dumbbell', 'machine', 'bodyweight'];
  return equipIndices
    .filter((i) => vector[i] > 0)
    .map((i) => equipNames[i]);
}

/** Extracts active movement pattern dimension names from a vector. */
function getMovementPatternFromVector(vector: Float32Array): string {
  const patternIndices = [14, 15, 16, 17, 18, 19];
  const patternNames = ['push', 'pull', 'hinge', 'squat', 'lunge', 'carry'];
  const active = patternIndices
    .filter((i) => vector[i] > 0)
    .map((i) => patternNames[i]);
  return active.join('/') || 'compound';
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
