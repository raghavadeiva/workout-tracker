# Hypertrophy

I got tired of using my notes app to keep track of my gym progress. I went from free trial to free trial on different workout tracking apps, but none felt worth the money. So I made my own!

**A High-Performance, Local-First Workout Tracking PWA**

> Built for speed. Designed for the gym. Zero backend. Zero latency. Complete privacy.

[![Built with React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps)
[![IndexedDB](https://img.shields.io/badge/IndexedDB-Local_Storage-FF6B00?logo=databricks&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)

---

## Overview

**Hypertrophy** is a production-grade Progressive Web Application for tracking resistance training workouts. Inspired by Setgraph, it prioritizes **ultra-low-friction logging** — every interaction is optimized for one-thumb operation between sets.

**Zero backend. Zero network dependency. Zero latency.** All state lives in IndexedDB on your device. The app works identically online, offline, or on a plane at 35,000 feet.

---

## Key Features

### 🏋️ Workout Sessions
- **Active workout view** with large touch targets (≥48px) and auto-focus inputs
- **Smart set logging** — weight/reps auto-populated from previous set
- **90s rest timer** auto-starts on log; ±15s/+30s adjust; haptic dismiss
- **lbs/kg toggle** persisted across sessions

### 📋 Custom Template Engine
- **Save as Template** — one-tap capture of exercise structure (no history coupling)
- **Template library** — browse, search, delete; sorted by last used
- **Start from Template** — instantiates fresh session with exercises pre-loaded
- **Ghost set pre-fill** — previous workout's sets appear faintly above active inputs for each exercise

### 📊 Epley 1RM Analytics
- **Per-exercise progression chart** (Recharts line chart, monotone interpolation)
- **Current 1RM** (last session) + **All-Time Best** stat cards
- **Exercise selector** dropdown populated from actual history
- **Epley formula**: `1RM = weight × (1 + reps / 30)`

### 🧠 Cosine Similarity Recommendation Engine
|- **Vector-based exercise profiling** — 20-dimension movement pattern vectors
|- **Real-time suggestions** — ranks template/library exercises by biomechanical similarity
|- **Muscle group & plane-of-motion awareness** — balances push/pull, vertical/horizontal
|- **Equipment-aware filtering** — only suggests exercises matching your available gear
|- **In-workout exercise swap** — tap the replace icon on any exercise card to find alternatives
|- **Zero external API** — all computation client-side, instant, private

### 📊 Weekly Volume & Balance Tracking
|- **Fractional muscle activation** — each exercise maps to muscle groups with weighted multipliers
|- **ISO week bucketing** — volume aggregated per muscle group per week
|- **Overtraining/undertraining alerts** — flags muscles with excessive or insufficient weekly volume
|- **Muscle balance analysis** — identifies imbalanced muscle development from volume distribution

### 📱 PWA & Mobile Excellence
- **Installable on iOS Safari** — `display: standalone`, no URL bar
- **Offline-first** — Workbox precache + runtime caching
- **Safe-area insets** — respects notch, Dynamic Island, home indicator
- **Lighthouse PWA ≥ 90** — validated on device

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | React 19 (function components, hooks) |
| **Language** | TypeScript 6 (strict mode, no `any`) |
| **Build** | Vite 5 + `@vitejs/plugin-react` (Vite 8.x installed) |
| **Styling** | Tailwind CSS 4 (utility-first, dark mode) |
| **Storage** | IndexedDB via `idb` wrapper (v4 schema, migrations) |
| **Charts** | Recharts 2 (responsive, accessible) |
| **PWA** | `vite-plugin-pwa` + Workbox (auto-update SW) |
| **Icons** | Lucide React (tree-shakeable, 1KB/icons) |
| **Lint** | Oxlint (fast, zero-config) |

---

## Architecture & Engineering Highlights

### Offline-First by Design
|- **IndexedDB schema v4** — `activeSession`, `settings`, `history`, `templates`, `recommendations` stores
- **Repository pattern** — clean separation: Components → Hooks → DB layer
- **Optimistic writes** — UI updates instantly; persistence async
- **Auto-migration** — `openDB` upgrade callback handles schema evolution

### iOS Safari Touch Optimizations
- **No fixed modal overlays** — conditional full-page render swaps (`if (showSelector) return <Selector />`)
- **Semantic `<button>` elements** — `type="button"`, `cursor-pointer`, `active:` states
- **Dynamic viewport** — `env(safe-area-inset-bottom)` for Dynamic Island/home indicator
- **`crypto.randomUUID()` avoided** — custom `generateId()` works on unencrypted local IPs

### Client-Side Algorithmic Processing
- **Epley 1RM** — computed per set, aggregated per session, charted over time
- **Cosine similarity** — 8D exercise vectors → ranked recommendations in <5ms
- **Zero network calls** — all ML-style inference runs in-browser, instantly

### Strict React Discipline
- **Hooks at top level** — before any conditional returns
- **Stable dependencies** — destructured callbacks for `useCallback` deps
- **No `any`** — strict TypeScript, colocated types, discriminated unions

---

## Getting Started

### Prerequisites
- Node.js 20+
- npm 10+

### Install & Run
```bash
# Clone
git clone https://github.com/YOUR_USERNAME/hypertrophy.git
cd hypertrophy

# Install dependencies
npm install

# Start dev server (accessible on LAN for iPhone testing)
npm run dev -- --host
```

Open `http://localhost:5173` (or the LAN IP shown) on your iPhone Safari → Share → **Add to Home Screen**.

### Build for Production
```bash
npm run build
npm run preview   # test production build locally
```

### Deploy (Vercel)
```bash
npx vercel --prod
```

---

## Project Structure

```
src/
├── db/
│   └── database.ts          # IndexedDB schema, migrations, CRUD
├── hooks/
│   ├── useWorkoutSession.ts # Active workout + templates + ghost sets
│   └── useRestTimer.ts      # 90s auto-timer with adjust/dismiss
├── features/
│   ├── workout/
│   │   └── components/      # WorkoutSession, ExerciseCard, SetInput, SetRow, RestTimerBanner
│   ├── history/
│   │   └── components/      # History list, WorkoutDetail
│   ├── analytics/
│   │   ├── components/      # Analytics (1RM charts + recommendations + volume)
│   │   ├── plateauDetection.ts
│   │   └── utils/math.ts
│   ├── recommendations/
│   │   ├── vectorUtils.ts         # dot product, magnitude, cosine similarity
│   │   ├── exerciseVectors.ts     # 20-dim embedding vectors, getRecommendations()
│   │   ├── useRecommendations.ts  # reactive hook with memoization + equipment filtering
│   │   └── components/
│   │       ├── ExerciseSwap.tsx   # swap button + dropdown with alternatives
│   │       └── EquipmentPreferences.tsx # equipment toggle panel
│   └── volume/
│       ├── muscleMaps.ts    # Fractional muscle activation multipliers
│       ├── volumeUtils.ts   # calculateWeeklyVolume, getLatestWeekVolumes
│       └── useWeeklyVolume.ts
├── index.css               # @import "tailwindcss"
└── App.tsx                 # Three-tab nav: Workout | History | Progress
```

---

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| **No backend / auth / sync** | Gym has spotty signal; privacy-first; zero maintenance |
| **IndexedDB + `idb`** | Native browser API; typed; supports migrations; works offline |
| **Conditional render swap** | iOS Safari swallows taps in fixed modals with scroll |
| **Cosine similarity** | Interpretable, no training data, instant, runs on-device |
| **Epley 1RM** | Industry standard; simple; correlates well with tested 1RM |
| **90s default rest** | Evidence-based for hypertrophy (60–120s) |
| **Vite + Tailwind** | Sub-second HMR; minimal bundle; utility-first = no CSS files |

---

## Performance

| Metric | Target |
|--------|--------|
| **Bundle (gzipped)** | < 200 KB |
| **Lighthouse PWA** | ≥ 90 |
| **Time to Interactive** | < 2s on 3G |
| **Offline load** | Instant (precache) |
| **Recommendation latency** | < 5ms |

---

## Roadmap

### ✅ Complete
Phases 0-6, 8-14 — Foundation, persistence, history, rest timer, analytics, PWA, templates, **873-exercise vector recommendation engine**, weekly volume tracking, **UI redesign (Stitch design system)**, **timestamp-based timer engine**, **template & history fixes**, **exercise database expansion**

### 📋 Next (Phase 7)
Production deployment — static hosting (Vercel), HTTPS, cache headers. All feature phases are complete; the app is deploy-ready via `npx vercel`.

---

## License

MIT — use it, fork it, build on it.

---

## Acknowledgments

- Inspired by **Setgraph** (best-in-class workout UX)
- **Epley formula** — standard 1RM estimation
- **Cosine similarity** — classic information retrieval, applied to movement patterns
- Built with **Vite**, **React**, **Tailwind**, **Recharts**, **Workbox**