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
