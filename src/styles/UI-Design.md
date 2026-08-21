# Phase 11 — UI Design Reference

> Complete visual rebuild from scratch following Apple design principles.
> This document is the single source of truth for the Phase 11 implementation.
> All decisions map to sections in the `/apple-design` skill.

## 1. Design Foundation

### 1.1 Visual Identity

| Token | Value | Usage |
|---|---|---|
| **Primary** | `#007AFF` (systemBlue) | Accent, active states, primary buttons |
| **Secondary** | `#383232` on light, `#383232` on dark | Base text |
| **Background** | Light: `#F8F8F8` — Dark: `#000000` | Root surface |
| **Secondary BG** | Light: `#FFFFFF` — Dark: `#1C1C1E` | Elevated surfaces (cards, sheets) |
| **Tertiary BG** | Light: `#F2F2F7` — Dark: `#2C2C2E` | Grouped content (exercise lists, form fields) |
| **Separator** | Light: `#D1CECE` — Dark: `#38383A` | Borders, dividers |
| **System Red** | `#FF3B30` | Destructive actions |
| **System Green** | `#34C759` | Positive actions (finish workout) |
| **System Orange** | `#FF9500` | Warnings, alerts |
| **System Gray** | Light text: `#8E8E93` — Dark text: `#A1A1A5` | Secondary/muted text |

### 1.2 Material & Depth

**Three-layer depth system** (from Apple Design §12 — materials convey hierarchy):

1. **Background** — solid root color. No blur. Content scrolls here.
2. **Secondary Group** — tertiary BG color, no blur. Contains cards and form fields.
3. **Elevated Surface** — secondary BG color with `backdrop-filter: blur(20px) saturate(180%)` + subtle shadow. Floating chrome (headers, tab bar, timer banner, floating buttons).

**Shadow stack** (subtle, Apple-style):
```css
/* Elevated surface */
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 2px 8px rgba(0, 0, 0, 0.08);
/* Floating chrome (header/tab bar) */
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 4px 12px rgba(0, 0, 0, 0.08);
```

**Translucent chrome** (sticky headers, bottom tab bar):
```css
background: rgba(255, 255, 255, 0.6) dark: rgba(28, 28, 30, 0.6);
backdrop-filter: blur(20px) saturate(180%);
border-top: 1px solid rgba(209, 206, 206, 0.5) dark: rgba(56, 56, 58, 0.5);
```

### 1.3 Spacing Grid

**4px modular grid** — all padding/margin/gap values snap to this scale:
```
4, 8, 12, 16, 20, 24, 28, 32, 36, 40
```

### 1.4 Border Radius

| Element | Radius |
|---|---|
| Cards (exercise, stats) | 16px |
| Form fields, buttons | 12px |
| Chips, tags | 9999px (capsule) |
| Modal/sheet containers | 20px |
| Full-screen pages | 0 (edge-to-edge) |

### 1.5 Typography

**System font stack** (SF Pro via system-ui):
```css
font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', system-ui, sans-serif;
```

**Typography scale** (size-specific tracking per Apple Design §15):

| Role | Size | Leading | Tracking | Weight | Font |
|---|---|---|---|---|---|
| Display (page titles) | 32px → clamp(28px, 6vw, 36px) | 1.05 | -0.02em | 700 | SF Pro Display |
| Large Title (screen header) | 22px | 1.15 | -0.01em | 700 | SF Pro Display |
| Title (card headers) | 18px | 1.2 | -0.005em | 600 | SF Pro Text |
| Body | 17px | 1.45 | 0 | 400 | SF Pro Text |
| Callout (secondary) | 15px | 1.4 | 0.01em | 400 | SF Pro Text |
| Caption | 13px | 1.35 | 0.02em | 400 | SF Pro Text |
| Mono (numbers: sets, weight) | 17px | 1.45 | 0 | 400 | SF Mono, monospace |

### 1.6 Touch Targets

Minimum **44x44px** (Apple HIG). Prefer **48x48px** for primary actions. No exceptions.

### 1.7 Motion Tokens

All motion uses **springs** (Apple Design §4), never CSS transitions for interactive elements:

| Use | Damping | Response | Bounce | Notes |
|---|---|---|---|---|
| Surface enter/exit | 1.0 | 0.25 | 0 | Critically damped |
| Button press | 1.0 | 0.15 | 0 | Instant feedback |
| Tab switch | 1.0 | 0.3 | 0 | Content swap |
| Card expand | 1.0 | 0.35 | 0 | Layout changes |
| Flick/dismiss | 0.8 | 0.4 | 0.2 | Momentum-driven — only if gesture carried velocity |
| Timer tick | 1.0 | 0.1 | 0 | Subtle |
| Sheet drag | 0.8 | 0.3 | 0.1 | Live with finger, velocity handoff on release |

**Reduced motion** (Apple Design §14): `@media (prefers-reduced-motion: reduce)` replaces all springs with 200ms opacity cross-fades. No transforms, no bounce.

---

## 2. Global Layout

### 2.1 Bottom Tab Bar (App.tsx)

**Current:** Simple flex bar with icon + label, `backdrop-blur`, gray background.

**Redesign:** True Apple-style tab bar.

- Fixed to bottom, `z-50`, full-width.
- Translucent material: `rgba(255,255,255,0.6) dark: rgba(28,28,30,0.6)` + `backdrop-filter: blur(20px)`.
- Safe area inset: `pb-[env(safe-area-inset-bottom)]` (min 20px).
- 3 tabs: Workout (Dumbbell), History (List), Progress (BarChart2).
- Active tab: `text-blue-600` + `fill-current` on icon. Inactive: `text-gray-500`.
- Label font: 10px, uppercase, tracking 0.05em. SF Pro Text medium.
- Tab height: 49px (Apple HIG minimum). Icon + label stacked.
- Active indicator: subtle `bg-blue-50 dark: bg-blue-950/30` rounded-full behind active icon (not Apple's standard but common and clear).
- Spring on tab switch: content area cross-fades + slides with `translate-y` spring at damping 1.0, response 0.3.

### 2.2 Sticky Headers

All sticky headers across all screens follow the same pattern:
- Height: 44px
- Translucent material (see §1.2)
- Safe area: `pt-[env(safe-area-inset-top)]`
- Back button (if not root): 28x28 rounded-full, `bg-gray-100 dark: bg-gray-800`, ChevronLeft icon
- Title: 18px, SF Pro Display semibold, center-aligned
- Trailing actions: icon buttons at 28x28 rounded-full

---

## 3. Screen Designs

### 3.1 Active Workout (WorkoutSession.tsx)

**Layout structure:**
```
[ Header: sticky, translucent ]
[ Main content: scrollable, pb-24 (clears tab bar + timer) ]
[ RestTimerBanner: fixed bottom-20 ]
[ Tab bar: fixed bottom-0 ]
```

**Header:**
- Left: Dumbbell icon in 32x32 rounded-xl circle (`bg-blue-100 dark: bg-blue-900/30`). Title "Active Workout" (22px SF Pro Display bold).
- Right group: Weight unit segmented control + Save Template button.
  - Segmented control: horizontal pill group, `bg-gray-100 dark: bg-gray-800`, rounded-xl. Selected segment gets elevated shadow + secondary BG. 44x28 touch area each.
  - Save button: 28x28 rounded-full icon button (`Save` icon), only visible when exercises exist.

**Empty state (no exercises):**
- Full-page scroll center: Dumbbell icon (48x48, muted), title "No Exercises", subtitle "Tap below to add your first exercise."
- If templates exist: scrollable horizontal list of template cards above the button.
  - Each template card: 36x44 rounded-xl, secondary BG, shows name + exercise count. Tap → starts session from template with ghost previous sets.
- Primary button: full-width, rounded-2xl, `bg-blue-600` with white text, 48px height. Leading Plus icon. "Add Exercise" or "Start Blank Workout."
- Spring on mount: each element fades in + slides up with delay (16ms per item, Apple Design spring defaults).

**Active state (exercises exist):**
- "Add Exercise" button becomes a floating secondary (outline) button, full-width, between header and first card. 44px height.
- Scroll area: vertical stack of ExerciseCards with 12px gap.

**RestTimerBanner:**
- Fixed `bottom-24` (above tab bar), full-width, centered.
- Translucent material card, rounded-full, horizontal padding.
- Timer display: `font-mono`, 20px, SF Pro Display bold. MM:SS format.
- Adjust buttons: -15s / +30s, secondary text style.
- Dismiss: circular X button, red.
- All interactions use `cursor-pointer` (mouse) + `:active` scale(0.97) spring feedback (Apple Design §1, §10).
- When timer ends: plays sound (Audio API — Phase 12 fix), pulses with `animate-pulse` or spring scale bounce.

### 3.2 Exercise Card (ExerciseCard.tsx)

**Structure (vertical stack, 12px gap):**
1. **Header row** (flex, justify-between, px=4, items center):
   - Delete button: 28x28 rounded-full, `text-red-500`, Trash2 icon. On tap: red scale + haptics.
   - Action group (flex gap-2):
     - Reorder handle: 28x28, GripVertical icon. (Could be swipe-to-reorder — see §4.)
     - ExerciseSwap button: 28x28 rounded-full, Replace icon, blue.

2. **Ghost Previous Sets** (conditional):
   - If `previousSets` exists and has entries: subtle card, `bg-gray-50 dark: bg-gray-900/50`, rounded-xl, border.
   - Header: Clock icon + "Previous Workout" label (caption, gray).
   - Each set: mono text, muted gray, `Set {n} · {weight} × {reps}`.
   - **Fix note (Phase 13):** The bleeding bug ("shadow notes populate INSIDE the type field") likely comes from the ghost sets rendering in the wrong exercise context. The redesign ensures `previousSets` is strictly tied to the correct exercise by `name` match (see database.ts `getPreviousPerformance`). Visual separation: ghost sets are clearly read-only, gray-on-gray, never editable.

3. **SetInput** (full-width, interactive):
   - Card: rounded-2xl, secondary BG, border, shadow-subtle.
   - Header: exercise name (17px bold) + set number badge (`Set {n}` in blue capsule).
   - Weight/Reps inputs: large (24px mono font), number type, step based on unit.
     - Weight: step=5 for lbs, step=2.5 for kg.
     - Reps: step=1.
   - **Auto-focus chain** (Apple Design §1 — instant response): after logging, weight input refocuses with pre-filled weight value; reps clears. Enter key moves weight→reps, Enter on reps logs.
   - Log button: full-width, 44px height, rounded-xl. Blue when enabled (`bg-blue-600`), gray when disabled. Shows spinner during `isLogging`.

4. **Completed Sets** (conditional, vertical stack, 8px gap):
   - Header: "Completed Sets" caption, uppercase.
   - Each SetRow: rounded-xl card, flex layout.
     - Set number: mono, 13px, gray.
     - Weight: mono, 17px, bold.
     - Reps: mono, 17px.
     - Timestamp: caption, gray (when set was completed).
     - Delete (X icon): 24x24, red, on tap → spring shrink + remove.

**Card-level styling:** 
- Background: secondary BG (white / #1C1C1E).
- Border: 1px solid separator.
- Radius: 16px.
- Shadow: `0 1px 3px rgba(0,0,0,0.04)` + `0 2px 8px rgba(0,0,0,0.06)`.
- **Spring on add/remove** (Apple Design §3, §4): when an exercise card is added, it springs in (scale 0.9 → 1, opacity 0 → 1, damping 1.0, response 0.25). When deleted, springs out. Use `framer-motion`/`motion` `AnimatePresence` for exit animations.

### 3.3 Exercise Selector (ExerciseSelector.tsx)

**Unchanged interaction pattern** (per architecture waR: iOS touch bug — must be conditional full-page render swap). But full visual redesign:

- Full-page swap (no modal overlay). `if (showSelector) return <ExerciseSelector />`.
- Status bar: translucent, safe-area-inset-top.
- Header (44px): Back button (28x28 rounded-full), title "Add Exercise" (centered), spacer.
- Search input: full-width, rounded-xl, `bg-gray-100 dark: bg-gray-800`, 44px height. Placeholder "Search exercises...". Clear button (X) when text present.
- Exercise list: vertical divider list, `divide-y divide-separator`.
  - Each item: 44px min height (Apple HIG), text-left, active state `bg-gray-100 dark: bg-gray-800`.
  - Exercise name: 17px body. No secondary text needed (could add muscle target later — Phase 14).
  - On tap: spring feedback (scale 0.97), then calls `onSelect` + `onClose`.
- Empty state: "No exercises found" centered.

**Search:** filters `COMMON_EXERCISES` + template exercise names. Debounced 150ms (Apple Design §1 — minimize disambiguation delays; search is not a tap target so small debounce is fine).

### 3.4 History (History.tsx)

**Layout:**
- Sticky header (44px): title "History" + count badge (`{n} workouts`).
- Scrollable list.

**Empty state:**
- Centered icon + "No workouts yet" + "Complete your first workout to see it here."
- Icon: Dumbbell, 64x64, heavily muted.

**History list items:**
- Card: rounded-2xl, secondary BG, full-width, border.
- Layout: flex, items-center, gap-12.
  - Left: date + duration + exercise count + total sets (vertical).
    - Date: 16px bold, SF Pro Text.
    - Duration: 14px body, gray.
    - Stats row: two captions: "3 exercises · 12 sets."
    - Exercise names: 14px gray, truncate, max 1 line.
  - Right: ChevronRight, 20x20, gray.
- **Spring on hover/tap** (Apple Design §1): `:active` scale 0.97, `cursor-pointer`.
- Each row has unique `key={session.id}`.
- Date formatting: relative ("Today, 2:45 PM", "Yesterday, ...", "Tue, Aug 12").

### 3.5 Workout Detail (WorkoutDetail.tsx)

**Unchanged structure** but redesigned visually:

- Sticky header (44px): Back arrow (28x28 rounded-full) + date title + duration/exercise count subtitle.
- Scrollable content.
- Each exercise: card (rounded-2xl, border), header with name + set count, vertical list of sets.
  - Each set: `Set {n}` · `{weight} {unit} × {reps} reps` + timestamp.
  - Read-only — no inputs, no edit (Phase 13 may add edit).
- Empty state: Dumbbell icon + "No exercises logged."

### 3.6 Analytics (Analytics.tsx)

**Layout (vertical stack, px=16, py=12, pb-24):**

1. **Header** (sticky, 44px): "Progress" title.

2. **Exercise selector dropdown:**
   - Trigger: rounded-xl card, 44px height, flex items center, gap-8.
     - Dumbbell icon in circle. Exercise name. ChevronDown.
   - Dropdown (absolute, below trigger): rounded-xl card, border, max-h-60 overflow-y-auto.
     - Each item: 40px height, hover state. Selected gets blue left border.
   - **Spring** on dropdown open: scaleY from 0.95 + opacity 0 → 1, origin top, damping 1.0, response 0.2.

3. **Stats cards** (2-column grid, gap=8):
   - "Current 1RM" card: rounded-xl, border, p=12. Label (caption, gray), value (24px mono bold).
   - "All-Time Best" card: same, blue accent on value.

4. **Plateau alert** (conditional, when `isPlateaued`):
   - Amber card: rounded-xl, `bg-amber-50 dark: bg-amber-900/20`, border `amber-200`.
   - AlertTriangle icon + "Plateau Detected" + description.
   - Recommendations list inside: each rec in rounded-lg card, name + match % (mono).

5. **1RM Progress Chart** (Recharts):
   - Card: rounded-2xl, p=12, border.
   - LineChart, full-width, height 280px.
   - **Fix note (Phase 13):** The plan says the chart only plots first/last session. Looking at `math.ts::getExerciseProgression`, it actually pushes one entry per session and sorts ascending — so all data points ARE returned. If the chart only shows 2 points, the bug is likely in data rendering, not in `getExerciseProgression`. The redesign should verify all points render.
   - Monotone interpolation, blue stroke, dot on hover.
   - XAxis: date labels, rotated. YAxis: numeric.

6. **Weekly Muscle Volume section** (collapsible? or always visible):
   - Title "Weekly Muscle Volume" (14px medium).
   - For each muscle group (reversed order, calves → chest):
     - Label (12px gray, w-24) + max volume (mono, 14px).
     - Bar: h=8px, rounded-full, `bg-teal-500`. Width proportional to `volume/5000 * 100%`.
     - Mini sparkline: last 4 weeks as tiny text dots (week labels).
   - **Spring on load:** staggered fade-in + slide-up, 16ms delay per muscle.

7. **Volume Alerts** (conditional):
   - Title "Volume Alerts" (14px medium, uppercase).
   - Each alert: rounded-xl card, left icon dot.
     - Overtrained: red bg, red dot. "Overtrained" + volume.
     - Undertrained: amber bg, amber dot. "Undertrained" + volume.
   - **Spring:** alerts drop in from top, damping 1.0, response 0.25.

8. **Muscle Balance** (always visible if there's volume data):
   - Title "Muscle Balance" (14px medium, uppercase).
   - Top 5 muscles by deviation: label + percentage + bar.
   - Bar color: teal (balanced), red (over >15%), amber (under <5%).
   - **Same bar pattern as volume section.**

### 3.7 Exercise Swap (ExerciseSwap.tsx)

- Trigger: 28x28 rounded-full icon button, Replace icon, blue.
  - On hover/active: blue scale + bg.
- Dropdown (absolute, top-full, right-0, w-56): rounded-xl card, border, shadow-xl.
  - Header: "Alternatives" caption + close (X) button.
  - Body: max-h-60 overflow-y-auto.
    - Each rec: flex justify-between, name (15px medium) + match % (mono 12px gray).
    - On tap: calls `onSwapExercise` + closes dropdown.
  - Empty state: "No alternatives found" (when filtered by equipment).
- **Spring** on dropdown open: same as Analytics dropdown trigger.

### 3.8 Equipment Preferences (EquipmentPreferences.tsx)

- Collapsible panel, fixed bottom (above tab bar when expanded).
- Trigger: rounded-xl card, full-width, 44px height, flex justify-between.
  - "Available Equipment" (14px medium) + ChevronDown/Up.
- Expanded panel: rounded-xl card below trigger, p=12.
  - Chips: horizontal flex-wrap, gap=8.
  - Each chip: `bg-gray-100 dark: bg-gray-800` rounded-full, 36px height. Active: `bg-blue-600` text-white.
  - 4 chips: Barbell, Dumbbell, Machine, Bodyweight.
- **Spring** on expand: height auto + opacity from 0, damping 0.9, response 0.25.

---

## 4. Gestures & Interactions

### 4.1 Swipe to Delete Exercise (new)

**Apple Design §2, §4, §6** — direct manipulation with momentum.
- On ExerciseCard, add horizontal swipe gesture (Pointer Events).
- Track 1:1: card translates with finger, grab offset = where they grabbed.
- Hysteresis: ~20px before committing to delete state.
- On release: if past threshold, spring to full reveal (red background shows); if not, spring back.
- Reveal: red "Delete" button (44px height) slides in from right with `bg-red-500` text-white.
- **Velocity handoff** (§5): pass release velocity to spring for natural feel.
- Tap the revealed delete button → spring remove card + trigger finishWorkout state update.

### 4.2 Reorder Exercises (improve existing)

Currently uses `GripVertical` + up/down buttons. Redesign:
- Replace with vertical drag handle (≡) in card header.
- On drag start: card lifts slightly (scale 1.02 + shadow increase).
- 1:1 vertical tracking with finger.
- Other cards shift out of the way with spring stagger.
- On release: snap to new position, spring back to normal scale + shadow.

### 4.3 Pull to Refresh History

- On History screen scroll, detect pull-down > 60px.
- Spring-back with overshoot indicator.
- Re-fetch history from IndexedDB (fast — no network needed, but provides refresh UX).

### 4.4 Haptic Feedback

Use `navigator.vibrate()` (Phase 4 implementation) for key moments:
- Set logged: 10ms light impact.
- Timer start: 15ms.
- Timer end: 50ms + sound (Phase 12).
- Exercise card added: 5ms.
- Exercise card deleted: 30ms medium impact.

---

## 5. Sound & Notifications (Phase 11 prep)

The timer currently has no sound. Phase 11 will wire up:
- **Timer end sound** (Phase 12 primary, but sound asset + API prep here): `new Audio('/sounds/timer-end.mp3').play()`.
- **Audio API integration** in `RestTimerBanner` — triggered on `timeRemaining === 0` transition.
- This is a Phase 12 task, but the UI reference includes where the sound hook lives.

---

## 6. CSS Architecture

### 6.1 Design Tokens File

New file: `src/styles/tokens.ts` — exports typed token objects:

```typescript
export const colors = {
  background: '#F8F8F7',
  'background-dark': '#000000',
  surface: '#FFFFFF',
  'surface-dark': '#1C1C1E',
  // ... etc
} as const;

export const spacing = [0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40] as const;

export const radius = { sm: 12, DEFAULT: 16, lg: 20 } as const;
```

### 6.2 Base Styles (index.css)

```css
@tailwind base;

@layer base {
  :root {
    --font-sans: -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif;
    --font-display: -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
    --font-mono: SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  }

  @media (prefers-color-scheme: dark) {
    :root {
      --background: #000000;
      --surface: #1C1C1E;
      /* ... */
    }
  }

  @media (prefers-color-scheme: light) {
    :root {
      --background: #F8F8F7;
      --surface: #FFFFFF;
      /* ... */
    }
  }
}
```

### 6.3 Global Utilities

Add to App.css or a new `src/styles/globals.css`:
- `.safe-area-inset-top` etc. (or use Tailwind's `env()` support).
- `.btn-reset` for removing default button styling.
- `.scrollbar-thin` for custom scrollbar on WebKit.
- `.tap-highlight-none` for web kit tap highlights.

---

## 7. Component Migration Checklist

### App.tsx
- [ ] Replace bottom tab bar with Apple-style translucent bar.
- [ ] Add spring transition between tab content swaps.
- [ ] Use SF Pro Display for title.

### WorkoutSession.tsx
- [ ] Redesign header: icon circle + title, segmented control + save button.
- [ ] Empty state: add template preview cards.
- [ ] "Add Exercise" button: secondary style, floating.
- [ ] Wrap ExerciseCards in `AnimatePresence` for spring enter/exit.
- [ ] Pass equipment state to ExerciseCard for ExerciseSwap.

### ExerciseCard.tsx
- [ ] Restructure header: delete + reorder + swap in action group.
- [ ] Ghost previous sets: verify they are visually read-only and tied to correct exercise name.
- [ ] Apply 16px radius, subtle shadow, border.
- [ ] Add swipe-to-delete gesture handler.
- [ ] Spring on mount for each card (staggered).

### SetInput.tsx
- [ ] Increase touch targets: buttons 48x48.
- [ ] Rounded-xl, secondary BG.
- [ ] Set number badge: blue capsule.
- [ ] Weight/reps: large mono font, auto-focus chain.
- [ ] Log button: full-width, rounded-xl, 44px min height.

### SetRow.tsx
- [ ] Rounded-xl card, subtle border.
- [ ] Mono font for weight/reps.
- [ ] Delete X button: 24x24, red, spring on tap.

### RestTimerBanner.tsx
- [ ] Rounded-full container (pill shape).
- [ ] Translucent material + shadow.
- [ ] Timer: 20px mono bold.
- [ ] Add sound trigger on end (Phase 12 prep).
- [ ] Pulse animation on timer end.

### ExerciseSelector.tsx
- [ ] Apply 4px grid spacing.
- [ ] Each exercise item: 44px min height.
- [ ] Active state: subtle bg + scale.
- [ ] Search: rounded-xl, 44px height.

### History.tsx
- [ ] Each row: rounded-2xl card, full-width.
- [ ] Date + stats + exercise names layout.
- [ ] Chevron on right.
- [ ] Hover/active spring.

### WorkoutDetail.tsx
- [ ] Header: back button (28x28 circle) + date + meta.
- [ ] Exercise cards: rounded-2xl with header + set list.
- [ ] Sets: aligned mono layout.

### Analytics.tsx
- [ ] Exercise dropdown: spring open.
- [ ] Stats cards: 2-up grid.
- [ ] Chart: rounded-2xl, proper height.
- [ ] Verify all progression data points plot (Phase 13 bug check).
- [ ] Volume section: bars with labels.
- [ ] Risk alerts: colored cards.
- [ ] Muscle balance: top-5 deviation bars.

### ExerciseSwap.tsx
- [ ] Trigger: 28x28 circle, blue.
- [ ] Dropdown: rounded-xl, spring open.
- [ ] Rec items: name + match %.

### EquipmentPreferences.tsx
- [ ] Collapsible: spring height.
- [ ] Chips: rounded-full, active state.

---

## 8. Known Bugs (Phase 13 fixes — noted, not fixed in Phase 11)

1. **Template persistence:** `saveTemplate` calls `db.put('templates', template)` — should work. If templates aren't persisting, the issue may be that `saveCurrentAsTemplate` in the hook isn't awaiting before state update, or the `upsert` pattern races. **Not a Phase 11 concern, but the redesign ensures template save has a confirmation toast.**

2. **Ghost set data bleeding:** `getPreviousPerformance` matches by `exercise.name`. If exercises share names, data bleeds. The vector engine uses exercise names as keys — duplicate names in `EXERCISE_VECTORS` would also break recommendations. **The redesign's ExerciseCard strictly scopes `previousSets` to the exact exercise `id`/`name` match.**

3. **Progress chart only plotting 2 points:** `getExerciseProgression` returns all sessions. If only 2 render, the bug is in the chart's `data` prop or memoization. **The redesign verifies `progressionData` length matches session count. If the bug is confirmed real, it's a Phase 13 fix, not Phase 11.**

---

## 9. Implementation Order

1. **Create `src/styles/tokens.ts`** — design tokens (colors, spacing, radius, motion).
2. **Update `src/index.css`** — base styles, CSS variables, dark mode.
3. **Update `src/App.css`** — global utilities (scrollbar, safe areas, btn-reset).
4. **Redesign `App.tsx`** — Apple-style tab bar.
5. **Redesign `ExerciseSelector`** — full-page swap visuals.
6. **Redesign `WorkoutSession`** — header, empty state, add button, card container.
7. **Redesign `ExerciseCard`** — header, ghost sets, card styling, swipe gesture scaffold.
8. **Redesign `SetInput`** — input styling, log button, focus chain.
9. **Redesign `SetRow`** — card styling, mono layout.
10. **Redesign `RestTimerBanner`** — pill shape, sound hook prep.
11. **Redesign `History`** — card rows, empty state.
12. **Redesign `WorkoutDetail`** — card sections.
13. **Redesign `Analytics`** — dropdown, stats, chart, volume, alerts, balance.
14. **Redesign `ExerciseSwap`** — trigger + dropdown.
15. **Redesign `EquipmentPreferences`** — collapsible chips.
16. **Verify:** `npm run build` + `tsc --noEmit` pass.
17. **Test:** `npm run dev -- --host` on iPhone Safari.

---

## 10. Apple Design Skill Mapping

| Skill Section | Where Applied |
|---|---|
| §1 Response | Tap highlights on all buttons, instant timer feedback |
| §2 Direct manipulation | Exercise reorder drag, timer adjust buttons |
| §3 Interruptibility | All springs use `motion`/`framer-motion`; no CSS transitions for interactive elements |
| §4 Behavior over animation | Springs everywhere by default; bounce only for momentum (swipe delete, flicks) |
| §5 Velocity handoff | Swipe-to-delete, drag-to-reorder |
| §6 Momentum projection | Swipe-to-delete commitment threshold |
| §7 Spatial consistency | Modal/push transitions enter/exit same path; dropdown anchored to trigger |
| §8 Hint in direction | Chevron rotation on dropdown, swipe reveal direction |
| §9 Rubber-banding | Scroll-boundary, pull-to-refresh |
| §10 Gesture design | Tap hysteresis, drag threshold |
| §11 Frame-level smoothness | `transform` + `opacity` only, `will-change` on animated elements |
| §12 Materials & depth | Translucent headers/tab bar/timer, 3-layer depth system |
| §13 Multimodal feedback | Haptics on set log, timer end, card add/delete |
| §14 Reduced motion | `@media (prefers-reduced-motion)` cross-fades |
| §15 Typography | SF Pro, size-specific tracking, vertical rhythm |
| §16 Foundations | Purpose, agency, responsibility, familiarity, flexibility, simplicity, craft, delight |
| §17 Process | Prototype iteratively with `--host` on device |
