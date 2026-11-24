import { getDatabase } from '@/database/database';

import { DEFAULT_PLAYER_PROFILE } from './player-model';

export async function loadPlayerProfile() {
  const db = await getDatabase();
  const row = await db.getFirstAsync('SELECT name, title FROM player WHERE id = 1');
  return row ? { name: row.name, title: row.title } : DEFAULT_PLAYER_PROFILE;
}
