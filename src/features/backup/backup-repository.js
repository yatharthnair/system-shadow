import { BACKUP_APP_ID, BACKUP_FORMAT_VERSION, BACKUP_TABLES, BackupError } from './backup-format';

export async function readSchemaVersion(db) {
  return (await db.getFirstAsync('PRAGMA user_version')).user_version;
}

/** Every row of every app table, plus metadata and a human-readable summary. */
export async function readBackup(db, now) {
  const tables = {};
  for (const table of BACKUP_TABLES) {
    tables[table] = await db.getAllAsync(`SELECT * FROM ${table}`);
  }
  const player = tables.player.find((row) => row.id === 1);
  return {
    app: BACKUP_APP_ID,
    kind: 'backup',
    formatVersion: BACKUP_FORMAT_VERSION,
    schemaVersion: await readSchemaVersion(db),
    exportedAt: now.toISOString(),
    summary: {
      playerName: player?.name ?? null,
      level: player?.level ?? null,
      totalXp: player?.total_xp ?? 0,
      quests: tables.quests.length,
      completions: tables.quest_completions.filter((row) => row.undone_at == null).length,
      rewards: tables.reward_unlocks.filter((row) => row.revoked_at == null).length,
    },
    tables,
  };
}

async function readColumns(db, table) {
  return new Set((await db.getAllAsync(`PRAGMA table_info(${table})`)).map((column) => column.name));
}

/**
 * Replaces all app data with a validated backup. Must run inside an exclusive transaction: any
 * failure (unknown column, constraint violation, broken reference) throws and rolls back, leaving
 * the current data untouched.
 * @returns {Promise<Record<string, number>>} rows restored per table
 */
export async function replaceAllData(db, backup) {
  const columnsByTable = {};
  for (const table of BACKUP_TABLES) {
    columnsByTable[table] = await readColumns(db, table);
    for (const row of backup.tables[table]) {
      const unknown = Object.keys(row).find((column) => !columnsByTable[table].has(column));
      if (unknown) throw new BackupError('INVALID', `The backup’s “${table}” data has an unknown field “${unknown}”.`);
    }
  }

  for (const table of [...BACKUP_TABLES].reverse()) {
    await db.runAsync(`DELETE FROM ${table}`);
  }

  const counts = {};
  for (const table of BACKUP_TABLES) {
    for (const row of backup.tables[table]) {
      const columns = Object.keys(row);
      await db.runAsync(
        `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
        columns.map((column) => row[column]),
      );
    }
    counts[table] = backup.tables[table].length;
  }

  // Every reference (completion → quest, completion → XP transaction, unlock → XP, item → unlock…)
  // must resolve, or the restore is rejected.
  const brokenReferences = await db.getAllAsync('PRAGMA foreign_key_check');
  if (brokenReferences.length > 0) {
    throw new BackupError('INTEGRITY', `The backup is inconsistent (${brokenReferences.length} broken references in “${brokenReferences[0].table}”).`);
  }
  return counts;
}
