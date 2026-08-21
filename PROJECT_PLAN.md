# Workout Tracker - Project Plan

## Phase Overview

| Phase | Focus | Deliverable |
|-------|-------|-------------|
| 0 | Foundation | Clean Vite+React+TS+Tailwind, buildable, dev server works |
| 1 | Core Workout Logging UI | In-memory workout session flow (no persistence) |
| 2 | IndexedDB Persistence | Data survives reload, service layer, migrations |
| 3 | Workout History | Browse sessions, exercise history, Epley 1RM |
| 4 | Rest Timer | Background timer, notifications, tab visibility |
| 5 | Analytics/Charts | Progress charts with Recharts |
| 6 | PWA + Mobile | Service worker, manifest, iOS install, Lighthouse >=90 |
| 8 | Custom Template Engine | Save/load workout templates, previous set tracking |
| 9 | Local Vector Recommendation Engine | Cosine similarity exercise substitution vectors |
| 10 | Weekly Volume Load Tracking | Fractional set volumes per muscle group aggregation |
| 11 | UI Redesign | Complete visual rebuild from scratch following Apple design principles |
| 12 | Timer & Notification Fixes | Sound/alert on rest end, background countdown, home screen widget |
| 13 | Template & History Fixes | Edit/delete templates, persistence fix, progress graph fix |
| 14 | Exercise Database Expansion | Premade exercise DB, muscle distribution, equipment correlations |
| 7 | Production Deploy | Static hosting (Vercel), HTTPS, cache headers, monitoring |

---

## Phase 0 — Foundation ✅ COMPLETE

**Goal**: Establish a clean, buildable project foundation.

### Tasks
- [x] Initialize Vite + React + TypeScript
- [x] Install and configure Tailwind CSS (v4 compatible config)
- [x] Install only essential dependencies
- [x] Create source directory structure (`features/`, `components/`, `db/`, `hooks/`, `types/`, `utils/`)
- [x] Create `ARCHITECTURE.md` (architecture principles, conventions, rules)
- [x] Create `PROJECT_PLAN.md` (this file)
- [x] Create `.gitignore`
- [x] Create minimal working App (placeholder page)
- [x] Run `npm run build` - fix all errors
- [x] Run `npm run dev -- --host` - confirm dev server starts

---

## Phase 1 — Core Workout Logging UI (No Persistence) ✅ COMPLETE

**Goal**: Complete in-memory workout session flow.

### Features
- Workout session screen (active workout)
- Exercise list with add/remove
- Set logging: weight (kg/lbs), reps
- Auto-populate previous set's weight/reps
- Set completion (swipe/tap to mark done)
- Session summary on finish
- In-memory state only (lost on refresh)

### Technical
- `useWorkoutSession` hook for session state
- `useExerciseSets` hook for per-exercise set state
- Local component state only - no services yet
- Mobile-first responsive layout
- Keyboard-friendly number inputs

---

## Phase 2 — IndexedDB Persistence ✅ COMPLETE

**Goal**: Data survives browser reload via IndexedDB.

### Features
- Save/load workout sessions
- Exercise library (hardcoded common exercises in ExerciseSelector)
- Schema versioning with migrations
- Memory fallback if IndexedDB blocked

### Technical
- `idb` library for type-safe IndexedDB
- Repository pattern in `src/db/database.ts`
  - `WorkoutRepository` (inline: `saveSession`, `loadSession`, `finishSession`, `getHistory`)
  - `ExerciseRepository` (inline: `getPreviousPerformance`)
  - `SetRepository` (inline in exercise operations)
- Migration system (v1 -> v2 -> ...)
- Service layer exports clean async APIs
- Hooks (`useWorkoutSession`) now persist automatically

---

## Phase 3 — Workout History ✅ COMPLETE

**Goal**: Browse past workouts and exercise progression.

### Features
- Workout history list (date, duration, volume, exercise count)
- Session detail view (all sets, rest times, notes)
- Exercise history (all sessions for one exercise)
- Epley 1RM calculation per set + trend
- Volume progression charts (data ready for Phase 5)

### Technical
- History data fetched via `getHistory()` from `db/database.ts`
- `getExerciseProgression` and `getBestSet1RM` in `src/features/analytics/utils/math.ts`
- Epley formula: `1RM = weight * (1 + reps/30)`
- Derived stats computed in service layer
- Date grouping (week/month/year)

---

## Phase 4 — Rest Timer ✅ COMPLETE

**Goal**: Automatic rest timer after set completion.

### Features
- Start timer automatically when set marked complete
- Configurable default rest (60s, 90s, 120s, custom)
- Per-exercise rest override
- Timer runs in background (setInterval + visibility API)
- Pause/resume/skip controls
- Persists across tab switches

### Technical
- `useRestTimer` hook
- `navigator.vibrate()` for notifications
- `visibilitychange` event to sync timer
- Settings stored in IndexedDB (Phase 2)

---

## Phase 5 — Analytics / Charts ✅ COMPLETE

**Goal**: Visualize strength and volume progress.

### Features
- Exercise 1RM trend line chart
- Current 1RM and All-Time Best stats cards
- Exercise selector dropdown from history
- Mobile-first responsive chart

### Technical
- `recharts` for charting (responsive, accessible)
- Chart components in `src/features/analytics/`
- Epley 1RM calculation per session
- Data aggregation in utils

---

## Phase 6 — PWA + Mobile Optimization ✅ COMPLETE

**Goal**: Production-ready PWA, installable on iOS Safari.

### Features
- Web App Manifest (icons, name, theme, display: standalone)
- Service Worker (Workbox via vite-plugin-pwa)
- Offline-first caching (static assets + IndexedDB data)
- Install prompt handling (iOS manual, Android auto)
- Safe area insets (notch, home indicator)
- Touch optimizations
- Lighthouse PWA score >=90

### Technical
- `vite-plugin-pwa` for SW generation
- Manifest config in `vite.config.ts`
- iOS-specific meta tags (`apple-mobile-web-app-*`)

---

## Phase 8 — Custom Template Engine & Previous Set Tracking ✅ COMPLETE

**Goal**: Allow users to save workouts as templates and automatically load previous set data when starting from a template.

### Features
- **Save as Template**: User explicitly saves active workout as named template
- **Template List**: Browse saved templates with exercise count, last used
- **Start from Template**: Load template into active workout (copies exercises, no history)
- **Previous Set Tracking**: When starting from template, pre-fill weight/reps from last completed session of each exercise
- **Template Management**: Rename, delete, duplicate templates
- **Visual distinction**: Templates are separate from History

### Technical
- Database upgrade to v3: add `templates` object store
- `Template` type: id, name, exercises[], createdAt, updatedAt, lastUsedAt
- `useTemplate` hook: CRUD + load into active session
- `usePreviousSets` hook: fetch last session per exercise for pre-fill
- Conditional full-page swap for Template List/Editor (no modals)
- Previous set data loaded from `history` store, not templates

### Database Schema v3
```
templates: { key: id, indexes: ['by-name', 'by-last-used'] }
```

### Files Created
```
src/db/database.ts          # Add templates store, v3 migration
src/hooks/useWorkoutSession.ts  # Template CRUD + load + previous sets
src/features/workout/components/
  ExerciseCard.tsx          # Ghost previous sets display
  WorkoutSession.tsx        # Empty state shows templates, header has save button
```

### Dependencies (Phase 8)
| Package | Purpose |
|---------|---------|
| *(none new)* | Uses existing deps |

---

## Phase 9 — Local Vector Recommendation Engine ✅ COMPLETE

**Goal**: 100% client-side exercise substitution recommendations using cosine similarity over exercise embedding vectors.

### Features
- Exercise substitution suggestions (e.g., "Incline DB Bench instead of Flat Bench")
- Muscle group + equipment-based vector embeddings
- Cosine similarity ranking of candidate exercises
- Context-aware recommendations (respect user's available equipment)
- No external API calls — all computation in-browser

### Status
- **Vector math** (`vectorUtils.ts`) — dotProduct, magnitude, cosine similarity ✓
- **Exercise vectors** (`exerciseVectors.ts`) — 20-dim embeddings for 16 exercises, `getRecommendations()` ✓
- **`useRecommendations` hook** — memoized, equipment filtering ✓
- **Database Schema v4** — `recommendations` store added, `seedExerciseEmbeddings()` ✓
- **Equipment preferences** — user toggles in WorkoutSession, persisted to settings store ✓
- **In-workout exercise swap** — `ExerciseSwap` component in ExerciseCard, `swapExercise` handler ✓
- **Analytics integration** — recommendations shown on plateau detection ✓

### Files Created/Modified
```
src/features/recommendations/
  vectorUtils.ts             # dot product, magnitude, cosine similarity
  exerciseVectors.ts         # 20-dim embeddings, getRecommendations()
  useRecommendations.ts      # reactive hook with memoization + equipment filtering
  components/
    ExerciseSwap.tsx         # swap button + dropdown with alternatives
    EquipmentPreferences.tsx # collapsible equipment toggle panel
src/db/database.ts           # v4 migration, ExerciseEmbedding type, seed/save/load functions
src/hooks/useWorkoutSession.ts  # equipment state, swapExercise handler, seed on mount
src/features/workout/components/
  ExerciseCard.tsx           # added ExerciseSwap integration
  WorkoutSession.tsx         # added EquipmentPreferences panel
```

---

## Phase 10 — Weekly Volume Load Tracking ✅ COMPLETE

**Goal**: Aggregate historical set volume weekly using weighted fractional muscle group multipliers (e.g., Bench = 1.0 Chest, 0.5 Triceps).

### Features
- Per-exercise muscle activation map with fractional multipliers
- Weekly volume aggregation per muscle group
- Volume progression trend lines
- Overtraining / undertraining detection (low/high volume weeks)
- Muscle group balance analysis

### Status
- **Muscle activation map** (`muscleMaps.ts`) — fractional multipliers per exercise ✓
- **Weekly volume calculation** (`volumeUtils.ts`) — `calculateWeeklyVolume`, `getLatestWeekVolumes` ✓
- **Overtraining/undertraining detection** — `detectVolumeRisks` with configurable thresholds ✓
- **Muscle balance analysis** — `analyzeMuscleBalance` with deviation scoring ✓
- **`useWeeklyVolume` hook** — reactive aggregation with error handling ✓
- **Analytics integration** — volume bar charts, balance bars, risk alerts ✓

### Technical
- Muscle activation map: `{ chest: 1.0, triceps: 0.5, shoulders: 0.25 }` per exercise
- Weekly bucketing via ISO week calculation (`getISOWeek` in `volumeUtils.ts`)
- `src/features/volume/` module: `calculateWeeklyVolume`, `getLatestWeekVolumes`, `detectVolumeRisks`, `analyzeMuscleBalance`
- `useWeeklyVolume` hook for reactive aggregation
- Volume multipliers defined in `muscleMaps.ts` service layer

### Database Schema v5 (Future)
```
volumeMetadata: { exerciseId, muscleMultipliers: Record<string, number> }
```

---

## Phase 11 — UI Redesign | TODO

**Goal**: Completely scrap the current UI and rebuild it from scratch following Apple's design principles (using `/apple-design` skill). All existing screens get a full visual overhaul while preserving functionality.

### Scope
- **Complete UI teardown** — current components will be replaced, not incrementally upgraded
- **Apple design system** — applied to every screen: WorkoutSession, ExerciseSelector, Analytics, History, WorkoutDetail
- **Apple design principles**:
  - SF Rounded / system font family (`SF Pro Display`, `SF Pro Text`)
  - Depth-based layering: background → secondary group → elevated surface
  - Subtle shadows (0px 1px 3px rgba(0,0,0,0.05), 0px 2px 8px rgba(0,0,0,0.08))
  - Corner radius: 16px for cards, 18-24px for containers, 28px for modals
  - Minimal color palette: grayscale base with blue accent (#007AFF)
  - 4px spacing grid (4, 8, 12, 16, 24, 32)
- **Fluid animations** — spring-based transitions (16ms delay, 0.9 bounce, 280ms duration)
- **SF Symbols** equivalents from lucide-react where available
- **Typography hierarchy** — display bold, body regular/semibold, caption monoco
- **Touch target sizing** — minimum 44x44px for interactive elements
- **Blur + vibrancy** — `backdrop-filter: blur(10px)` for floating elements

### Files Affected
- `src/App.tsx` — navigation redesign (tab bar with SF Symbols)
- `src/features/workout/components/` — ALL components (WorkoutSession, ExerciseCard, SetInput, SetRow, RestTimerBanner)
- `src/features/analytics/components/Analytics.tsx` — charts, stats cards, volume/risk UI
- `src/features/history/components/` — History, WorkoutDetail
- `src/App.css` — base styles (font family, color vars, blur effects)
- `src/index.css` — Tailwind base layer overrides

### Approach
1. Load `/apple-design` skill for reference design patterns
2. Create a design token file (`src/styles/tokens.ts`) with colors, spacing, border radius, shadows
3. Rebuild each component using Apple's visual language
4. Test on device via `--host` for mobile fidelity
5. Lighthouse check to ensure no perf degradation

---

## Phase 12 — Timer & Notification Fixes | TODO

**Goal**: Fix rest timer behavior for background operation, sound alerts, and home screen visibility.

### Feedback Items
- "Add sound/Alert when set rest countdown ends"
- "Make timer countdown even when out of the app"
- "Make timer visible on Home Screen"
- "Timer persistence - if I go to a different tab within the app, the timer needs to continue"

### Technical
- Audio API (`new Audio()`) for sound alerts on rest end
- Keep `setInterval` running with `Page Visibility API` + `requestAnimationFrame` fallback
- Background sync via Service Worker + Push events for home screen widget
- Move timer state to top-level (`App.tsx`) so it persists across tab navigation

### Database Schema v6 (Future)
```
timerState: { key: 'active', value: { exerciseId, startTime, duration, isRunning } }
```

---

## Phase 13 — Template & History Fixes | TODO

**Goal**: Fix template persistence, add edit/delete, fix previous sets and progress graph issues.

### Feedback Items
- "Delete / edit workout templates"
- "Template save not persistent"
- "The shadow notes from last time we did that workout shit populate INSIDE the type field for this workout" — previous set data bleeding into wrong fields
- "Progress tracker graph only displays first and last time that exercise was done, doesn't plot everything"

### Technical
- Audit `saveTemplate` in `database.ts` — ensure `put()` is called correctly and template is committed
- Template list screen: add edit (rename) and delete with confirmation
- Fix `getPreviousPerformance` — ensure data maps to correct exercise by name match, not leaking into type fields
- Fix `getExerciseProgression` in `math.ts` — currently returns only 2 data points (first/last); should return all sessions with date + 1RM
- Add `deleteTemplate` function to database layer

---

## Phase 14 — Exercise Database Expansion | TODO

**Goal**: Expand the exercise library with a premade database of exercises, muscle group target distributions, and equipment strength correlations.

### Feedback Items
- "Increase exercise selection"
- "find premade database of exercises plus muscle group target distribution plus mbe strength correlation between cable/machine/dumbell/barbell"

### Technical
- Expand `EXERCISE_VECTORS` in `exerciseVectors.ts` from 16 to 50+ exercises
- Add `EQUIPMENT_CORRELATIONS` map: equipment type → strength correlation factor (barbell > dumbbell > cable > machine, due to stabilization requirements)
- Add `MUSCLE_TARGET_DISTRIBUTION` per exercise: `{ primary: 1.0, secondary: 0.5, ... }`
- Keep vectors hardcoded in code (no API, maintain 100% client-side principle)

---

## Phase 7 — Production Deployment | PAUSED

**Goal**: Deploy to static hosting with proper config.

> **Status**: Paused until Phases 11-14 are complete.

### Targets
- **Primary**: Vercel
- **HTTPS**: Automatic via provider
- **Cache Headers**: Long-term for assets, no-cache for HTML/SW/Manifest

### Checklist
- [ ] `npm run build` outputs to `dist/`
- [ ] SPA fallback (index.html for all routes) via Vercel rewrites
- [ ] Service worker scope correct
- [ ] Icons served with correct MIME types
- [ ] PWA installs on iOS Safari from production URL
- [ ] Production URL live and accessible off local network

### Deployment Commands
```bash
npx vercel          # Preview deployment
npx vercel --prod   # Production deployment
```

---

## Dependency Summary by Phase

| Phase | New Dependencies |
|-------|------------------|
| 0 | `react`, `react-dom`, `typescript`, `vite`, `@vitejs/plugin-react`, `tailwindcss`, `postcss`, `autoprefixer`, `lucide-react` |
| 1 | *(none - uses Phase 0 deps)* |
| 2 | `idb` |
| 3 | *(none)* |
| 4 | *(none)* |
| 5 | `recharts`, `date-fns` |
| 6 | `vite-plugin-pwa`, `workbox-window` |
| 8 | *(none)* |
| 9 | *(none - pure JS math, no external deps)* |
| 10 | *(none - uses existing Phase 3 date utils)* |
| 11 | *(none - visual/style changes)* |
| 12 | *(none — uses existing Audio API + Page Visibility API)* |
| 13 | *(none)* |
| 14 | *(none)* |
| 7 | *(none)* |

---

## Milestone Gates

Each phase must pass before starting the next:

| Phase | Gate |
|-------|------|
| 0 | `npm run build` ✓, `npm run dev -- --host` ✓, ARCHITECTURE.md ✓, PROJECT_PLAN.md ✓ |
| 1 | Full workout flow works in-memory, no console errors, mobile layout correct |
| 2 | Data persists across reload, `npm run build` ✓, migrations tested |
| 3 | History browsable, 1RM calculates correctly, exercise progression visible |
| 4 | Timer runs in background, notifications fire, survives tab switch |
| 5 | Charts render, responsive, no layout shift, data accurate |
| 6 | Lighthouse PWA >=90, installs on iOS Safari, offline works |
| 8 | Templates save/load, previous sets pre-fill, no modal overlays |
| 9 | Cosine similarity vectors computed client-side, exercise suggestions render, equipment filtering, in-workout swap ✓ |
| 10 | Weekly volume aggregates correctly, fractional muscle multipliers applied, overtraining/undertraining detection, muscle balance analysis ✓ |
| 11 | All screens rebuilt per Apple design system, builds pass, lighthouse >=90 |
| 12 | Timer plays sound on rest end, continues in background, persists across tabs |
| 13 | Templates deletable/editable, persistence verified, progress graph plots all data points |
| 14 | 50+ exercises in library with equipment correlations and muscle distributions |
| 7 | Live on HTTPS, cache headers correct, preview deployments work |

---

## Notes

- **No scope creep**: Each phase delivers exactly what's listed. New ideas -> backlog.
- **Buildable always**: `npm run build` must pass after every commit.
- **Mobile-first**: Test on real iPhone (via `--host`) every phase.
- **Accessibility**: Semantic HTML, ARIA labels, color contrast, focus management.
- **Performance**: Bundle size budget <100KB gzipped (Phase 0), <200KB (Phase 7).

---

## Project Status: **Phase 10 Complete | Phase 11 Next (UI Redesign) | Phases 12-14 Planned | Phase 7 Paused**

Phase 8 (Custom Template Engine) is fully complete. Phases 9 (Local Vector Recommendation Engine) and 10 (Weekly Volume Load Tracking) are now complete. **Phase 11 (UI Redesign) is the next phase** — a complete visual rebuild from scratch following Apple design principles. Phases 12-14 address remaining user feedback items. Phase 7 (Production Deployment) is paused until Phase 14 is complete.

### User Feedback Mapping
| Feedback | Phase |
|----------|-------|
| "Redesign UI to be more appealing using /apple-design skill" | 11 |
| "Add sound/Alert when set rest countdown ends" | 12 |
| "Make timer countdown even when out of the app" | 12 |
| "Make timer visible on Home Screen" | 12 |
| "Timer persistence - if I go to a different tab within the app, the timer needs to continue" | 12 |
| "Delete / edit workout templates" | 13 |
| "Template save not persistent" | 13 |
| "The shadow notes from last time we did that workout shit populate INSIDE the type field for this workout" | 13 |
| "Progress tracker graph only displays first and last time that exercise was done, doesn't plot everything" | 13 |
| "Increase exercise selection" | 14 |
| "find premade database of exercises plus muscle group target distribution plus mbe strength correlation between cable/machine/dumbell/barbell" | 14 |