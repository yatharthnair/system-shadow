# SYSTEM: SHADOW

A native iOS-first life-progression RPG. Real-life quests grant XP; XP levels up the player.
General Expo rules live in @AGENTS.md — read them first.

## Stack

- **Language:** JavaScript / JSX (no TypeScript in app code). Document props with JSDoc where helpful.
- **Navigation:** Expo Router. Routes live in `src/app/` only.
- **Global state:** Zustand (`src/store/`).
- **Persistence:** expo-sqlite (`src/database/`), accessed only through repositories in `src/features/*`.
- **Animation:** react-native-reanimated. The React Compiler is on: write shared values with
  `sv.set(...)` and read them in worklets with `sv.get()` — never assign `sv.value = ...`.
- **Icons:** lucide-react-native (needs react-native-svg).
- **Haptics:** expo-haptics, through `ScalePressable`.
- **Styling:** `StyleSheet` + tokens from `@/constants/theme`. No styling framework (NativeWind may come later).
  Never hardcode colors, sizes, spacing, glows or durations in components — add or reuse a token.
- No web-based UI components. iOS first.

## Architecture

```
src/app/                 Routes only
  _layout.jsx            Bootstrap (fonts, DB, player), splash, root Stack, LevelUpOverlay
  (tabs)/_layout.jsx     Tabs navigator rendered with the custom SystemTabBar
  (tabs)/*.jsx           index (Status/Dashboard), quests, player, challenges, achievements
  settings.jsx           Pushed from the Dashboard header
src/constants/           Design tokens: colors, typography, spacing, effects, components; theme.js re-exports all
src/components/
  common/                Design-system primitives (AppText, GlowPanel, ScreenContainer, ScalePressable, …)
  navigation/            SystemTabBar, TabBarButton
  player/ system/ …      Feature UI. Reads stores, holds no business rules. SystemNoticeHost shows level-up/attribute notices.
src/features/<domain>/   Business logic: pure rules (progression/leveling.js), models, SQLite repositories
src/store/               Zustand stores + selectors. Orchestrate features; no SQL, no UI.
src/database/            Connection (getDatabase), schema, append-only migrations (PRAGMA user_version)
src/hooks/               App hooks (useAppBootstrap, useTabBarClearance)
src/utils/               Pure formatting helpers
```

Data flow: component → store action → feature rule + repository → SQLite.

## Conventions

- File names kebab-case; components PascalCase named exports; route files default-export.
- Tab screens wrap content in `ScreenContainer` (safe-area top + floating tab bar clearance).
- Panels use `GlowPanel`; pass `entranceIndex` for the staggered entrance animation.
- New tab: add a `<Tabs.Screen>` with `title` + `tabBarIcon` in `src/app/(tabs)/_layout.jsx` — SystemTabBar picks it up.
- Schema change: append a migration in `src/database/migrations.js`. Never edit a shipped one.

## Progression engine (`src/features/progression/`)

- **Persist totals, derive everything else.** SQLite stores only lifetime XP (`player.total_xp`,
  `player_attributes.total_xp`). Level, rank and progress are computed by the engine, so tuning
  `progression-config.js` (curves, per-level overrides, ranks) re-derives levels without a migration.
- **Award XP only via `usePlayerStore.getState().awardXp(reward)`** (or `progression-service.awardXp`).
  Never write XP columns directly.
- **Every reward needs a deterministic, unique `id`** (e.g. `quest:<templateId>:<YYYY-MM-DD>`). The id is the
  primary key of the `xp_transactions` ledger; a repeated id is a no-op that returns `status: 'duplicate'`.
- Writes go through one serial queue inside `withExclusiveTransactionAsync`: ledger row + totals commit atomically.
- On launch, `loadProgression` checks totals against the ledger and repairs from the ledger if they differ.
- Files: `progression-engine.js` (pure rules) · `xp-curve.js` · `ranks.js` · `attributes.js` (six attributes,
  weighted allocation) · `xp-reward.js` (validation) · `progression-repository.js` (SQL, takes `db`) ·
  `progression-service.js` (transactions + queue) · `progression-notices.js` (events → UI notices).
- UI notices: engine events → `system-notice-store` queue → `SystemNoticeHost` (root layout) shows them one at a time.

## Tests

Jest via `jest-expo` (`npm test`). Tests live in `__tests__/` beside the code.
`src/test-utils/create-test-database.js` adapts Node's built-in `node:sqlite` to the expo-sqlite API, so
persistence tests run the real migrations and SQL in memory: mock `@/database/database`'s `getDatabase` to return it.

## Checks

```bash
npx expo lint && npx tsc --noEmit && npm test && npx expo-doctor
npx expo export --platform ios --output-dir /tmp/ios-export   # bundles every file; catches bad imports in JS
```
