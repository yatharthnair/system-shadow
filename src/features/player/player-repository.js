import { getDatabase } from '@/database/database';

import { getTitleLabel } from '@/features/rewards/titles-catalog';

import { DEFAULT_PLAYER_PROFILE } from './player-model';

/** Name and the label of the equipped title (titles are earned through rewards). */
export async function loadPlayerProfile() {
  const db = await getDatabase();
  const row = await db.getFirstAsync('SELECT name, equipped_title_id FROM player WHERE id = 1');
  return row ? { name: row.name, title: getTitleLabel(row.equipped_title_id) } : DEFAULT_PLAYER_PROFILE;
}
