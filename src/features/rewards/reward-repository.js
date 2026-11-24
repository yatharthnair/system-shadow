/**
 * SQL for rewards: unlocks, inventory, weekly challenges, titles, and the activity reads that
 * rewards are judged on. Every function takes the connection to run on. No business rules here.
 */

function mapUnlockRow(row) {
  return {
    id: row.id,
    sourceKey: row.source_key,
    kind: row.kind,
    title: row.title,
    description: row.description,
    xpReward: row.xp_reward,
    xpTransactionId: row.xp_transaction_id,
    titleReward: row.title_reward,
    unlockedAt: row.unlocked_at,
    revokedAt: row.revoked_at,
  };
}

/** Active (not undone) quest completions with their quest's cadence, oldest first. */
export async function listActiveCompletionsForRewards(db) {
  const rows = await db.getAllAsync(
    `SELECT c.id, c.completed_at, c.xp_awarded, c.category, c.difficulty, q.cadence
     FROM quest_completions c JOIN quests q ON q.id = c.quest_id
     WHERE c.undone_at IS NULL
     ORDER BY c.completed_at, c.id`,
  );
  return rows.map((row) => ({
    id: row.id,
    completedAt: row.completed_at,
    xpAwarded: row.xp_awarded,
    category: row.category,
    difficulty: row.difficulty,
    cadence: row.cadence,
  }));
}

export async function countCustomQuestsCreated(db) {
  return (await db.getFirstAsync("SELECT COUNT(*) AS count FROM quests WHERE origin = 'custom'")).count;
}

export async function listActiveQuestCategories(db) {
  const rows = await db.getAllAsync('SELECT DISTINCT category FROM quests WHERE archived_at IS NULL');
  return rows.map((row) => row.category);
}

export async function listWeeklyChallenges(db, weekKey) {
  const rows = await db.getAllAsync('SELECT * FROM weekly_challenges WHERE week_key = ? ORDER BY slot', weekKey);
  return rows.map((row) => ({
    weekKey: row.week_key,
    challengeId: row.challenge_id,
    slot: row.slot,
    metric: row.metric,
    category: row.category,
    target: row.target,
    xpReward: row.xp_reward,
    itemKey: row.item_key,
    title: row.title,
    description: row.description,
  }));
}

export async function insertWeeklyChallenges(db, weekKey, challenges, createdAt) {
  for (const challenge of challenges) {
    await db.runAsync(
      `INSERT OR IGNORE INTO weekly_challenges
         (week_key, challenge_id, slot, metric, category, target, xp_reward, item_key, title, description, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      weekKey,
      challenge.challengeId,
      challenge.slot,
      challenge.metric,
      challenge.category,
      challenge.target,
      challenge.xpReward,
      challenge.itemKey,
      challenge.title,
      challenge.description,
      createdAt,
    );
  }
}

export async function listActiveUnlocks(db) {
  const rows = await db.getAllAsync('SELECT * FROM reward_unlocks WHERE revoked_at IS NULL ORDER BY unlocked_at, id');
  return rows.map(mapUnlockRow);
}

export async function listRecentUnlocks(db, limit) {
  const rows = await db.getAllAsync('SELECT * FROM reward_unlocks ORDER BY unlocked_at DESC, id DESC LIMIT ?', limit);
  return rows.map(mapUnlockRow);
}

/** Number of unlocks (active or revoked) for a source; numbers the next attempt. */
export async function countUnlocksForSource(db, sourceKey) {
  return (await db.getFirstAsync('SELECT COUNT(*) AS count FROM reward_unlocks WHERE source_key = ?', sourceKey)).count;
}

export async function insertUnlock(db, unlock) {
  await db.runAsync(
    `INSERT INTO reward_unlocks
       (id, source_key, kind, title, description, xp_reward, xp_transaction_id, title_reward, unlocked_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    unlock.id,
    unlock.sourceKey,
    unlock.kind,
    unlock.title,
    unlock.description,
    unlock.xpReward,
    unlock.xpTransactionId,
    unlock.titleReward,
    unlock.unlockedAt,
  );
}

export async function revokeUnlock(db, unlockId, revokedAt) {
  await db.runAsync('UPDATE reward_unlocks SET revoked_at = ? WHERE id = ?', revokedAt, unlockId);
  await db.runAsync('UPDATE inventory_items SET revoked_at = ? WHERE unlock_id = ? AND revoked_at IS NULL', revokedAt, unlockId);
}

export async function insertInventoryItem(db, item) {
  await db.runAsync(
    'INSERT INTO inventory_items (id, unlock_id, item_key, acquired_at) VALUES (?, ?, ?, ?)',
    item.id,
    item.unlockId,
    item.itemKey,
    item.acquiredAt,
  );
}

export async function listInventoryItems(db) {
  const rows = await db.getAllAsync(
    'SELECT id, unlock_id, item_key, acquired_at FROM inventory_items WHERE revoked_at IS NULL ORDER BY acquired_at, id',
  );
  return rows.map((row) => ({ id: row.id, unlockId: row.unlock_id, itemKey: row.item_key, acquiredAt: row.acquired_at }));
}

export async function getEquippedTitleId(db) {
  return (await db.getFirstAsync('SELECT equipped_title_id FROM player WHERE id = 1'))?.equipped_title_id ?? null;
}

export async function setEquippedTitleId(db, titleId) {
  await db.runAsync('UPDATE player SET equipped_title_id = ? WHERE id = 1', titleId);
}

export async function isTitleOwned(db, titleId) {
  const row = await db.getFirstAsync(
    'SELECT 1 AS owned FROM reward_unlocks WHERE title_reward = ? AND revoked_at IS NULL',
    titleId,
  );
  return row != null;
}
