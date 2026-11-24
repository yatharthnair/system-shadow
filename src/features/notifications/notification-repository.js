import { normalizeNotificationSettings } from './notification-settings';

const SETTINGS_KEY = 'notifications';

export async function readNotificationSettings(db) {
  const row = await db.getFirstAsync('SELECT value FROM app_settings WHERE key = ?', SETTINGS_KEY);
  if (!row) return normalizeNotificationSettings(null);
  try {
    return normalizeNotificationSettings(JSON.parse(row.value));
  } catch {
    return normalizeNotificationSettings(null);
  }
}

export async function writeNotificationSettings(db, settings, updatedAt) {
  await db.runAsync(
    `INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    SETTINGS_KEY,
    JSON.stringify(settings),
    updatedAt,
  );
}
