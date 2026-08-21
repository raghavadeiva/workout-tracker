# Hypertrophy

I got tired of using my notes app to keep track of my gym progress. I went from free trial to free trial on different workout tracking apps, but none felt worth the money. So I made my own!

**A High-Performance, Local-First Workout Tracking PWA**

> Built for speed. Designed for the gym. Zero backend. Zero latency. Complete privacy.

**🌐 Live at [hypertrophy-sigma.vercel.app](https://hypertrophy-sigma.vercel.app)** — installable via iOS Safari Share → *Add to Home Screen*.

[![Built with React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps)
[![IndexedDB](https://img.shields.io/badge/IndexedDB-Local_Storage-FF6B00?logo=databricks&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
[![Deployed](https://img.shields.io/badge/Vercel-Live-000000?logo=vercel&logoColor=white)](https://hypertrophy-sigma.vercel.app)

---

## Overview

**Hypertrophy** is a production-grade Progressive Web Application for tracking resistance training workouts. Inspired by Setgraph, it prioritizes **ultra-low-friction logging** — every interaction is optimized for one-thumb operation between sets.

**Zero backend. Zero network dependency. Zero latency.** All state lives in IndexedDB on your device. The app works identically online, offline, or on a plane at 35,000 feet.

---

## Key Features

### 🏋️ Workout Sessions
- **Start screen** with one-tap "Start Workout" and template quick-start rows
- **Smart set logging** — weight/reps pre-filled from your last set; ± steppers (±2.5 lbs / ±1 rep); Enter-key flow between fields
- **90s rest timer** auto-starts on log — timestamp-based so background time counts correctly; survives tab switches **and app reloads**
- **Timer visibility everywhere** — live countdown in the browser tab title, app badge on supported devices, completion chime + haptics + notification if you've switched away
- **lbs/kg toggle** persisted across sessions

### 📋 Custom Template Engine
- **Save as Template** — one-tap capture of exercise structure (no history coupling)
- **Template library** — browse, search, **rename**, **delete**; sorted by last used
- **Start from Template** — instantiates a fresh session with exercises pre-loaded
- **Ghost set pre-fill** — previous workout's sets shown per exercise, scoped strictly by exercise name

### ⭐ 873-Exercise Library
- **Full commercial-grade exercise database** — 873 exercises with primary/secondary muscle mapping, equipment type, difficulty level, and category
- **Favorites** — star any exercise; favorites float to the top of the picker with a filter chip
- **Multi-term search** — e.g. `dumbbell shoulder` finds every dumbbell shoulder movement

### 🧠 Vector Recommendation Engine
- **Cosine similarity over 873 exercises** — each mapped to a 20-dimension muscle-activation vector (primary muscles 1.0, secondary 0.5), generated from the raw dataset by [`scripts/exercises-seeder.js`](scripts/exercises-seeder.js)
- **In-workout exercise swap** — tap the swap icon on any exercise card to see ranked biomechanical alternatives with match %
- **Equipment-aware filtering** — only suggests exercises matching your available gear (barbell / dumbbell / machine / bodyweight buckets)
- **Plateau detection** — flags when an exercise's estimated 1RM has stalled across recent sessions and offers swaps
- **Zero external API** — all computation client-side, instant, private

### 📊 Progress Analytics
- **Epley 1RM progression chart** per exercise — Current / Best / signed Change stat tiles
- **Weekly sets per muscle group** — evidence-based fractional-set counting (primaries 1.0, secondaries 0.5), not meaningless tonnage
- **Volume alerts** — overtrained (>25 sets/wk) and undertrained (<4 sets/wk) muscle flags
- **Muscle balance** — stacked Push/Pull/Legs distribution bar derived from real weekly volume
- Formula: `1RM = weight × (1 + reps / 30)`

### 📱 PWA & Mobile Excellence
- **Installable on iOS Safari** — standalone display, no URL bar
- **Offline-first** — Workbox precache; works with airplane mode on
- **Safe-area insets** — respects notch, Dynamic Island, home indicator
- **Light theme design system** — Inter + Material Symbols, ported from Google Stitch

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | React 19 (function components, hooks) |
| **Language** | TypeScript (strict mode) |
| **Build** | Vite 8 + `@vitejs/plugin-react` |
| **Styling** | Tailwind CSS 4 (`@import "tailwindcss"`, `@theme` tokens, light theme) |
| **Storage** | IndexedDB via `idb` wrapper (v6 schema: sessions, settings, history, templates, recommendations, timerState) |
| **Charts** | Recharts |
| **Animation** | Framer Motion (spring physics) |
| **PWA** | `vite-plugin-pwa` + Workbox (auto-update SW) |
| **Icons & Type** | Material Symbols Outlined + Inter |
| **Lint** | Oxlint |

---

## Architecture Highlights

### Offline-First by Design
- **IndexedDB schema v6** — `activeSession`, `settings`, `history`, `templates`, `recommendations`, `timerState`
- **Repository pattern** — Components → Hooks → DB layer; components never touch IndexedDB directly
- **Version-gated seeding** — the 873-record recommendation store writes once per dataset change, not per load
- **Auto-migration** — `openDB` upgrade callback handles schema evolution

### Timestamp-Based Rest Timer
The timer stores an absolute end time and derives remaining seconds as `ceil((endsAt − now)/1000)` — browser throttling in background tabs can't cause drift. Persisted to IndexedDB, restored on launch, lifted to app-level context so switching tabs never resets it.

### Bounce-Free Tab Navigation
Each tab renders into a permanent scroll pane; inactive panes are `display:none`. No remounts, no layout shift, per-tab scroll preserved — tab-switch bounce is impossible by construction.

### iOS Safari Optimizations
- **No fixed modal overlays** for interactive lists — conditional full-page render swaps
- **Dynamic viewport units** (`h-dvh`) instead of `100vh`
- **Custom `generateId()`** — avoids `crypto.randomUUID()` crashes on unencrypted LAN IPs

### Client-Side Algorithmic Processing
- **Epley 1RM** — computed per set, best-per-session, charted over all history
- **Cosine similarity** — 20-dim vectors, ~35k multiply-accumulates worst case, sub-millisecond
- **Zero network calls** — all inference runs in-browser

---

## Getting Started

### Prerequisites
- Node.js 20+
- npm 10+

### Install & Run
```bash
git clone https://github.com/YOUR_USERNAME/hypertrophy.git
cd hypertrophy
npm install
npm run dev -- --host   # LAN-accessible for iPhone testing
```

Open the URL on your iPhone Safari → Share → **Add to Home Screen**.

### Regenerate the Exercise Library
After editing `exercises.json` (or the muscle schema inside the seeder):
```bash
node scripts/exercises-seeder.js
```

### Build & Deploy
```bash
npm run build          # outputs dist/
npx vercel --prod      # deploys (config in vercel.json: SPA rewrite + cache tiers)
```

---

## Project Structure

```
scripts/
└── exercises-seeder.js        # exercises.json → generated vector library
src/
├── components/MaterialIcon.tsx # Material Symbols wrapper
├── db/database.ts              # idb schema v6, migrations, CRUD, favorites, timer persistence
├── hooks/
│   ├── useWorkoutSession.ts    # active workout + templates CRUD
│   └── useRestTimer.tsx        # timestamp-based timer context provider
├── features/
│   ├── workout/components/     # WorkoutSession (start screen + session), ExerciseSelector,
│   │                           #   SetInput (steppers), SetRow, RestTimerBanner
│   ├── history/components/     # History list → WorkoutDetail tables
│   ├── analytics/
│   │   ├── components/         # Progress: picker, stats, 1RM chart, volume, balance
│   │   ├── plateauDetection.ts
│   │   └── utils/math.ts       # Epley 1RM + progression series
│   ├── recommendations/
│   │   ├── exerciseVectors.generated.ts # AUTO-GENERATED: 873 × 20-dim vectors
│   │   ├── exerciseVectors.ts  # API: getRecommendations(), getAllExerciseNames(), equipment buckets
│   │   ├── useRecommendations.ts
│   │   ├── vectorUtils.ts      # cosine similarity math
│   │   └── components/ExerciseSwap.tsx
│   └── volume/
│       ├── muscleMaps.ts       # activation lookup: hand-tuned + generated library bridge
│       ├── volumeUtils.ts      # weekly fractional sets, risk thresholds, balance
│       └── useWeeklyVolume.ts
├── styles/tokens.ts            # typed token reference
├── App.css                     # component classes (.card, .btn-primary, .segmented, …)
├── index.css                   # Tailwind v4 @theme tokens, Inter + Material Symbols
└── App.tsx                     # pane-per-tab shell, pill tab bar, RestTimerProvider
```

---

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| **No backend / auth / sync** | Gym has spotty signal; privacy-first; zero maintenance |
| **IndexedDB + `idb`** | Typed, migratable, offline-native |
| **Absolute-timestamp timer** | Background throttling can't drift an epoch-math countdown |
| **Pane-per-tab shell** | Unmount/remount on tab switch caused bounce; panes make it structurally impossible |
| **Generated data file + API module** | Seeder output is never hand-edited; API layer survives regeneration |
| **Sets (not tonnage) as volume unit** | Matches hypertrophy research convention; comparable across exercises |
| **Equipment buckets, not vector dims** | Dataset equipment is a field; unknown tools default to available rather than wrongly filtered |
| **Conditional render swap** | iOS Safari swallows taps in fixed modals with scroll |
| **Epley 1RM** | Industry standard; simple; correlates well with tested 1RM |

---

## Performance

| Metric | Value |
|--------|-------|
| **Bundle (gzipped)** | ~236 KB (includes full 873-exercise dataset) |
| **Precache** | ~880 KB (6 entries) |
| **Offline load** | Instant (precache) |
| **Recommendation latency** | < 5ms (873 × 20-dim cosine sweep) |

---

## License

MIT — use it, fork it, build on it.

---

## Acknowledgments

- Inspired by **Setgraph** (best-in-class workout UX)
- Exercise dataset: community-sourced strength training database (873 exercises)
- **Epley formula** — standard 1RM estimation
- Built with **Vite**, **React**, **Tailwind CSS 4**, **Recharts**, **Framer Motion**, **Workbox**
