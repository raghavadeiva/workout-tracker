# Workout Tracker - ARCHITECTURE.md

## Product Goals

Build a lightweight, mobile-first workout tracking application inspired by Setgraph. The core principle is **FAST, LOW-FRICTION WORKOUT LOGGING**.

### Core Features (Planned)
1. **Workout Sessions** - Start, track, and complete workout sessions
2. **Exercise Selection** - Pick exercises from a library or create custom ones
3. **Set Logging** - Log weight and reps for each set with minimal taps
4. **Auto-Population** - Previous set's weight/reps auto-filled for speed
5. **Rest Timer** - Automatic rest timer after completing a set
6. **Workout History** - Browse past sessions with summary stats
7. **Exercise History** - View progression for a specific exercise over time
8. **Epley 1RM** - Estimated 1-rep max calculated automatically
9. **Progress Charts** - Visualize strength trends (Recharts)
10. **Offline-First** - Fully functional without network
11. **Persistent Local Data** - IndexedDB storage
12. **Installable PWA** - Add to Home Screen on iOS Safari
13. **Workout Templates** - Save/load named templates, previous set pre-fill
14. **Exercise Recommendations** - Vector-based substitution suggestions (Phase 9)
15. **Weekly Volume Tracking** - Fractional muscle group volume aggregation (Phase 10)

---

## Architecture Principles

### PWA, Fully Local, No Backend
- **Progressive Web App** - Service worker, manifest, installable
- **100% Client-Side** - No server, no API, no authentication
- **All Data On-Device** - IndexedDB only, never leaves the browser
- **No Cloud Sync** - Not in scope (future consideration only)
- **No External Dependencies at Runtime** - Works offline after first load

### Mobile-First Design
- **Touch-Optimized** - Large tap targets (>=44px), thumb-friendly layout
- **Portrait Primary** - Designed for iPhone portrait; landscape graceful
- **Safe Area Insets** - Respect notch/home indicator via CSS env()
- **Minimal Scrolling** - Key actions visible without scroll
- **Fast Interactions** - Optimistic UI, no blocking loads
- **PWA Install Flow** - Native-like "Add to Home Screen" experience

### React + TypeScript Conventions
- **Function Components Only** - No class components
- **Strict TypeScript** - `strict: true`, no `any` without justification
- **Colocated Types** - Types live near components that use them
- **Custom Hooks for Logic** - Extract stateful logic into `useX` hooks
- **Compound Components** - For complex UI (e.g., Select, Modal)
- **CSS-in-JS via Tailwind** - Utility-first, no CSS modules/styled-components
- **React 18+ Features** - Concurrent features, Suspense where appropriate

### Planned Data-Layer Architecture (IndexedDB)
```
Components -> Custom Hooks -> Service Layer (Repository) -> IndexedDB
```
- **Components NEVER touch IndexedDB directly**
- **Service Layer** (`src/db/services/`) - One service per entity (Workout, Exercise, Set)
- **Repository Pattern** - CRUD + query methods, returns typed DTOs
- **Schema Versioning** - Migration strategy from day one
- **Idempotent Writes** - Safe to retry, handles duplicate detection
- **Optimistic Reads** - Cache in memory, sync on visibility change

### Dependency Rules
| Category | Allowed | Forbidden |
|----------|---------|-----------|
| **Runtime** | React, ReactDOM, Tailwind, Recharts (Phase 5), idb (Phase 2) | Firebase, Supabase, axios, redux, zustand, mobx |
| **Dev** | Vite, TypeScript, ESLint, Prettier, Vitest, Playwright | webpack, babel (direct), jest (prefer Vitest) |
| **UI** | Headless UI / Radix (if needed), lucide-react (icons) | material-ui, chakra, antd, bootstrap |

### Testing Requirements
- **Unit Tests** - Vitest for hooks, utilities, services (Phase 2+)
- **Component Tests** - React Testing Library for complex components
- **E2E Tests** - Playwright for critical flows (Phase 6+)
- **Coverage Target** - >=80% for services/hooks, >=60% overall
- **Run on CI** - All tests must pass before merge

### Error Handling Requirements
- **Graceful Degradation** - App works even if IndexedDB unavailable (memory fallback)
- **User-Facing Errors** - Toast/notification, never alert()
- **Error Boundaries** - Wrap feature routes, not whole app
- **Structured Errors** - Custom error classes with codes for i18n later
- **Logging** - Console in dev, no-op in prod (no external logging service)

---

## Critical Architectural Constraints (Learned in Production)

### waR: iOS Safari Touch Bug
**NEVER use fixed modal overlays with scrollable content for interactive lists.**
- The `ExerciseSelector` **must remain a conditional full-page render swap** (early return pattern).
- Fixed `inset-0 z-50` modals with `overflow-y-auto` silently swallow tap events on iOS Safari.
- Pattern: `if (showSelector) return <ExerciseSelector />` — NOT portal/overlay.

### waR: ID Generation
**Do NOT use `crypto.randomUUID()`** — it crashes on unencrypted local IP networks (http://10.x.x.x).
- Use the custom `generateId()` function: `Date.now().toString(36) + Math.random().toString(36).substring(2)`
- Defined in `src/db/database.ts` and exported for all consumers.

### waR: Database Schema
**IndexedDB via `idb` wrapper — Database: `WorkoutDB`**
- Current version: **v3** (added `templates` store)
- Stores:
  - `activeSession` (key: `'current'`)
  - `settings` (key: `'prefs'`)
  - `history` (keyPath: `id`, index: `by-date` on `startedAt`)
  - `templates` (keyPath: `id`, indexes: `by-name`, `by-last-used`)
- Migrations handled in `upgrade` callback of `openDB`.

### waR: React Rules of Hooks
**Always initialize hooks at the very top of the component, before any conditional returns.**
```tsx
const { ... } = useWorkoutSession();     // 1. Unconditional
const timerProps = useRestTimer();        // 2. Unconditional
const [showSelector, ...] = useState();   // 3. Unconditional
const handleAddExercise = useCallback();  // 4. Unconditional
if (isLoading) return <Spinner />;        // Early returns AFTER all hooks
if (showSelector) return <Selector />;
```

### waR: Template Architecture
**Explicit "Save as Template" — NOT silent history scraping.**
- Users must deliberately click "Save Active Workout as Template"
- Templates are first-class entities in `templates` store (separate from `history`)
- Starting from template copies exercises into active session (no history linkage)
- Previous set pre-fill reads from `history` store (last session per exercise)

---

## Phase 9 — Vector-Based Recommendation Engine

### waR: Recommendation Engine Architecture

**100% Client-Side Recommendation Engine — Pure Cosine Similarity for Exercise Substitution Vectors**

- **No external API calls** — all vector math and similarity ranking computed in-browser
- **No remote model loading** — embedding vectors stored locally in service layer
- **Pure Cosine Similarity** — the sole similarity metric for exercise substitution ranking
- Formula: `cosineSimilarity(a, b) = dot(a, b) / (||a|| * ||b||)`
- Result: angle-based similarity in [-1, 1], where 1 = identical direction

### Vector Embedding Schema
Each exercise is represented as a fixed-length embedding vector comprising:
- Primary muscle group activation (one-hot or weighted scalar)
- Secondary muscle group activation (one-hot or weighted scalar)
- Equipment type (one-hot encoded)
- Movement pattern (push/pull/hinge/lunge/squat/carry — one-hot)
- Difficulty tier (scalar 1-5)
- Exercise category (compound/isolation — one-hot)

Vectors are stored as typed arrays (`Float32Array`) in the service layer (`src/features/recommendations/`).

### Recommendation Flow
1. User completes an exercise or selects an exercise for substitution
2. Embedding vector retrieved for the target exercise
3. Cosine similarity computed against all candidate exercises in the library
4. Candidates filtered by available equipment (context-aware)
5. Top-N results ranked by similarity score, returned to UI

### Data Storage
- Database Schema v4: `recommendations` store
  ```
  recommendations: { key: exerciseId, value: { vector: Float32Array, metadata: { muscleGroups[], equipment[], movementPattern, difficulty } } }
  ```
- Migration v3 -> v4 in `upgrade` callback

### Performance
- Vectors memoized on exercise set changes
- Similarity cache invalidated only when library or equipment filters change
- No blocking the main thread (pure JS math, ~100 exercises, sub-millisecond)

### Files
```
src/features/recommendations/
  vectorUtils.ts       # dot product, magnitude, cosine similarity
  exerciseVectors.ts   # embedding vectors per exercise
  RecommendationService.ts  # ranking + filtering logic
  useRecommendations.ts     # reactive hook
```

### Plateau Detection

**Plateau Detection via Epley 1RM Stagnation**

- A plateau is detected when there is **<= 0 growth** in Epley 1RM over the **last 3 logged sessions** of a given exercise
- Detection window: exactly 3 most recent completed sessions (by `startedAt` descending)
- Growth threshold: `(current1RM - oldest1RM) <= 0` => plateau flagged
- Epley formula: `1RM = weight * (1 + reps/30)` computed per top set per session
- Plateau flag surfaced in analytics view and exercise detail view

### Files
```
src/features/analytics/
  plateauDetection.ts   # detectPlateau(exerciseId, lastNSessions=3) -> boolean
  usePlateauDetection.ts # reactive hook, returns { isPlateaued, sessionsAnalyzed, growthRate }
```

---

## Phase 10 — Weekly Volume Load Tracking (Scopped)

### waR: Volume Multipliers & Muscle Activation Maps

**Aggregate historical set volume weekly using weighted multi-dimensional muscle activation maps**

- Each exercise maps to a set of muscle groups with **fractional multipliers** (e.g., Bench Press = `{ chest: 1.0, triceps: 0.5, anteriorDeltoid: 0.25 }`)
- Multipliers represent the proportional volume contribution of each muscle group per set
- Weekly volume = sum of `sets * reps * weight * muscleMultiplier` bucketed by week
- Weeks bucketed by ISO week (Monday-Sunday) via `date-fns`

### Muscle Activation Map Source
- Stored in exercise metadata in the service layer
- Multiplier scale: 0.0 (not involved) to 1.0 (primary mover)
- Multi-dimensional: chest, back, shoulders, quads, hamstrings, glutes, arms (biceps/triceps/brachialis), calves, abs

### Weekly Volume Aggregation Flow
1. Fetch all historical sets for a muscle group (or all muscle groups)
2. For each set: `volume = sets * reps * weight * muscleMultiplier`
3. Bucket sets by week (date -> ISO week)
4. Sum volume per muscle group per week
5. Return time-series: `{ week: string, chest: number, back: number, ... }[]`

### Database Schema v5 (Future — Phase 10)
```
volumeMetadata: { key: exerciseId, value: { muscleMultipliers: Record<string, number> } }
```
- Migration v4 -> v5 in `upgrade` callback

### Files
```
src/features/volume/
  muscleMaps.ts         # exercise -> muscle multiplier maps
  volumeUtils.ts        # calculateWeeklyVolume, volumeByMuscleGroup, aggregateVolumePerWeek
  useWeeklyVolume.ts    # reactive hook returning weekly time-series
```

### Output Rules

**Output Rules for Volume & Plateau Data**
- Volume time-series data exposed as typed DTOs from service layer (no raw IndexedDB access in components)
- Plateau detection results consumed by analytics hooks only
- All volume multipliers defined in service layer, injected via `useWeeklyVolume` hook
- No volume or plateau data rendered without user-initiated exercise selection (avoids surprise data load)
- Charts in `src/features/analytics/` consume aggregated DTOs, not raw sets

---

## Development Rules

### 1. Inspect Before Modify
Before editing any file, **read it first**. Understand existing patterns, imports, and conventions. Do not assume.

### 2. No Unrelated Rewrites
Only change files directly related to the task. Do not reformat, reorganize, or "clean up" unrelated code. Style fixes belong in dedicated PRs.

### 3. Keep the App Buildable
After every change, the project must:
- `npm run build` -> **exit code 0**
- `npm run dev` -> **starts without error**
- TypeScript `tsc --noEmit` -> **no errors**

If a change breaks the build, fix it immediately or revert.

### 4. Incremental Commits
Each logical step = one commit. Message format: `feat(scope): description` / `fix(scope): description` / `refactor(scope): description`

---

## Phase Gates

| Phase | Gate |
|-------|------|
| 0 Foundation | `npm run build` ✓, `npm run dev -- --host` ✓, ARCHITECTURE.md ✓, PROJECT_PLAN.md ✓ |
| 1 Core UI | Workout session flow works in-memory, no console errors |
| 2 IndexedDB | Data persists across reloads, migrations work |
| 3 History | Can browse sessions & exercises, 1RM calculates correctly |
| 4 Rest Timer | Timer runs in background, respects tab visibility |
| 5 Analytics | Charts render, responsive, no layout shift |
| 6 PWA | Lighthouse PWA score >=90, installs on iOS Safari |
| 8 Templates | Templates save/load, previous sets pre-fill, no modal overlays |
| 9 Recommendations | Cosine similarity vectors computed client-side, exercise suggestions render |
| 10 Volume Tracking | Weekly volume aggregates correctly, fractional muscle multipliers applied |
| 7 Deploy | Static site serves on Netlify/Vercel/GitHub Pages, HTTPS, cache headers correct |
