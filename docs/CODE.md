# Code Explanation

This document walks through how the Kid Dashboard is built — file by file, function by function. Read this if you want to understand or extend the codebase.

---

## Table of contents

- [High-level flow](#high-level-flow)
- [types.ts — Data shapes](#typests--data-shapes)
- [data/defaults.ts — Starting content](#datadefaultsts--starting-content)
- [utils/id.ts — ID generation](#utilsidts--id-generation)
- [hooks/useDashboard.ts — State and logic](#hooksusedashboardts--state-and-logic)
- [components/MissionControls.tsx — Add & refresh UI](#componentsmissioncontrolstsx--add--refresh-ui)
- [App.tsx — Main layout](#apptsx--main-layout)
- [Styling](#styling)
- [Persistence lifecycle](#persistence-lifecycle)

---

## High-level flow

```
User taps UI (App.tsx)
        │
        ▼
useDashboard hook updates state
        │
        ├──► React re-renders the dashboard
        │
        └──► useEffect saves state to localStorage
```

There is no backend. All data lives in the browser under the key `kid-dashboard-v1`.

---

## `types.ts` — Data shapes

Defines TypeScript interfaces so every part of the app agrees on data structure.

| Type | Purpose |
|------|---------|
| `Task` | A mission the kid can complete for stars |
| `RoutineItem` | A morning routine step that earns stars when done |
| `Reward` | Something to buy with total stars |
| `DashboardState` | Everything persisted in localStorage |

```ts
export interface Task {
  id: string       // unique key for React lists and toggling
  label: string    // display text, e.g. "Do homework"
  emoji: string    // icon shown beside the label
  stars: number    // earned when marked done
  done: boolean    // checked off or not
}
```

`DashboardState` also tracks:

- `totalStars` — bank balance (persists across days)
- `todayStars` — stars earned today only (resets daily)
- `lastResetDate` — last calendar day the daily reset ran
- `redeemedRewards` — reward IDs claimed today

---

## `data/defaults.ts` — Starting content

Provides the **initial** dashboard content when no saved data exists:

- `MOODS` — emoji options for the mood picker
- `defaultState` — full starting `DashboardState`
- `STORAGE_KEY` — localStorage key (`kid-dashboard-v1`)

On load, saved data is **merged** with defaults and migrated if needed (e.g. routine items saved before the `stars` field was added get default star values from `defaults.ts`):

```ts
return resetDaily(migrateState(parsed))
```

This means new fields added in app updates are backfilled from defaults, while saved kid name, stars, and custom missions are preserved.

---

## `utils/id.ts` — ID generation

```ts
export function newTaskId() {
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}
```

When a user adds a mission in the UI, we need a unique `id`. This combines a timestamp with a short random suffix so IDs never collide, even if two missions are added quickly.

---

## `hooks/useDashboard.ts` — State and logic

The central brain of the app. A custom React hook that owns all dashboard state and exposes actions to the UI.

### Loading and saving

```ts
function loadState(): DashboardState
function saveState(state: DashboardState): void
```

- **`loadState`** — Reads JSON from localStorage, merges with defaults, runs daily reset if needed.
- **`saveState`** — Writes the full state object back to localStorage.

A `useEffect` in the hook calls `saveState` whenever `state` changes, so every action auto-saves.

### Day reset — `applyNewDayReset`

Shared logic for both automatic midnight reset and the manual **Start new day** button:

1. Sets `todayStars` to `0`
2. Unchecks all tasks and routine items
3. Clears `redeemedRewards`
4. Updates `lastResetDate`

**Total stars are never touched** — yesterday's earned stars stay in the bank.

`resetDaily` calls `applyNewDayReset` only when `lastResetDate !== today` (on page load).

`startNewDay` calls `applyNewDayReset` immediately when the user taps the button.

### Actions exposed to the UI

| Function | What it does |
|----------|--------------|
| `setKidName(name)` | Updates display name; falls back to `"Champ"` if empty |
| `setMood(mood)` | Saves selected emoji mood |
| `toggleTask(id)` | Marks mission done/undone; adds or removes stars |
| `toggleRoutine(id)` | Marks routine step done/undone; adds or removes stars |
| `redeemReward(id)` | Deducts stars, marks reward as claimed for today |
| `addTask(label, emoji, stars)` | Appends a new mission; stars clamped 1–10 |
| `startNewDay()` | Day-boundary reset; keeps total stars |
| `refreshMissions()` | Undo all missions; subtracts stars from completed ones |

### Star math in `toggleTask`

```ts
const done = !task.done
const starDelta = done ? task.stars : -task.stars

totalStars: Math.max(0, s.totalStars + starDelta),
todayStars: Math.max(0, s.todayStars + starDelta),
```

- Completing a mission **adds** stars to both total and today.
- Unchecking **subtracts** stars (never below zero).
- Completing triggers confetti via `triggerCelebrate()`.

`toggleRoutine` uses the same star math as `toggleTask`.

### `startNewDay` vs `refreshMissions`

| | Start new day | Undo missions |
|--|---------------|---------------|
| Unchecks missions | Yes | Yes |
| Resets routine | Yes | No |
| Resets today stars | Yes (to 0) | Subtracts earned amount |
| Keeps total stars | **Yes** | **No** — removes earned stars |
| Use when | End of day / morning | Mistake mid-day |

### Star math in `refreshMissions`

```ts
const earned = s.tasks.reduce(
  (sum, t) => sum + (t.done ? t.stars : 0),
  0,
)
```

Sums stars from all currently completed missions, subtracts that from totals, then sets every mission to `done: false`. Missions themselves stay in the list — only checkmarks and star counts change.

### Star math in `redeemReward`

Checks three guards before redeeming:

1. Reward exists
2. `totalStars >= reward.cost`
3. Not already in `redeemedRewards`

Deducts cost from `totalStars` only (not `todayStars`).

---

## `components/MissionControls.tsx` — Add & refresh UI

A small form component for the missions card. Keeps mission UI logic out of `App.tsx`.

### Props

| Prop | Type | Purpose |
|------|------|---------|
| `onAdd` | `(label, emoji, stars) => boolean` | Called on form submit |
| `onRefresh` | `() => void` | Resets all mission checkmarks |
| `hasCompleted` | `boolean` | Whether to show confirm dialog on refresh |

### Behavior

- **+ Add mission** — Toggles an inline form with name, emoji, and star fields.
- **↻ Refresh** — If any mission is completed, shows a browser confirm dialog explaining that stars will be removed. Then calls `onRefresh`.
- On successful add, the form clears and closes.

---

## `App.tsx` — Main layout

Pure presentation component. It:

1. Calls `useDashboard()` for state and actions
2. Computes derived values (`routinePct`, `tasksPct`, greeting)
3. Renders sections: hero, mood, routine, missions, rewards

### Key sections

| Section | Data source | Interaction |
|---------|-------------|-------------|
| Hero | `state.kidName`, star counts | Editable name input |
| Mood | `MOODS`, `state.mood` | `setMood` |
| Routine | `state.routine` | `toggleRoutine` |
| Missions | `state.tasks` | `toggleTask`, `MissionControls` |
| Rewards | `state.rewards`, `redeemedRewards` | `redeemReward` |

### `getGreeting()`

Returns "Good morning", "Good afternoon", or "Good evening" based on `new Date().getHours()`.

### Confetti

When `celebrate` is true (from the hook), 24 animated `<span>` elements fall from the top. CSS custom property `--i` staggers each piece.

---

## Styling

| File | Scope |
|------|-------|
| `index.css` | Page background, CSS variables, `#root` width |
| `App.css` | All dashboard components |

Design tokens in `:root`:

```css
--accent: #7c3aed;
--card-bg: #ffffff;
--shadow: 0 4px 20px rgba(30, 41, 59, 0.08);
```

Cards use colored borders (mint for routine, coral for missions, gold for rewards) to help kids distinguish sections visually.

---

## Persistence lifecycle

```
Page load
   │
   ▼
loadState()
   ├── read localStorage
   ├── merge with defaultState
   └── resetDaily() if new day
   │
   ▼
useState(initialState)
   │
   ▼
User interaction → setState
   │
   ▼
useEffect → saveState(state)
   │
   ▼
localStorage updated
```

### What persists vs. resets

| Persists always | Resets daily |
|-----------------|--------------|
| Kid name | Mission checkmarks |
| Total stars | Routine checkmarks |
| Custom-added missions | Today stars |
| Mood (until changed) | Redeemed rewards |
| Task/reward definitions | |

---

## Extending the app

Common additions and where to put them:

| Feature | Where to change |
|---------|-----------------|
| New default missions | `data/defaults.ts` |
| Delete a mission | Add `removeTask(id)` in `useDashboard.ts` |
| Parent PIN lock | Wrap `MissionControls` in a PIN gate |
| Weekly streak | Add `streak` field to `DashboardState` |
| Sound effects | Call `new Audio()` inside `triggerCelebrate` |

When adding fields to `DashboardState`, update `types.ts`, `defaults.ts`, and any hook logic that reads or writes the new field.
