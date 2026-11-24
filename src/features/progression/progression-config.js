/**
 * Tunable progression rules. Changing these values re-derives every player's level from their
 * stored total XP on next launch — no data migration needed, because only XP totals are persisted.
 */

/**
 * XP needed to advance FROM each level to the next.
 * `formula` gives round(base × level^exponent); `overrides` hand-tunes individual levels.
 */
export const PLAYER_LEVEL_CURVE = {
  maxLevel: 300,
  formula: { base: 100, exponent: 1.5 },
  overrides: {},
};

export const ATTRIBUTE_LEVEL_CURVE = {
  maxLevel: 100,
  formula: { base: 40, exponent: 1.4 },
  overrides: {},
};

/** Hunter ranks, lowest first. A player holds the highest rank whose `minimumLevel` they've reached. */
export const RANKS = [
  { id: 'E', minimumLevel: 1 },
  { id: 'D', minimumLevel: 10 },
  { id: 'C', minimumLevel: 20 },
  { id: 'B', minimumLevel: 35 },
  { id: 'A', minimumLevel: 50 },
  { id: 'S', minimumLevel: 75 },
  { id: 'SS', minimumLevel: 100 },
  { id: 'SSS', minimumLevel: 150 },
  { id: 'EX', minimumLevel: 200 },
];

/** Upper bound for a single transaction, to catch bugs (e.g. a timestamp passed as XP). */
export const MAX_XP_PER_TRANSACTION = 1_000_000;
