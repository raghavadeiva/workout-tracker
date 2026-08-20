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
|- Save/load workout sessions
|- Exercise library (hardcoded common exercises in ExerciseSelector)
|- Schema versioning with migrations
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
- `useWorkoutHistory` hook
- `useExerciseHistory` hook
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

## Phase 9 — Local Vector Recommendation Engine | ACTIVE

**Goal**: 100% client-side exercise substitution recommendations using cosine similarity over exercise embedding vectors.

### Features
- Exercise substitution suggestions (e.g., "Incline DB Bench instead of Flat Bench")
- Muscle group + equipment-based vector embeddings
- Cosine similarity ranking of candidate exercises
- Context-aware recommendations (respect user's available equipment)
- No external API calls — all computation in-browser

### Technical
|- `src/features/recommendations/` module with vector math utilities
|- `useRecommendations` hook for reactive suggestion stream (planned, not yet implemented — Analytics.tsx calls `getRecommendations()` directly via useMemo)

### Database Schema v4 (Planned — not yet implemented)
```
recommendations: { key: exerciseId, value: { vector: Float32Array, metadata: { muscleGroups[], equipment[], movementPattern, difficulty } } }
```

---

## Phase 10 — Weekly Volume Load Tracking (Scoped)

**Goal**: Aggregate historical set volume weekly using weighted fractional muscle group multipliers (e.g., Bench = 1.0 Chest, 0.5 Triceps).

### Features
- Per-exercise muscle activation map with fractional multipliers
- Weekly volume aggregation per muscle group
- Volume progression trend lines
- Overtraining / undertraining detection (low volume weeks)
- Muscle group balance analysis

### Technical
|- Muscle activation map: `{ chest: 1.0, triceps: 0.5, anteriorDeltoid: 0.25 }` per exercise
|- Weekly bucketing via ISO week calculation (`getISOWeek` in `volumeUtils.ts`)
|- `src/features/volume/` module: `calculateWeeklyVolume`, `getLatestWeekVolumes`
|- `useWeeklyVolume` hook for reactive aggregation (implemented)
|- Volume multipliers defined in `muscleMaps.ts` service layer

### Database Schema v5 (Future)
```
volumeMetadata: { exerciseId, muscleMultipliers: Record<string, number> }
```

---

## Phase 7 — Production Deployment | PAUSED

**Goal**: Deploy to static hosting with proper config.

> **Status**: Paused until Phases 9 and 10 are complete.

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
| 9 | Cosine similarity vectors computed client-side, exercise suggestions render |
| 10 | Weekly volume aggregates correctly, fractional muscle multipliers applied |
| 7 | Live on HTTPS, cache headers correct, preview deployments work |

---

## Notes

- **No scope creep**: Each phase delivers exactly what's listed. New ideas -> backlog.
- **Buildable always**: `npm run build` must pass after every commit.
- **Mobile-first**: Test on real iPhone (via `--host`) every phase.
- **Accessibility**: Semantic HTML, ARIA labels, color contrast, focus management.
- **Performance**: Bundle size budget <100KB gzipped (Phase 0), <200KB (Phase 7).

---

## Project Status: **Phase 9 Active | Phase 7 Paused**

Phase 8 (Custom Template Engine) is fully complete. Phase 9 (Local Vector Recommendation Engine) is now the active phase. Phase 10 (Weekly Volume Load Tracking) is scoped and ready to execute after Phase 9. Phase 7 (Production Deployment) remains paused until both Phases 9 and 10 are complete.
