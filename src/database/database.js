import { openDatabaseAsync } from 'expo-sqlite';

import { runMigrations } from './migrations';

export const DATABASE_NAME = 'system-shadow.db';

let databasePromise = null;

async function openAndMigrateDatabase() {
  const db = await openDatabaseAsync(DATABASE_NAME);
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await runMigrations(db);
  return db;
}

/**
 * Returns the app's single SQLite connection, opening and migrating it on first use.
 * Repositories call this; UI code never touches the database directly.
 */
export function getDatabase() {
  if (!databasePromise) {
    databasePromise = openAndMigrateDatabase().catch((error) => {
      databasePromise = null; // allow a retry on next call
      throw error;
    });
  }
  return databasePromise;
}
