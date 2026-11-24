import { runExclusiveWrite } from '@/database/exclusive-write';

import { readNotificationSettings, writeNotificationSettings } from './notification-repository';
import { normalizeNotificationSettings } from './notification-settings';

export function loadNotificationSettings() {
  return runExclusiveWrite((txn) => readNotificationSettings(txn));
}

/** Validates and saves settings; returns what was stored. */
export function saveNotificationSettings(settings, now = new Date()) {
  const normalized = normalizeNotificationSettings(settings);
  return runExclusiveWrite(async (txn) => {
    await writeNotificationSettings(txn, normalized, now.toISOString());
    return normalized;
  });
}
