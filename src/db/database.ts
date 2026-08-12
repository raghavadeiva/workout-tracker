import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

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

export interface Template {
  id: string;
  name: string;
  exerciseNames: string[];
  createdAt: number;
  updatedAt: number;
  lastUsedAt?: number;
}

interface WorkoutDBSchema extends DBSchema {
  activeSession: {
    key: string;
    value: WorkoutSession;
  };
  settings: {
    key: string;
    value: { weightUnit: WeightUnit };
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
}

const DB_NAME = 'WorkoutDB';
const DB_VERSION = 3;

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
  const templates = await db.getAllFromIndex('templates', 'by-last-used');
  return templates.sort((a, b) => (b.lastUsedAt ?? 0) - (a.lastUsedAt ?? 0));
}

export async function deleteTemplate(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('templates', id);
}

export async function saveWeightUnit(unit: WeightUnit): Promise<void> {
  const db = await getDB();
  await db.put('settings', { weightUnit: unit }, 'prefs');
}

export async function loadWeightUnit(): Promise<WeightUnit> {
  const db = await getDB();
  const prefs = await db.get('settings', 'prefs');
  return prefs?.weightUnit ?? 'lbs';
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
