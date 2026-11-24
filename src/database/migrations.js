import {
  ADD_PLAYER_PROFILE_COLUMNS,
  ADD_PLAYER_TOTAL_XP_COLUMN,
  ADD_XP_TRANSACTION_REVERSAL_COLUMNS,
  CREATE_QUEST_TABLES,
  CREATE_REWARD_TABLES,
  CREATE_PLAYER_ATTRIBUTES_TABLE,
  CREATE_PLAYER_TABLE,
  CREATE_QUESTS_TABLE,
  CREATE_XP_TRANSACTION_ATTRIBUTES_TABLE,
  CREATE_XP_TRANSACTIONS_TABLE,
  DROP_PLACEHOLDER_QUESTS_TABLE,
  INSERT_DEFAULT_PLAYER,
} from './schema';

/**
 * Values frozen at the time migration v3 was written. Migrations must not import live
 * config, or editing the config later would change what an old migration does.
 */
const V3_ATTRIBUTE_KEYS = ['strength', 'agility', 'vitality', 'intelligence', 'discipline', 'charisma'];
const V3_LEGACY_XP_REQUIRED = (level) => Math.round(100 * Math.pow(level, 1.5));
export const LEGACY_XP_TRANSACTION_ID = 'migration:v3-legacy-player-xp';

/**
 * Ordered migrations. Position + 1 is the schema version the migration produces,
 * tracked in SQLite's built-in `PRAGMA user_version`.
 * Append only — never edit or reorder a migration that has run on a device.
 */
const MIGRATIONS = [
  async function createInitialTables(db) {
    await db.execAsync(`${CREATE_PLAYER_TABLE}\n${CREATE_QUESTS_TABLE}`);
    await db.runAsync(INSERT_DEFAULT_PLAYER);
  },

  async function addPlayerProfileColumns(db) {
    await db.execAsync(ADD_PLAYER_PROFILE_COLUMNS);
  },

  async function addProgressionLedger(db) {
    await db.execAsync(
      [
        ADD_PLAYER_TOTAL_XP_COLUMN,
        CREATE_PLAYER_ATTRIBUTES_TABLE,
        CREATE_XP_TRANSACTIONS_TABLE,
        CREATE_XP_TRANSACTION_ATTRIBUTES_TABLE,
      ].join('\n'),
    );

    for (const key of V3_ATTRIBUTE_KEYS) {
      await db.runAsync('INSERT OR IGNORE INTO player_attributes (attribute_key) VALUES (?)', key);
    }

    // Carry over XP earned before the ledger existed (level + XP into level → lifetime total),
    // and record it in the ledger so ledger and totals agree from day one.
    const legacy = await db.getFirstAsync('SELECT level, xp FROM player WHERE id = 1');
    if (!legacy) return;
    let legacyTotalXp = legacy.xp;
    for (let level = 1; level < legacy.level; level += 1) legacyTotalXp += V3_LEGACY_XP_REQUIRED(level);

    if (legacyTotalXp > 0) {
      await db.runAsync('UPDATE player SET total_xp = ? WHERE id = 1', legacyTotalXp);
      await db.runAsync(
        "INSERT INTO xp_transactions (id, source, xp) VALUES (?, 'migration', ?)",
        LEGACY_XP_TRANSACTION_ID,
        legacyTotalXp,
      );
    }
  },

  async function addQuestSystem(db) {
    await db.execAsync(
      [ADD_XP_TRANSACTION_REVERSAL_COLUMNS, DROP_PLACEHOLDER_QUESTS_TABLE, CREATE_QUEST_TABLES].join('\n'),
    );
  },

  async function addRewardSystem(db) {
    await db.execAsync(CREATE_REWARD_TABLES);
  },
];

export const LATEST_SCHEMA_VERSION = MIGRATIONS.length;

export async function runMigrations(db) {
  const row = await db.getFirstAsync('PRAGMA user_version');
  let currentVersion = row?.user_version ?? 0;

  while (currentVersion < MIGRATIONS.length) {
    const migrate = MIGRATIONS[currentVersion];
    const nextVersion = currentVersion + 1;
    await db.withTransactionAsync(async () => {
      await migrate(db);
      await db.execAsync(`PRAGMA user_version = ${nextVersion}`);
    });
    currentVersion = nextVersion;
  }
}
