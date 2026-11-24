/**
 * JSON backup format. A backup is a full copy of every app table plus the schema version it was
 * taken at. Restores require the same schema version, so rows always match the current tables.
 */
export const BACKUP_APP_ID = 'system-shadow';
export const BACKUP_FORMAT_VERSION = 1;

/** Tables in dependency order (parents first). Restores delete in reverse and insert in this order. */
export const BACKUP_TABLES = [
  'player',
  'player_attributes',
  'quests',
  'quest_attribute_weights',
  'xp_transactions',
  'xp_transaction_attributes',
  'quest_completions',
  'reward_unlocks',
  'inventory_items',
  'weekly_challenges',
  'app_settings',
];

/** Reasonable upper bound for a backup file (characters), to fail fast on the wrong file. */
export const MAX_BACKUP_SIZE = 50 * 1024 * 1024;

export class BackupError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'BackupError';
    this.code = code;
  }
}

/** File name for a backup taken at `date`, e.g. "system-shadow-backup-2026-11-25-2130.json". */
export function getBackupFileName(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return `system-shadow-backup-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}.json`;
}

/**
 * Parses and structurally validates backup text. Throws BackupError with a user-facing message.
 * @returns {object} the parsed backup
 */
export function parseBackup(text, currentSchemaVersion) {
  if (typeof text !== 'string' || text.length === 0) throw new BackupError('EMPTY', 'The selected file is empty.');
  if (text.length > MAX_BACKUP_SIZE) throw new BackupError('TOO_LARGE', 'The selected file is too large to be a backup.');

  let backup;
  try {
    backup = JSON.parse(text);
  } catch {
    throw new BackupError('NOT_JSON', 'The selected file isn’t valid JSON.');
  }

  if (backup?.app !== BACKUP_APP_ID || backup?.kind !== 'backup') {
    throw new BackupError('NOT_A_BACKUP', 'This file isn’t a SYSTEM: SHADOW backup.');
  }
  if (backup.formatVersion !== BACKUP_FORMAT_VERSION) {
    throw new BackupError('UNSUPPORTED_FORMAT', `Backup format ${backup.formatVersion} isn’t supported by this version of the app.`);
  }
  if (!Number.isInteger(backup.schemaVersion)) throw new BackupError('INVALID', 'The backup is missing its schema version.');
  if (backup.schemaVersion > currentSchemaVersion) {
    throw new BackupError('NEWER_BACKUP', 'This backup was made by a newer version of the app. Update the app, then restore.');
  }
  if (backup.schemaVersion < currentSchemaVersion) {
    throw new BackupError('OLDER_BACKUP', 'This backup was made by an older version of the app and can’t be restored here.');
  }

  if (!backup.tables || typeof backup.tables !== 'object') throw new BackupError('INVALID', 'The backup has no data.');
  for (const table of BACKUP_TABLES) {
    const rows = backup.tables[table];
    if (!Array.isArray(rows) || rows.some((row) => !row || typeof row !== 'object' || Array.isArray(row))) {
      throw new BackupError('INVALID', `The backup’s “${table}” data is missing or malformed.`);
    }
  }
  if (!backup.tables.player.some((row) => row.id === 1)) {
    throw new BackupError('INVALID', 'The backup has no player profile.');
  }
  return backup;
}
