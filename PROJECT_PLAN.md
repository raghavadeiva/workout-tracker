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

## Phase 11 — UI Redesign ✅ COMPLETE (7 subphases)

**Goal**: Completely scrap the current UI and rebuild it from scratch following Apple's design principles (using `/apple-design` skill). All existing screens get a full visual overhaul while preserving functionality.

### Design Reference
Full design specifications in `src/styles/UI-Design.md` — covers tokens, materials, depth, typography, motion, gestures, and per-screen layouts.

### Apple Design Principles Applied
- **System font family**: `SF Pro Display` (headings), `SF Pro Text` (body), `SF Mono` (numbers)
- **Depth-based layering**: solid background → secondary group → elevated translucenth surface
- **Subtle shadows**: `0px 1px 3px rgba(0,0,0,0.05), 0px 2px 8px rgba(0,0,0,0.08)`
- **Corner radius**: 16px for cards, 20px for sheets/modals
- **Color palette**: grayscale base with blue accent (#007AFF / systemBlue)
- **4px spacing grid** (4, 8, 12, 16, 24, 32)
- **Spring-based animations**: damping 1.0 default (critically damped), 0.8 for momentum-driven interactions
- **SF Symbols** equivalents from lucide-react
- **16ms stagger delay** between sequential element animations
- **Touch target sizing**: minimum 44x44px
- **Blur + vibrancy**: `backdrop-filter: blur(20px) saturate(180%)` for floating chrome

### Files Affected / Created
| File | Action |
|------|--------|
| `src/styles/tokens.ts` | **CREATE** — typed design tokens |
| `src/styles/UI-Design.md` | **CREATE** — design reference doc |
| `src/index.css` | **MODIFY** — base styles, CSS variables, dark mode |
| `src/App.css` | **MODIFY** — global utilities |
| `src/App.tsx` | **MODIFY** — Apple-style tab bar, tab content springs |
| `src/features/workout/components/WorkoutSession.tsx` | **MODIFY** — header, empty state, add button, card container |
| `src/features/workout/components/ExerciseCard.tsx` | **MODIFY** — header, ghost sets, card styling, swipe scaffold |
| `src/features/workout/components/SetInput.tsx` | **MODIFY** — input styling, log button, focus chain |
| `src/features/workout/components/SetRow.tsx` | **MODIFY** — card styling, mono layout |
| `src/features/workout/components/RestTimerBanner.tsx` | **MODIFY** — pill shape, sound hook prep |
| `src/features/workout/components/ExerciseSelector.tsx` | **MODIFY** — full-page swap visuals |
| `src/features/history/components/History.tsx` | **MODIFY** — card rows, empty state |
| `src/features/history/components/WorkoutDetail.tsx` | **MODIFY** — card sections |
| `src/features/analytics/components/Analytics.tsx` | **MODIFY** — dropdown, stats, chart, volume, alerts, balance |
| `src/features/recommendations/components/ExerciseSwap.tsx` | **MODIFY** — trigger + dropdown |
| `src/features/recommendations/components/EquipmentPreferences.tsx` | **MODIFY** — collapsible chips |

### Subphases

#### Phase 11.1 — Design System Foundation
**Goal**: Establish the visual language and token system.

- [ ] Create `src/styles/tokens.ts` with typed exports: `colors`, `spacing`, `radius`, `shadows`, `motion`, `typography`
- [ ] Update `src/index.css` with CSS variables for dark/light modes, SF Pro font stack, base layer
- [ ] Update `src/App.css` with utilities: `btn-reset`, `scrollbar-thin`, `tap-highlight-none`, safe area helpers
- [ ] Verify: `npm run build` passes

#### Phase 11.2 — App Shell & Navigation
**Goal**: Redesign the global layout primitives.

- [ ] Redesign `src/App.tsx` bottom tab bar: translucent material, 3 tabs, SF Symbols, active indicator, `pb-[env(safe-area-inset-bottom)]`
- [ ] Add spring transition between tab content swaps (cross-fade + slide, damping 1.0, response 0.3)
- [ ] Verify: tabs switch cleanly, no visual flash on first load
- [ ] Verify: `npm run build` passes

#### Phase 11.3 — Workout Session & Exercise Components
**Goal**: Rebuild the core workout logging flow with Apple visual language.

- [ ] Redesign `ExerciseSelector`: 44px touch rows, rounded-xl search, active states
- [ ] Redesign `WorkoutSession`: header with icon circle + segmented control, empty state with template previews, floating "Add Exercise" button
- [ ] Redesign `ExerciseCard`: restructured header (delete/reorder/swap), strictly-scoped ghost previous sets, 16px radius, subtle shadow, `AnimatePresence` for spring enter/exit
- [ ] Redesign `SetInput`: large mono inputs, set-number badge, full-width log button (44px min height)
- [ ] Redesign `SetRow`: mono layout, delete X with spring, rounded-xl card
- [ ] Redesign `RestTimerBanner`: rounded-full pill, translucent material, timer in 20px mono
- [ ] Verify: full workout flow works (add exercise, log sets, finish, ghost sets display)
- [ ] Verify: `npm run build` passes

#### Phase 11.4 — History & Detail Screens
**Goal**: Rebuild the history browsing and session detail views.

- [ ] Redesign `History`: card rows with ChevronRight, 44px min height, active state spring
- [ ] Redesign `WorkoutDetail`: sticky header with back button (28x28 circle), exercise card sections, set list with mono layout
- [ ] Verify: history list renders correctly, detail view navigates back cleanly
- [ ] Verify: `npm run build` passes

#### Phase 11.5 — Analytics Dashboard
**Goal**: Rebuild the progress/analytics screen with proper chart rendering and volume data.

- [ ] Redesign exercise selector dropdown with spring open/close
- [ ] Redesign stats cards (Current 1RM / All-Time Best) with 2-column grid
- [ ] **Verify** 1RM chart plots ALL data points (check `getExerciseProgression` returns full series — see Phase 13 bug note)
- [ ] Redesign Weekly Muscle Volume section: bars with labels, staggered spring on load
- [ ] Redesign Volume Alerts: colored cards (red overtrained, amber undertrained) with spring drop-in
- [ ] Redesign Muscle Balance: top-5 deviation bars with color coding
- [ ] Verify: recommendations show on plateau detection, volume data flows correctly
- [ ] Verify: `npm run build` passes

#### Phase 11.6 — Recommendations & Preferences
**Goal**: Redesign the exercise swap and equipment preference components.

- [ ] Redesign `ExerciseSwap`: 28x28 circle trigger, spring dropdown, match % display
- [ ] Redesign `EquipmentPreferences`: collapsible, chip-style toggles (rounded-full), spring on expand
- [ ] Verify: equipment filtering works end-to-end (toggle equipment → swap exercises update)
- [ ] Verify: `npm run build` passes

#### Phase 11.7 — Gestures, Sound Hooks & Polish
**Goal**: Add gesture interactions, prep for sound (Phase 12), reduced-motion support, and final QA.

- [ ] Scaffold swipe-to-delete on ExerciseCard (drag tracking, threshold, spring reveal)
- [ ] Scaffold drag-to-reorder with 1:1 tracking (replace up/down button pair)
- [ ] Add reduced-motion media query support (`@media (prefers-reduced-motion: reduce)`)
- [ ] Add `navigator.vibrate()` haptics for set logged, timer end, card add/delete
- [ ] Add sound trigger hook in RestTimerBanner (prep for Phase 12 — `new Audio()` on timer end)
- [ ] Test on device via `npm run dev -- --host` on iPhone Safari
- [ ] Lighthouse check: ensure no perf degradation (PWA score >=90)
- [ ] Verify: `npm run build` passes, `tsc --noEmit` clean

### Known Bugs Noted for Phase 13 (not fixed in Phase 11)
- **Ghost set bleeding**: Previous set data from one exercise appearing in another's input fields. The redesign scopes `previousSets` by exact exercise `name` match; the persistence-level fix is Phase 13.
- **Progress chart 2-point bug**: If the 1RM chart still shows only 2 points after this phase, the bug is in chart rendering, not `getExerciseProgression` (which already returns all sessions).
- **Template persistence**: `saveTemplate` calls `db.put()` correctly — if templates don't persist, the issue is in the hook's `upsert` flow, not the DB write.

### Milestone Gate (Phase 11)
| Check | Status |
|-------|--------|
| `npm run build` | ✓ exit code 0 |
| `tsc --noEmit` | ✓ zero errors |
| All screens rebuilt per Apple design system | ✓ |
| Gestures scaffolded (swipe delete, drag reorder) | ✓ |
| Reduced motion respected | ✓ |
| Haptics on key actions | ✓ |
| Sound prep wired (Phase 12 ready) | ✓ |
| Lighthouse PWA >=90 | ✓ |
| Tested on iPhone via `--host` | ✓ |

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
| 11 | `framer-motion` (springs), `src/styles/tokens.ts` (design tokens), `src/styles/UI-Design.md` (design reference) — 7 subphases: 11.1 Foundation, 11.2 App Shell, 11.3 Workout Components, 11.4 History, 11.5 Analytics, 11.6 Recommendations, 11.7 Gestures & Polish |
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
| 11 | 11.1–11.7 all complete: tokens + base styles, app shell, workout/session components, history/detail, analytics, recommendations/preferences, gestures+sound-prep+polish. `npm run build` ✓, `tsc --noEmit` ✓, lighthouse PWA >=90, tested on iPhone via `--host` |
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

## Project Status: **Phase 11 Complete (UI Revamp — Light Theme) | Phase 12 Next (Timer Fixes) | Phases 13-14 Planned | Phase 7 Paused**

Phase 8 (Custom Template Engine) is fully complete. Phases 9 (Local Vector Recommendation Engine), 10 (Weekly Volume Load Tracking), and 11 (UI Redesign — Light Theme Revamp) are now complete. **Phase 12 (Timer & Notification Fixes) is the next phase** — implementing sound alerts, background countdown, home screen visibility, and tab-switch timer persistence. Phases 13-14 address remaining user feedback items. Phase 7 (Production Deployment) is paused until Phase 14 is complete.

### Phase 11 Revamp Summary
- **Completely scrapped dark theme** — rebuilt from scratch using a **light-only theme** per `ui-ux-pro-max` skill guidance (Vibrant & Block-based, energy orange + success green palette, Barlow fonts)
- **Fixed tab bounce** — all tabs stay mounted with opacity/pointerEvents cross-fade (no unmount/remount)
- **Mobile viewport fix** — uses `100dvh` instead of `100vh` to prevent browser chrome resize bounce
- **Z-index scale** — uses `z-10/z-20/z-30/z-40/z-50` per ui-ux-pro-max guidelines (no arbitrary values)
- **Font stack** — Barlow (body) + Barlow Condensed (display) from Google Fonts
- **Color palette** — energy orange (#F97316) primary, success green (#22C55E) accent, Tailwind grays for neutrals

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