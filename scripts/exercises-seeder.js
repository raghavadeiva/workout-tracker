#!/usr/bin/env node
/**
 * exercises-seeder.js — Phase 14 data seeder
 * ─────────────────────────────────────────────────────────────
 * Reads the raw exercise dataset (exercises.json) and transforms each record
 * into a 20-dimensional muscle-activation vector plus its metadata, then
 * writes the result to src/features/recommendations/exerciseVectors.ts.
 *
 * Vector Construction Rules (per spec):
 *   1. Start with all 20 dimensions at 0.0.
 *   2. primaryMuscles  → 1.0 at that muscle's index.
 *   3. secondaryMuscles → 0.5 at that muscle's index.
 *
 * Usage:
 *   node scripts/exercises-seeder.js [input.json] [output.ts]
 *
 * Defaults:
 *   input:  ./exercises.json   (repo root)
 *   output: ./src/features/recommendations/exerciseVectors.ts
 *
 * NOTE: The output overwrites the current hand-authored exerciseVectors.ts,
 * which also exports getRecommendations()/getAllExerciseNames() used by the
 * app. This script writes the DATA portion only; run it, then re-add (or
 * keep in a separate file) the query helpers. See "Integration notes" at the
 * bottom of this file before running against the live codebase.
 */

'use strict';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─────────────────────────────────────────────────────────────
// SCHEMA — the 20 muscle-group slots.
//
// The raw dataset contains exactly 17 distinct muscle names. Slots 0–16 map
// them alphabetically for determinism; slots 17–19 are intentionally unused
// spares (0.0 for every exercise) so you can add groups later without
// changing the vector width (e.g., "heart", "full body", "grip").
//
// Adjust this list and re-run the seeder if your schema changes — every
// downstream consumer reads MUSCLE_DIMENSIONS from the generated file.
// ─────────────────────────────────────────────────────────────
const MUSCLE_DIMENSIONS = [
  'abdominals',   // 0
  'abductors',    // 1
  'adductors',    // 2
  'biceps',       // 3
  'calves',       // 4
  'chest',        // 5
  'forearms',     // 6
  'glutes',       // 7
  'hamstrings',   // 8
  'lats',         // 9
  'lower back',   // 10
  'middle back',  // 11
  'neck',         // 12
  'quadriceps',   // 13
  'shoulders',    // 14
  'traps',        // 15
  'triceps',      // 16
  // ── spare slots (reserved, always 0.0 until assigned) ──
  'spare_17',     // 17
  'spare_18',     // 18
  'spare_19',     // 19
];

const PRIMARY_MULTIPLIER = 1.0;
const SECONDARY_MULTIPLIER = 0.5;

/** muscle name → vector index lookup built from the schema above */
const MUSCLE_INDEX = Object.fromEntries(
  MUSCLE_DIMENSIONS.map((name, idx) => [name.toLowerCase(), idx])
);

// ─────────────────────────────────────────────────────────────
// Vector construction
// ─────────────────────────────────────────────────────────────

/**
 * Build a 20-dim activation vector for one exercise.
 *
 * @param {string[]} primaryMuscles   muscles worked as primary movers  → 1.0
 * @param {string[]} secondaryMuscles muscles worked as stabilizers/etc → 0.5
 * @returns {number[]} fixed-length array of floats
 */
function buildVector(primaryMuscles, secondaryMuscles) {
  // Rule 1: fixed-width zero vector
  const vector = new Array(MUSCLE_DIMENSIONS.length).fill(0.0);

  // Rule 2: primary movers → 1.0
  for (const muscle of primaryMuscles ?? []) {
    const idx = MUSCLE_INDEX[String(muscle).toLowerCase()];
    if (idx !== undefined) {
      vector[idx] = PRIMARY_MULTIPLIER;
    } else {
      console.warn(`  ⚠ unknown primary muscle "${muscle}" — skipped`);
    }
  }

  // Rule 3: secondary muscles → 0.5 (never overwrites a 1.0 primary)
  for (const muscle of secondaryMuscles ?? []) {
    const idx = MUSCLE_INDEX[String(muscle).toLowerCase()];
    if (idx !== undefined && vector[idx] === 0.0) {
      vector[idx] = SECONDARY_MULTIPLIER;
    }
  }

  return vector;
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────
function main() {
  const [, , inputArg, outputArg] = process.argv;
  const root = path.resolve(__dirname, '..');
  const inputPath = path.resolve(root, inputArg ?? 'exercises.json');
  const outputPath = path.resolve(
    root,
    outputArg ?? 'src/features/recommendations/exerciseVectors.generated.ts'
  );

  console.log(`Reading ${path.relative(root, inputPath)} …`);
  const raw = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  console.log(`${raw.length} raw exercises found.`);

  const seen = new Set();
  const skipped = [];
  const records = [];

  for (const ex of raw) {
    const id = ex.id ?? ex.name;
    if (!id || !ex.name) {
      skipped.push(ex);
      continue;
    }
    if (seen.has(id)) {
      console.warn(`  ⚠ duplicate id "${id}" — keeping first occurrence`);
      continue;
    }
    seen.add(id);

    records.push({
      id: String(id),
      name: String(ex.name),
      category: ex.category ?? '',
      level: ex.level ?? '',
      equipment: ex.equipment ?? '',
      vector: buildVector(ex.primaryMuscles, ex.secondaryMuscles),
    });
  }

  // Sort by name so the generated file diffs cleanly between runs
  records.sort((a, b) => a.name.localeCompare(b.name));

  // ── Emit TypeScript module ──
  const header = `/**
 * exerciseVectors.generated.ts — AUTO-GENERATED, DO NOT EDIT BY HAND
 *
 * Source: exercises.json via scripts/exercises-seeder.js
 * Regenerate: node scripts/exercises-seeder.js
 *
 * Schema: ${MUSCLE_DIMENSIONS.length}-dimensional muscle-activation vectors.
 * Dimensions: ${MUSCLE_DIMENSIONS.join(', ')}
 * Encoding:   primaryMuscles → 1.0 · secondaryMuscles → 0.5 · else 0.0
 */

export interface GeneratedExerciseVector {
  id: string;
  name: string;
  category: string;
  level: string;
  equipment: string;
  /** Fixed-length (${MUSCLE_DIMENSIONS.length}) float array of muscle activations. */
  vector: number[];
}

/** Dimension labels, index-aligned with every vector below. */
export const GENERATED_MUSCLE_DIMENSIONS: string[] = ${JSON.stringify(MUSCLE_DIMENSIONS)};

export const GENERATED_EXERCISE_VECTORS: GeneratedExerciseVector[] = [
`;

  const body = records
    .map((r) =>
      `  {\n` +
      `    id: ${JSON.stringify(r.id)},\n` +
      `    name: ${JSON.stringify(r.name)},\n` +
      `    category: ${JSON.stringify(r.category)},\n`      +
      `    level: ${JSON.stringify(r.level)},\n` +
      `    equipment: ${JSON.stringify(r.equipment)},\n` +
      `    vector: [\n` +
      chunk(r.vector.map((v) => v.toFixed(1)), 10)
        .map((line) => `      ${line},`)
        .join('\n') +
      `\n    ],\n` +
      `  },`
    )
    .join('\n');

  const footer = `\n];\n`;

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, header + body + footer, 'utf8');

  // ── Report ──
  console.log(`\nWrote ${records.length} exercise vectors → ${path.relative(root, outputPath)}`);
  console.log(`Skipped: ${skipped.length} malformed record(s).`);
  const nonZero = records.filter((r) => r.vector.some((v) => v > 0)).length;
  console.log(`Records with at least one active muscle: ${nonZero}/${records.length}`);
  console.log('\nIntegration notes:');
  console.log(' • This file is DATA ONLY. The app currently imports');
  console.log('   getRecommendations/getAllExerciseNames from exerciseVectors.ts.');
  console.log(' • Next step is wiring those helpers to read GENERATED_EXERCISE_VECTORS');
  console.log('   (cosine similarity over the new 20-dim schema).');
}

/** Join an array into comma-joined string chunks of `size`. */
function chunk(items, size) {
  const lines = [];
  for (let i = 0; i < items.length; i += size) {
    lines.push(items.slice(i, i + size).join(', '));
  }
  return lines;
}

main();
