# Dogfood QA Report — Hypertrophy workout-tracker

**Target:** http://localhost:4173/ (production build via `vite preview`; same code as https://hypertrophy-sigma.vercel.app)
**Date:** 2026-08-24
**Scope:** Full app — Workout session flow, History, Progress/Analytics, rest timer, persistence (IndexedDB), PWA shell
**Tester:** Hermes Agent (automated exploratory QA + regression tests)
**Method:** static review of all 24 source files → RED regression tests → fixes → unit + E2E verification against the real production bundle

---

## Executive Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | 2 |
| 🟠 High | 2 |
| 🟡 Medium | 1 |
| 🔵 Low | 1 |
| **Total** | **6** |

**Overall Assessment:** Both user-reported symptoms traced to two critical root causes (stale one-shot history fetch on permanent tab panes; duration derived from an autosave-mutated timestamp instead of a real finish time) plus a latent seed-transaction abort that threw `DataError` on every first app load — all root-caused, fixed, and covered by 4 unit/integration tests and a 13-check E2E suite that now passes with zero console errors.

**Verification gates:** `npx vitest run` 4/4 · `tsc -b --force` clean · `npm run build` exit 0 · E2E 13/13 PASS · `oxlint` no new issues.

---

## Issues

### Issue #1: Finished workouts not visible in History/Progress until full reload

| Field | Value |
|-------|-------|
| **Severity** | Critical |
| **Category** | Functional |
| **URL** | http://localhost:4173/ (all tabs) |

**Description:**
App.tsx renders each tab into a permanent absolutely-positioned pane (`display:none` when inactive — the bounce-free architecture). Those panes mount exactly once at app open. `HistoryScreen`, `Analytics`, and `useWeeklyVolume` each fetched `getHistory()` once in a mount effect — at which point history was empty. Finishing a workout wrote IndexedDB but nothing told those panes; the list stayed "No workouts yet" until the user did a hard reload. This is the exact "saved but not visible in history" report.

**Steps to Reproduce:**
1. Open the app fresh (History tab never yet visited).
2. Start a workout, log sets, tap Finish Workout.
3. Switch to History.

**Expected Behavior:** The finished workout appears immediately.

**Actual Behavior (pre-fix):** "No workouts yet" — data only appears after a full page reload.

**Fix:** `finishSession()` now fires `notifyHistoryChanged()` after its transaction commits; History, Analytics, and useWeeklyVolume subscribe via `onHistoryChanged()` and refetch.

**Evidence:** tests/e2e-dogfood.cjs check "finished workout appears in History immediately (no reload)" — PASS post-fix.

---

### Issue #2: Workout duration wrong — every workout displayed as "1m"

| Field | Value |
|-------|-------|
| **Severity** | Critical |
| **Category** | Functional |
| **URL** | http://localhost:4173/ (History list rows) |

**Description:**
History computed duration from `updatedAt − startedAt`. But React state's `session.updatedAt` was set only once at `createEmptySession()`: the autosave effect writes `{...session, updatedAt: Date.now()}` — a throwaway copy to IndexedDB — so the in-memory `updatedAt` used by `finishWorkout()` stayed frozen at session creation. Every stored workout therefore had `duration ≈ 0` → clamped display of "1m". Compounding it, before this audit the autosave fired on mount too, stamping a bogus `updatedAt` on the just-loaded record.

**Steps to Reproduce:**
1. Work out for 45+ minutes, logging sets.
2. Finish the workout; open History.

**Expected Behavior:** Row shows ~45m / real elapsed time.

**Actual Behavior (pre-fix):** Row shows "1m".

**Fix:**
- `WorkoutSession` gained an immutable `finishedAt?: number`, stamped once by `finishSession()`.
- New pure module `src/lib/duration.ts` (`workoutDurationMs`, `formatDuration`, `workoutEndedAt`) is the single source of duration truth; History consumes it. Legacy records fall back to `updatedAt`.
- Autosave effects are gated on `hasLoadedRef` (no mount-time pollution).
- `createEmptySession()` gives every new workout fresh id/timestamps (finish/clear previously reused them).

**Evidence:** RED→GREEN integration test runs the production `database.ts`: `finishedAt` strictly greater than the stale `updatedAt`. E2E DB probe: `startedAt=1787627121108 updatedAt=1787627121108 finishedAt=1787627153664`.

---

### Issue #3: Seed transaction aborted on every first load (`DataError`)

| Field | Value |
|-------|-------|
| **Severity** | High |
| **Category** | Console / Functional-latent |
| **URL** | http://localhost:4173/ |

**Description:**
`doSeed()` wrote its version marker with `put(marker, SEED_VERSION_KEY)` — but the `recommendations` store uses in-line keys (`keyPath: 'exerciseId'`). Passing an explicit key throws `DataError: Failed to execute 'put' … key parameter was provided`, aborting the transaction and rolling back all 873 embedding writes. Caught by `.catch(console.error)`, so users saw nothing while seeding silently re-ran (and failed) on every app start.

**Steps to Reproduce:**
1. Clear site data, open app, read console.

**Expected Behavior:** One silent seeded write; marker present; no errors.

**Actual Behavior (pre-fix):** `DataError` ×1 per load; recommendations store empty.

**Fix:** Marker written without the explicit key argument (in-line keys derive it from the value). E2E console-cleanliness check now passes across a whole session.

---

### Issue #4: Silent persistence failures — finish/save errors swallowed

| Field | Value |
|-------|-------|
| **Severity** | High |
| **Category** | UX / Reliability |
| **URL** | http://localhost:4173/ (Finish flow) |

**Description:**
`onFinish={() => { void finishWorkout(); … }}` discarded any rejection from the IndexedDB write chain — a failed save produced zero feedback (the likely origin of intermittent "my workout didn't save" reports). Same pattern on autosaves.

**Fix:** `finishWorkout()` now rejects with descriptive errors; WorkoutSession catches and alerts ("Add at least one exercise…" / "Could not save your workout…"). All autosave writes have `.catch(console.error)`.

---

### Issue #5: Weight unit guessed per-workout from max weight

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Category** | UX |
| **URL** | http://localhost:4173/ (WorkoutDetail) |

**Description:** Detail view inferred lbs-vs-kg via `maxWeight >= 100` heuristic — a 90 kg bench displayed as "90 lbs". Sessions now persist the active `weightUnit` at finish; inference remains only as legacy fallback.

---

### Issue #6: Notification permission requested on synthetic events

| Field | Value |
|-------|-------|
| **Severity** | Low |
| **Category** | UX |
| **URL** | http://localhost:4173/ |

**Description:** Permission prompt could be triggered by programmatic/untrusted `pointerdown`/`keydown` (e.g. automated taps), risking a wasted browser permission prompt. Now gated on `event.isTrusted`.

---

## Issues Summary Table

| # | Title | Severity | Category | Status |
|---|-------|----------|----------|--------|
| 1 | Finished workouts invisible in History/Progress until reload | Critical | Functional | FIXED + tested |
| 2 | Duration always "1m" (autosave-mutated timestamp) | Critical | Functional | FIXED + tested |
| 3 | Seed transaction DataError aborts 873 writes every load | High | Console | FIXED + tested |
| 4 | Finish/autosave errors swallowed silently | High | UX | FIXED |
| 5 | Unit inferred from max weight instead of stored | Medium | UX | FIXED |
| 6 | Notification prompt on untrusted events | Low | UX | FIXED |

## Testing Coverage

### Tested
- Full journey E2E against production bundle: start → picker search ("Bench Press") → log 2 sets → rest-timer banner appears → survives tab switches → cancel → finish
- History immediacy (no reload), reload persistence, active-session reset, Analytics rendering without reload
- IndexedDB ground truth probes (finishedAt/weightUnit/set counts) straight from the browser
- Production `database.ts` under fake-indexeddb: finish stamps `finishedAt`, atomic write visible via `getHistory()`
- Pure duration helpers incl. legacy-record fallback
- Console error cleanliness across the entire session

### Not tested / out of scope
- Real iOS Safari device behaviors (Wake Lock, app badge, haptics) — desktop Chromium only
- Visual pixel-regression; template rename/delete UI beyond smoke coverage
- Recommendation ranking quality (engine untouched)

### Blockers
- In-browser tooling required manual Chrome remote-debugging approval (user AFK); switched to headless Playwright — no coverage lost.

---

## Notes
- Four `waR` entries added to ARCHITECTURE.md codifying each bug class.
- New dev deps: vitest, fake-indexeddb, playwright (dev-only; runtime dependency list unchanged per ARCHITECTURE.md rules).
- Bundle warning (main chunk >500 kB) pre-existed; recommendation engine dominates size — candidate for future code-splitting, out of scope today.
