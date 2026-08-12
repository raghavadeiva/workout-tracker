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

---

## Architecture Principles

### PWA, Fully Local, No Backend
- **Progressive Web App** - Service worker, manifest, installable
- **100% Client-Side** - No server, no API, no authentication
- **All Data On-Device** - IndexedDB only, never leaves the browser
- **No Cloud Sync** - Not in scope (future consideration only)
- **No External Dependencies at Runtime** - Works offline after first load

### Mobile-First Design
- **Touch-Optimized** - Large tap targets (≥44px), thumb-friendly layout
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
Components → Custom Hooks → Service Layer (Repository) → IndexedDB
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
- **Coverage Target** - ≥80% for services/hooks, ≥60% overall
- **Run on CI** - All tests must pass before merge

### Error Handling Requirements
- **Graceful Degradation** - App works even if IndexedDB unavailable (memory fallback)
- **User-Facing Errors** - Toast/notification, never alert()
- **Error Boundaries** - Wrap feature routes, not whole app
- **Structured Errors** - Custom error classes with codes for i18n later
- **Logging** - Console in dev, no-op in prod (no external logging service)

---

## Critical Architectural Constraints (Learned in Production)

### ⚠️ iOS Safari Touch Bug
**NEVER use fixed modal overlays with scrollable content for interactive lists.**
- The `ExerciseSelector` **must remain a conditional full-page render swap** (early return pattern).
- Fixed `inset-0 z-50` modals with `overflow-y-auto` silently swallow tap events on iOS Safari.
- Pattern: `if (showSelector) return <ExerciseSelector />` — NOT portal/overlay.

### ⚠️ ID Generation
**Do NOT use `crypto.randomUUID()`** — it crashes on unencrypted local IP networks (http://10.x.x.x).
- Use the custom `generateId()` function: `Date.now().toString(36) + Math.random().toString(36).substring(2)`
- Defined in `src/db/database.ts` and exported for all consumers.

### ⚠️ Database Schema
**IndexedDB via `idb` wrapper — Database: `WorkoutDB`**
- Current version: **v3** (added `templates` store)
- Stores:
  - `activeSession` (key: `'current'`)
  - `settings` (key: `'prefs'`)
  - `history` (keyPath: `id`, index: `by-date` on `startedAt`)
  - `templates` (keyPath: `id`, indexes: `by-name`, `by-last-used`)
- Migrations handled in `upgrade` callback of `openDB`.

### ⚠️ React Rules of Hooks
**Always initialize hooks at the very top of the component, before any conditional returns.**
```tsx
const { ... } = useWorkoutSession();     // 1. Unconditional
const timerProps = useRestTimer();        // 2. Unconditional
const [showSelector, ...] = useState();   // 3. Unconditional
const handleAddExercise = useCallback();  // 4. Unconditional
if (isLoading) return <Spinner />;        // Early returns AFTER all hooks
if (showSelector) return <Selector />;
```

### ⚠️ Template Architecture
**Explicit "Save as Template" — NOT silent history scraping.**
- Users must deliberately click "Save Active Workout as Template"
- Templates are first-class entities in `templates` store (separate from `history`)
- Starting from template copies exercises into active session (no history linkage)
- Previous set pre-fill reads from `history` store (last session per exercise)

---

## Development Rules

### 1. Inspect Before Modify
Before editing any file, **read it first**. Understand existing patterns, imports, and conventions. Do not assume.

### 2. No Unrelated Rewrites
Only change files directly related to the task. Do not reformat, reorganize, or "clean up" unrelated code. Style fixes belong in dedicated PRs.

### 3. Keep the App Buildable
After every change, the project must:
- `npm run build` → **exit code 0**
- `npm run dev` → **starts without error**
- TypeScript `tsc --noEmit` → **no errors**

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
| 6 PWA | Lighthouse PWA score ≥90, installs on iOS Safari |
| 8 Templates | Templates save/load, previous sets pre-fill, no modal overlays |
| 7 Deploy | Static site serves on Netlify/Vercel/GitHub Pages, HTTPS, cache headers correct |