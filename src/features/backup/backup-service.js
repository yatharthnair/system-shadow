import { runExclusiveWrite } from '@/database/exclusive-write';
import { LATEST_SCHEMA_VERSION } from '@/database/migrations';

import { parseBackup } from './backup-format';
import { readBackup, replaceAllData } from './backup-repository';

/** Snapshot of all app data as a backup object (consistent: taken inside one transaction). */
export function createBackup(now = new Date()) {
  return runExclusiveWrite((txn) => readBackup(txn, now));
}

/** Parses and validates backup text without touching the database (for a confirmation step). */
export function inspectBackup(text) {
  return parseBackup(text, LATEST_SCHEMA_VERSION);
}

/**
 * Atomically replaces all app data with the backup. On any error nothing changes.
 * Afterwards, reload app state (progression repair and reward reconciliation run on load).
 */
export function restoreBackup(backup) {
  return runExclusiveWrite((txn) => replaceAllData(txn, backup));
}
