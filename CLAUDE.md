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
  quest/new · quest/[questId] · quest/history   Quest editor modals and the quest log
  inventory · item/[itemKey]                      Inventory (items, titles, milestones, log) and item sheet
  settings.jsx           Pushed from the Dashboard header
src/constants/           Design tokens: colors, typography, spacing, effects, components; theme.js re-exports all
src/components/
  common/                Design-system primitives (AppText, GlowPanel, ScreenContainer, ScalePressable, …)
  navigation/            SystemTabBar, TabBarButton
  player/ quests/ system/  Feature UI. Reads stores, holds no business rules. SystemNoticeHost shows level-up/attribute notices.
src/features/<domain>/   Business logic: pure rules (e.g. progression-engine.js, quest-board.js), SQL repositories, services
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
- **Undo = reversal, never delete.** `reverseXp(transactionId)` appends a `kind = 'reversal'` ledger row; a
  unique index allows one reversal per award. Ledger totals are awards minus reversals.
- **All DB writes go through `runExclusiveWrite` (`src/database/exclusive-write.js`)**: one serial queue,
  each task in its own exclusive transaction. Never call it from inside a task (deadlock). To combine XP with
  other writes atomically, use `applyXpRewardInTransaction` / `reverseXpTransactionInTransaction` with the `txn`.
- On launch, `loadProgression` checks totals against the ledger and repairs from the ledger if they differ.
- Files: `progression-engine.js` (pure rules) · `xp-curve.js` · `ranks.js` · `attributes.js` (six attributes,
  weighted allocation) · `xp-reward.js` (validation) · `progression-repository.js` (SQL, takes `db`) ·
  `progression-service.js` (transactions) · `progression-notices.js` (events → UI notices).
- UI notices: engine events → `system-notice-store` queue → `SystemNoticeHost` (root layout) shows them one at a time.

## Quest system (`src/features/quests/`)

- **Periods, not reset jobs.** A completion belongs to a period key: local date (`2026-11-25`) for daily and
  specific-days quests, ISO week (`2026-W48`, Monday start) for weekly, `once` for one-time. A new period has
  no completion, so quests "reset" by themselves. `useQuestPeriodRollover` refreshes the board at local
  midnight and on app foreground. All date math is local-time and DST-safe (`quest-periods.js`).
- **One active completion per quest per period**, enforced by a partial unique index on `quest_completions`.
- Completion row + XP award are written in one transaction; XP id = `quest:<questId>:<periodKey>:<attempt>`,
  so complete → undo → complete earns XP again but never twice at once.
- Undo reverses exactly the XP recorded on the completion, and only while its period is current
  (one-time quests: same local day). Past completions are settled history.
- Repeat type (`cadence`) is fixed after creation; other fields are editable and affect future completions only.
- Quests are archived, never deleted, so history keeps its titles and XP.
- XP = difficulty base (20/40/80/150) × cadence multiplier (daily/specific days ×1, one-time ×2, weekly ×3),
  split across attributes by the quest's weights. Tune in `quest-config.js`.
- Built-in quests are seeded by permanent `templateId` (`quest-templates.js`); never reuse or rename an id.
- Files: `quest-config.js` · `quest-periods.js` · `quest-schedule.js` · `quest-rewards.js` · `quest-validation.js` ·
  `quest-board.js` (board/summary/filter/sort, pure) · `quest-repository.js` (SQL) · `quest-service.js`.

## RPG rewards (`src/features/rewards/`, `achievements/`, `challenges/`, `bosses/`)

- **Rewards are derived from activity, then reconciled.** `evaluateRewards(facts)` (pure) decides what's earned:
  achievements, this week's challenges, boss milestones, level milestones. `reconcileRewardsInTransaction`
  diffs that against `reward_unlocks` and grants (XP exactly once via `reward:<sourceKey>#<attempt>`, items,
  titles) or revokes (reverses XP, revokes items, unequips titles). It runs in the same transaction as quest
  completion / undo / creation, and on reward load. Never insert unlocks or items any other way.
- Reward XP can raise the level and earn more rewards, so reconciliation repeats until stable (capped).
- Facts come only from real activity: active quest completions, quests created, and progression state
  (`activity-facts.js`). Streak achievements use the *longest* streak so they never expire with time.
- **Weekly challenges** are generated once per ISO week (deterministic from the week key, focus category from
  the player's active quests) and stored in `weekly_challenges`. Only the current week is re-evaluated;
  past weeks' unlocks are settled history.
- **Bosses** are a ladder replayed from completions in time order (`boss-campaign.js`): quest XP = damage,
  weakness category ×1.5, overflow carries to the next boss. Milestones at 25/50/75/100% grant rewards.
- Catalog ids (achievements, bosses, items, titles, template keys) are permanent: they're stored in SQLite.
  Add new entries freely; never rename or reuse an id.
- UI: `useRewardStore` holds the overview; `applyActivityOutcome` syncs XP and queues notices (order: level-up →
  boss defeat → achievements → reward banners → attribute growth). Cinematics animate transform/opacity only,
  play once (no infinite loops), cancel on unmount, honour Reduce Motion (`useReducedMotion`), and tap to skip.

## Tests

Jest via `jest-expo` (`npm test`). Tests live in `__tests__/` beside the code.
`src/test-utils/create-test-database.js` adapts Node's built-in `node:sqlite` to the expo-sqlite API, so
persistence tests run the real migrations and SQL in memory: mock `@/database/database`'s `getDatabase` to return it.
Tests run in `America/New_York` (set in Jest `globalSetup`) so date-boundary and DST tests are deterministic.
Pass explicit `now` dates to quest functions in tests; never rely on the real clock.

## Checks

```bash
npx expo lint && npx tsc --noEmit && npm test && npx expo-doctor
npx expo export --platform ios --output-dir /tmp/ios-export   # bundles every file; catches bad imports in JS
```
