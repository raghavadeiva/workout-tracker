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
- **CSS-in-JS via Tailwind v4** - Utility-first, no CSS modules/styled-components
- **React 18+ Features** - Concurrent features, Suspense where appropriate

### UI Design System (Phase 11 — Stitch-derived, light theme only)
- **Fonts**: Inter (Google Fonts, loaded in `index.html`) — no SF Pro/Barlow/system stacks
- **Icons**: Material Symbols Outlined via `src/components/MaterialIcon.tsx` (ligature names + FILL axis). lucide-react is NOT used.
- **Tokens**: defined in `@theme` block in `src/index.css` — surfaces (`app/card/sunken/sunken-high`), text tiers (`ink/secondary/tertiary/faint`), semantics (`blue/green/red/orange`)
- **Component classes**: `src/App.css` — `.card`, `.btn-primary`, `.btn-outline`, `.btn-finish`, `.segmented`, `.stepper-field`, `.material`, `.tnum`, `.row-sep`
- **Type scale utilities**: `.display-lg`, `.headline-sm`, `.body-md`, `.label-caps`, `.section-label`
- **waR: Tailwind v4 pipeline**: MUST use `@import "tailwindcss";` in index.css. The v3-style `@tailwind base/components/utilities` directives silently break the spacing scale (`px-5`, `p-4`, `gap-*` generate nothing while `.flex` still works). After any UI change, verify utilities exist in `dist/assets/*.css`.
- **waR: App.css must be imported** in `main.tsx` or its classes never ship.

### waR: Tab Navigation Architecture (bounce-free)
Each tab renders into a **permanent absolutely-positioned scroll pane** inside a positioned host; inactive panes get `display:none`.
- No unmount/remount on tab switch → zero layout shift, per-tab scroll position preserved
- Do NOT use `AnimatePresence mode="wait"` for tab content — it unmounts the outgoing tab and causes bounce
- Root uses `h-dvh` (not `100vh`) to avoid mobile browser chrome resize jumps

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
| **UI** | Headless UI / Radix (if needed), Material Symbols Outlined (icon font), framer-motion | material-ui, chakra, antd, bootstrap, lucide-react (removed in Phase 11) |

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
- Current version: **v6** (v4 added `recommendations`; v5 skipped — reserved for volumeMetadata, never built; v6 added `timerState`)
- Stores:
  - `activeSession` (key: `'current'`)
  - `settings` (key: `'prefs'`)
  - `history` (keyPath: `id`, index: `by-date` on `startedAt`)
  - `templates` (keyPath: `id`, indexes: `by-name`, `by-last-used`)
  - `recommendations` (keyPath: `exerciseId`, index: `by-exercise`)
  - `timerState` (key: `'active'`, value: `{ endsAt, duration, running }`)
- Migrations handled in `upgrade` callback of `openDB`.

### waR: Rest Timer Architecture (Phase 12)
**Timestamp-based, never interval-decremented.** The timer persists an absolute `endsAt` epoch-ms value; the display is always derived as `ceil((endsAt − Date.now())/1000)`.
- **Never** store a "seconds remaining" counter and decrement it on tick — browser background throttling makes that drift or freeze.
- Persisted to `timerState` (schema v6) on every start/adjust; restored on app mount. If restored after `endsAt` passed → show "Rest complete" briefly, clear the record.
- Lives in `RestTimerProvider` context at App level (`src/hooks/useRestTimer.tsx`) so it survives in-app tab switches; banner renders globally above all panes.
- Side effects at zero-crossing fire exactly once per run (`firedRef` guard): chime + haptics + Notification (only if `document.hidden` + permission granted).
- While running: `document.title` shows the countdown; `navigator.setAppBadge(remaining)` where supported; Wake Lock held while visible, released on hide/complete/stop.

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

### waR: IndexedDB Index Keys Must Never Be Undefined
**Index queries silently EXCLUDE records whose indexed property is `undefined`.** This caused the Phase 13 "template save not persistent" bug: `getTemplates()` queried the `by-last-used` index, but fresh templates have no `lastUsedAt` until first use — written to the store, invisible to the query.
- Rule: before querying a non-keyPath index, guarantee every record has that property defined at write time, **or** use `getAll()` + JS sort.
- `getTemplates()` now uses `getAll()` with `(lastUsedAt ?? 0)` sorting — keep it that way.
- Applies to any future store where an optional field is indexed.

### waR: SetInput Prefill Seeding
**Prefill state must be seeded synchronously at mount, not via effect resync.** `SetInput` is keyed by `` `${exerciseId}:${setCount}` `` in WorkoutSession so it remounts whenever the exercise or set count changes — local weight/reps state initializes from the correct exercise's data on first render. Do not remove the key or reintroduce an effect that copies `previousWeight/previousReps` into state on every prop change; that pattern lagged a frame behind and leaked values across exercises ("ghost bleeding").

---

## Phase 9 — Vector-Based Recommendation Engine

### waR: Recommendation Engine Architecture

**100% Client-Side Recommendation Engine — Pure Cosine Similarity for Exercise Substitution Vectors**

- **No external API calls** — all vector math and similarity ranking computed in-browser
- **No remote model loading** — embedding vectors stored locally in service layer
- **Pure Cosine Similarity** — the sole similarity metric for exercise substitution ranking
- Formula: `cosineSimilarity(a, b) = dot(a, b) / (||a|| * ||b||)`
- Result: angle-based similarity in [-1, 1], where 1 = identical direction
- **Vector dimension schema (20 dimensions)**: 10 muscle groups, 4 equipment types, 6 movement patterns
  - Muscle (0-9): chest, upperBack, shoulders, quads, hamstrings, glutes, triceps, biceps, calves, abs
  - Equipment (10-13): barbell, dumbbell, machine, bodyweight
  - Movement (14-19): push, pull, hinge, squat, lunge, carry

### Vector Embedding Schema
Each exercise is represented as a fixed-length 20-dimension embedding vector:
- Muscle Groups (0-9): chest, upperBack, shoulders, quads, hamstrings, glutes, triceps, biceps, calves, abs
- Equipment (10-13): barbell, dumbbell, machine, bodyweight
- Movement Patterns (14-19): push, pull, hinge, squat, lunge, carry

Values represent proportional activation/usage (0.0 to 1.0).

Vectors are stored as typed arrays (`Float32Array`) in the service layer (`src/features/recommendations/`).

### Recommendation Flow
1. User completes an exercise or selects an exercise for substitution
2. Embedding vector retrieved for the target exercise
3. Cosine similarity computed against all candidate exercises in the library
4. Candidates filtered by available equipment (context-aware)
5. Top-N results ranked by similarity score, returned to UI

### Data Storage
|- Vectors stored in code (`exerciseVectors.ts`) AND seeded to IndexedDB `recommendations` store (v4)
|- Database Schema v4 (IMPLEMENTED): `recommendations` store
  ```
  recommendations: { key: exerciseId, value: { vector: number[], metadata: { muscleGroups[], equipment[], movementPattern, difficulty } } }
  ```
- Migration v3 → v4 in `upgrade` callback in `database.ts`
- `saveExerciseEmbedding`, `getExerciseEmbedding`, `getAllExerciseEmbeddings`, `seedExerciseEmbeddings` functions in `database.ts`

### Performance
- Vectors memoized on exercise set changes
- Similarity cache invalidated only when library or equipment filters change
- No blocking the main thread (pure JS math, ~100 exercises, sub-millisecond)

### Files
```
src/features/recommendations/
  vectorUtils.ts            # dot product, magnitude, cosine similarity
  exerciseVectors.ts        # 20-dim embeddings, getRecommendations()
  useRecommendations.ts     # reactive hook with memoization + equipment filtering
  components/
    ExerciseSwap.tsx        # swap icon button + spring dropdown with alternatives
                            # (rendered in each exercise card header; lazy-fetches
                            # only while open; equipment filter from useWorkoutSession)
```
> Note: `EquipmentPreferences.tsx` was removed in Phase 11. Equipment selection state lives in
> `useWorkoutSession` (persisted to the `settings` store); ExerciseSwap consumes it via props.

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

## Phase 10 — Weekly Volume Load Tracking (Scoped)

### waR: Volume Multipliers & Muscle Activation Maps

**Aggregate historical set volume weekly using weighted multi-dimensional muscle activation maps**

- Each exercise maps to a set of muscle groups with **fractional multipliers** (e.g., Bench Press = `{ chest: 1.0, triceps: 0.5, anteriorDeltoid: 0.25 }`)
- Multipliers represent the proportional volume contribution of each muscle group per set
- Weekly volume = sum of `sets * reps * weight * muscleMultiplier` bucketed by week
- Weeks bucketed by ISO week (Monday-Sunday) via custom `getISOWeek()` in `volumeUtils.ts`

### Muscle Activation Map Source
|- Stored in `src/features/volume/muscleMaps.ts` as `MUSCLE_ACTIVATION_MAP`
- Multiplier scale: 0.0 (not involved) to 1.0 (primary mover)
- Multi-dimensional: chest, back, shoulders, quads, hamstrings, glutes, arms (biceps/triceps/brachialis), calves, abs

### Weekly Volume Aggregation Flow
1. Fetch all historical sets for a muscle group (or all muscle groups)
2. For each set: `volume = sets * reps * weight * muscleMultiplier`
3. Bucket sets by week (date -> ISO week)
4. Sum volume per muscle group per week
5. Return time-series: `{ week: string, chest: number, back: number, ... }[]`

### Database Schema v5 (Future — Phase 10)
|- Volume multipliers currently hardcoded in `muscleMaps.ts` (no DB store needed)
|- `volumeMetadata` store planned for user-customizable multipliers:
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

## Phase 11 — UI Redesign (COMPLETE)

### waR: Design System (Stitch-derived, light theme only)
**Final design ported from the user's Google Stitch output after 3 iterations** (Apple-style → ui-ux-pro-max generated → Stitch). Do not reintroduce dark mode, SF Pro, Barlow, lucide-react, or energy-orange theming.

| Layer | Implementation |
|-------|----------------|
| Fonts | Inter 400/500/600/700, loaded via `<link>` in `index.html` |
| Icons | Material Symbols Outlined font, wrapped by `src/components/MaterialIcon.tsx` (props: `name`, `size`, `fill`) |
| Tokens | `@theme` block in `src/index.css`: `--color-app #F5F5F7`, `--color-card #FFF`, `--color-sunken #F7F3F2`, `--color-sunken-high #EBE7E7`, `--color-ink #1C1B1C`, `--color-blue #0071E3`, `--color-green #10B981`, `--color-red #BA1A1A`, `--color-orange #FF9500` |
| Component classes | `src/App.css`: `.card` (white, hairline border, soft shadow), `.btn-primary` (black), `.btn-outline` (white/blue label), `.btn-finish` (emerald), `.segmented` (iOS-style), `.stepper-field` (sunken well + white thumb buttons), `.material` (blur bar), `.tnum` (tabular numerals), `.row-sep` (hairline separators) |
| Type scale | `.display-lg` 34px, `.headline-sm` 20px, `.body-md` 15px, `.label-caps` 12px caps, `.section-label` |

### waR: Component Architecture (post-Phase 11)
```
src/App.tsx                          # Pane-per-tab shell + floating pill tab bar
src/components/MaterialIcon.tsx      # Material Symbols wrapper
src/features/workout/components/
  WorkoutSession.tsx                 # Container (useWorkoutSession + started flag)
                                     #   └ WorkoutSessionView (start screen | session | empty-in-progress)
  ExerciseSelector.tsx               # Full-screen sheet (search, templates, library)
  SetInput.tsx                       # Steppers + Log Set button (green flash on commit)
  SetRow.tsx                         # Logged set row with spring enter/exit
  RestTimerBanner.tsx                # Black pill timer, Web Audio chime, haptics
src/features/history/components/
  History.tsx                        # HistoryScreen (list → WorkoutDetail)
  WorkoutDetail.tsx                  # Column-header set tables
src/features/analytics/components/
  Analytics.tsx                      # Picker, stat tiles, 1RM chart, volume, balance
src/features/recommendations/components/
  ExerciseSwap.tsx                   # Swap dropdown (lazy recommendations)
```
- **Deleted in Phase 11**: `ExerciseCard.tsx` (absorbed into WorkoutSession cards), `EquipmentPreferences.tsx` (orphan), `src/styles/tokens.ts` (superseded by `@theme`)
- **Start screen gate**: `started` state lives in the WorkoutSession container; "Start Workout" opens the exercise picker, "Finish Workout" resets it
- **Rest timer**: app-level `RestTimerProvider` context (see waR: Rest Timer Architecture). WorkoutSession only calls `startTimer(90)` on set log; the banner renders from App.tsx above all tabs

### Phase 12 Gate
Timestamp-based engine shipped: schema v6 `timerState` persistence ✓ · survives tab switches + reloads ✓ · document.title + app badge while running ✓ · Notification when hidden at zero ✓ · Wake Lock during rest ✓ · `npm run build` ✓ · `tsc --noEmit` ✓

### Phase 13 Gate
Template persistence root cause fixed (`getAll` replaces undefined-key index query) ✓ · rename + delete UI on all template rows, write-through to DB ✓ · ghost-bleed fixed via keyed `SetInput` remount ✓ · progression chart returns full series ✓ · `npm run build` ✓ · `tsc --noEmit` ✓

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
| 10 Volume Tracking | Weekly volume aggregates correctly, fractional muscle multipliers applied, overtraining/undertraining detection, muscle balance analysis ✓ |
| 11 UI Redesign | Stitch design system shipped (Inter, Material Symbols, light theme), bounce-free tab panes, Start Workout screen, builds pass, shipped CSS verified |
| 12 Timer Fixes | Timestamp-based timer persists across tabs + reloads, title/badge visible outside app, notification at zero |
| 13 Template Fixes | Persistence root cause fixed (undefined index key), rename/delete UI, ghost-bleed keyed remount, full-series chart verified |
| 14 Exercise DB | 50+ exercises, equipment correlations, muscle distribution |
| 7 Deploy | Static site serves on Netlify/Vercel/GitHub Pages, HTTPS, cache headers correct |
