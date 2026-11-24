/**
 * SQL statements, grouped by the migration that introduced them.
 * Never change a statement that has shipped: add a new migration in `migrations.js` instead.
 */

// v1
export const CREATE_PLAYER_TABLE = `
CREATE TABLE IF NOT EXISTS player (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  name TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  xp INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);`;

// v1: reserved for the quest engine milestone.
export const CREATE_QUESTS_TABLE = `
CREATE TABLE IF NOT EXISTS quests (
  id TEXT PRIMARY KEY NOT NULL,
  template_id TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  xp_reward INTEGER NOT NULL,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);`;

export const INSERT_DEFAULT_PLAYER = `INSERT OR IGNORE INTO player (id, name) VALUES (1, 'Hunter')`;

// v2: player title and core attributes.
export const ADD_PLAYER_PROFILE_COLUMNS = `
ALTER TABLE player ADD COLUMN title TEXT NOT NULL DEFAULT 'Unawakened';
ALTER TABLE player ADD COLUMN strength INTEGER NOT NULL DEFAULT 10;
ALTER TABLE player ADD COLUMN agility INTEGER NOT NULL DEFAULT 10;
ALTER TABLE player ADD COLUMN intelligence INTEGER NOT NULL DEFAULT 10;
ALTER TABLE player ADD COLUMN vitality INTEGER NOT NULL DEFAULT 10;
ALTER TABLE player ADD COLUMN discipline INTEGER NOT NULL DEFAULT 10;
`;

// v3: progression engine. Only lifetime XP totals are stored; levels are derived.
// The legacy `player.level` / `player.xp` columns are kept as a read-only cache, and the v2
// attribute columns (strength…discipline) are superseded by `player_attributes`.
export const ADD_PLAYER_TOTAL_XP_COLUMN = `ALTER TABLE player ADD COLUMN total_xp INTEGER NOT NULL DEFAULT 0;`;

export const CREATE_PLAYER_ATTRIBUTES_TABLE = `
CREATE TABLE IF NOT EXISTS player_attributes (
  attribute_key TEXT PRIMARY KEY NOT NULL,
  total_xp INTEGER NOT NULL DEFAULT 0 CHECK (total_xp >= 0)
);`;

/** Append-only XP ledger. The primary key is the idempotency key that blocks duplicate rewards. */
export const CREATE_XP_TRANSACTIONS_TABLE = `
CREATE TABLE IF NOT EXISTS xp_transactions (
  id TEXT PRIMARY KEY NOT NULL,
  source TEXT NOT NULL,
  xp INTEGER NOT NULL CHECK (xp >= 0),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);`;

export const CREATE_XP_TRANSACTION_ATTRIBUTES_TABLE = `
CREATE TABLE IF NOT EXISTS xp_transaction_attributes (
  transaction_id TEXT NOT NULL REFERENCES xp_transactions (id),
  attribute_key TEXT NOT NULL,
  xp INTEGER NOT NULL CHECK (xp > 0),
  PRIMARY KEY (transaction_id, attribute_key)
);`;

// v4: XP reversals (quest undo) and the quest system.
// Reversals are appended as their own ledger rows (kind = 'reversal') pointing at the award they
// cancel; the partial unique index guarantees an award can be reversed at most once.
export const ADD_XP_TRANSACTION_REVERSAL_COLUMNS = `
ALTER TABLE xp_transactions ADD COLUMN kind TEXT NOT NULL DEFAULT 'award' CHECK (kind IN ('award', 'reversal'));
ALTER TABLE xp_transactions ADD COLUMN reverses_transaction_id TEXT REFERENCES xp_transactions (id);
CREATE UNIQUE INDEX IF NOT EXISTS xp_transactions_one_reversal_per_award
  ON xp_transactions (reverses_transaction_id) WHERE reverses_transaction_id IS NOT NULL;
`;

/** The v1 placeholder `quests` table was never used by any release; it is replaced by the tables below. */
export const DROP_PLACEHOLDER_QUESTS_TABLE = `DROP TABLE IF EXISTS quests;`;

export const CREATE_QUEST_TABLES = `
CREATE TABLE quests (
  id TEXT PRIMARY KEY NOT NULL,
  template_id TEXT UNIQUE,
  origin TEXT NOT NULL CHECK (origin IN ('system', 'custom')),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  cadence TEXT NOT NULL CHECK (cadence IN ('daily', 'weekly', 'weekdays', 'once')),
  weekdays TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  archived_at TEXT
);

CREATE TABLE quest_attribute_weights (
  quest_id TEXT NOT NULL REFERENCES quests (id) ON DELETE CASCADE,
  attribute_key TEXT NOT NULL,
  weight INTEGER NOT NULL CHECK (weight > 0),
  PRIMARY KEY (quest_id, attribute_key)
);

CREATE TABLE quest_completions (
  id TEXT PRIMARY KEY NOT NULL,
  quest_id TEXT NOT NULL REFERENCES quests (id),
  period_key TEXT NOT NULL,
  completed_at TEXT NOT NULL,
  xp_transaction_id TEXT NOT NULL UNIQUE REFERENCES xp_transactions (id),
  xp_awarded INTEGER NOT NULL CHECK (xp_awarded >= 0),
  quest_title TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  undone_at TEXT
);

-- At most one *active* completion per quest per period. Undone completions don't count,
-- so a quest can be completed again after an undo.
CREATE UNIQUE INDEX quest_completions_one_active_per_period
  ON quest_completions (quest_id, period_key) WHERE undone_at IS NULL;

CREATE INDEX quest_completions_by_time ON quest_completions (completed_at DESC);
`;

// v5: RPG rewards. An "unlock" is any earned reward source (achievement, weekly challenge, boss
// milestone, level milestone). Unlocks are derived from activity and reconciled after every change:
// at most one *active* unlock per source; a revoked unlock (e.g. after a quest undo) keeps its row.
export const CREATE_REWARD_TABLES = `
CREATE TABLE reward_unlocks (
  id TEXT PRIMARY KEY NOT NULL,
  source_key TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('achievement', 'challenge', 'boss_milestone', 'level_milestone')),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  xp_reward INTEGER NOT NULL DEFAULT 0 CHECK (xp_reward >= 0),
  xp_transaction_id TEXT UNIQUE REFERENCES xp_transactions (id),
  title_reward TEXT,
  unlocked_at TEXT NOT NULL,
  revoked_at TEXT
);
CREATE UNIQUE INDEX reward_unlocks_one_active_per_source ON reward_unlocks (source_key) WHERE revoked_at IS NULL;
CREATE INDEX reward_unlocks_by_time ON reward_unlocks (unlocked_at DESC);

CREATE TABLE inventory_items (
  id TEXT PRIMARY KEY NOT NULL,
  unlock_id TEXT NOT NULL REFERENCES reward_unlocks (id),
  item_key TEXT NOT NULL,
  acquired_at TEXT NOT NULL,
  revoked_at TEXT
);

-- Each week's challenges are generated once and stored, so they can't change mid-week.
CREATE TABLE weekly_challenges (
  week_key TEXT NOT NULL,
  challenge_id TEXT NOT NULL,
  slot INTEGER NOT NULL,
  metric TEXT NOT NULL,
  category TEXT,
  target INTEGER NOT NULL CHECK (target > 0),
  xp_reward INTEGER NOT NULL CHECK (xp_reward >= 0),
  item_key TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (week_key, challenge_id)
);

ALTER TABLE player ADD COLUMN equipped_title_id TEXT;
`;
