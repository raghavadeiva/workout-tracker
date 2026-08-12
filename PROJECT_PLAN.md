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
| 6 | PWA + Mobile | Service worker, manifest, iOS install, Lighthouse ≥90 |
| 8 | Custom Template Engine | Save/load workout templates, previous set tracking |
| 7 | Production Deploy | Static hosting (Vercel), HTTPS, cache headers, monitoring |

---

## Phase 0 — Foundation ✅ COMPLETE

**Goal**: Establish a clean, buildable project foundation.

### Tasks
- [x] Initialize Vite + React + TypeScript
- [x] Install and configure Tailwind CSS (v4 compatible config)
- [x] Install only essential dependencies
- [x] Create source directory structure (`features/`, `components/`, `db/`, `hooks/`, `types/`, `utils/`)
- [x] Create `HERMES.md` (architecture principles, conventions, rules)
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
- Save/load exercise library
- Schema versioning with migrations
- Memory fallback if IndexedDB blocked

### Technical
- `idb` library for type-safe IndexedDB
- Repository pattern in `src/db/services/`
  - `WorkoutRepository`
  - `ExerciseRepository`
  - `SetRepository`
- Migration system (v1 → v2 → ...)
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
- Lighthouse PWA score ≥90

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

## Phase 7 — Production Deployment ✅ COMPLETE

**Goal**: Deploy to static hosting with proper config.

### Targets
- **Primary**: Vercel
- **HTTPS**: Automatic via provider
- **Cache Headers**: Long-term for assets, no-cache for HTML/SW/Manifest

### Checklist
- [x] `npm run build` outputs to `dist/`
- [x] SPA fallback (index.html for all routes) via Vercel rewrites
- [x] Service worker scope correct
- [x] Icons served with correct MIME types
- [x] PWA installs on iOS Safari from production URL
- [x] Production URL live and accessible off local network

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
| 7 | *(none)* |

---

## Milestone Gates

Each phase must pass before starting the next:

| Phase | Gate |
|-------|------|
| 0 | `npm run build` ✓, `npm run dev -- --host` ✓, HERMES.md ✓, PROJECT_PLAN.md ✓ |
| 1 | Full workout flow works in-memory, no console errors, mobile layout correct |
| 2 | Data persists across reload, `npm run build` ✓, migrations tested |
| 3 | History browsable, 1RM calculates correctly, exercise progression visible |
| 4 | Timer runs in background, notifications fire, survives tab switch |
| 5 | Charts render, responsive, no layout shift, data accurate |
| 6 | Lighthouse PWA ≥90, installs on iOS Safari, offline works |
| 8 | Templates save/load, previous sets pre-fill, no modal overlays |
| 7 | Live on HTTPS, cache headers correct, preview deployments work |

---

## Notes

- **No scope creep**: Each phase delivers exactly what's listed. New ideas → backlog.
- **Buildable always**: `npm run build` must pass after every commit.
- **Mobile-first**: Test on real iPhone (via `--host`) every phase.
- **Accessibility**: Semantic HTML, ARIA labels, color contrast, focus management.
- **Performance**: Bundle size budget <100KB gzipped (Phase 0), <200KB (Phase 7).

---

## Project Status: **COMPLETE** 🎉

All 9 phases (0-8, 7) finished. The app is deployed to production on Vercel and installable as a PWA on iOS Safari. Ready for the gym.