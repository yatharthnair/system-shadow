/**
 * SQL for quests. Every function takes the connection to run on (`txn` inside an exclusive
 * write, or an in-memory database in tests). No business rules here.
 */

function mapQuestRow(row, attributeWeights) {
  return {
    id: row.id,
    templateId: row.template_id,
    origin: row.origin,
    title: row.title,
    description: row.description,
    category: row.category,
    difficulty: row.difficulty,
    cadence: row.cadence,
    weekdays: row.weekdays ? row.weekdays.split(',').map(Number) : null,
    attributeWeights,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  };
}

function mapCompletionRow(row) {
  return {
    id: row.id,
    questId: row.quest_id,
    periodKey: row.period_key,
    completedAt: row.completed_at,
    xpTransactionId: row.xp_transaction_id,
    xpAwarded: row.xp_awarded,
    questTitle: row.quest_title,
    category: row.category,
    difficulty: row.difficulty,
    undoneAt: row.undone_at,
  };
}

async function readWeightsByQuestId(db, questIds) {
  if (questIds.length === 0) return new Map();
  const rows = await db.getAllAsync(
    `SELECT quest_id, attribute_key, weight FROM quest_attribute_weights
     WHERE quest_id IN (${questIds.map(() => '?').join(', ')})`,
    questIds,
  );
  const weightsByQuestId = new Map(questIds.map((id) => [id, {}]));
  for (const row of rows) weightsByQuestId.get(row.quest_id)[row.attribute_key] = row.weight;
  return weightsByQuestId;
}

export async function listActiveQuests(db) {
  const rows = await db.getAllAsync(
    'SELECT * FROM quests WHERE archived_at IS NULL ORDER BY sort_order, created_at',
  );
  const weightsByQuestId = await readWeightsByQuestId(db, rows.map((row) => row.id));
  return rows.map((row) => mapQuestRow(row, weightsByQuestId.get(row.id)));
}

/** A quest by id, including archived ones, or null. */
export async function getQuest(db, questId) {
  const row = await db.getFirstAsync('SELECT * FROM quests WHERE id = ?', questId);
  if (!row) return null;
  const weightsByQuestId = await readWeightsByQuestId(db, [questId]);
  return mapQuestRow(row, weightsByQuestId.get(questId));
}

async function replaceAttributeWeights(db, questId, attributeWeights) {
  await db.runAsync('DELETE FROM quest_attribute_weights WHERE quest_id = ?', questId);
  for (const [attributeKey, weight] of Object.entries(attributeWeights)) {
    await db.runAsync(
      'INSERT INTO quest_attribute_weights (quest_id, attribute_key, weight) VALUES (?, ?, ?)',
      questId,
      attributeKey,
      weight,
    );
  }
}

/** Inserts a quest. With a `templateId`, does nothing if that template was ever seeded. Returns whether it inserted. */
export async function insertQuest(db, quest) {
  const result = await db.runAsync(
    `INSERT OR IGNORE INTO quests
       (id, template_id, origin, title, description, category, difficulty, cadence, weekdays, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    quest.id,
    quest.templateId ?? null,
    quest.origin,
    quest.title,
    quest.description,
    quest.category,
    quest.difficulty,
    quest.cadence,
    quest.weekdays ? quest.weekdays.join(',') : null,
    quest.sortOrder,
    quest.createdAt,
    quest.updatedAt,
  );
  if (result.changes === 0) return false;
  await replaceAttributeWeights(db, quest.id, quest.attributeWeights);
  return true;
}

export async function updateQuestRow(db, quest) {
  await db.runAsync(
    `UPDATE quests SET title = ?, description = ?, category = ?, difficulty = ?, weekdays = ?, updated_at = ?
     WHERE id = ?`,
    quest.title,
    quest.description,
    quest.category,
    quest.difficulty,
    quest.weekdays ? quest.weekdays.join(',') : null,
    quest.updatedAt,
    quest.id,
  );
  await replaceAttributeWeights(db, quest.id, quest.attributeWeights);
}

export async function archiveQuestRow(db, questId, archivedAt) {
  await db.runAsync('UPDATE quests SET archived_at = ?, updated_at = ? WHERE id = ?', archivedAt, archivedAt, questId);
}

export async function getNextCustomSortOrder(db) {
  const row = await db.getFirstAsync('SELECT COALESCE(MAX(sort_order), 999) + 1 AS next FROM quests');
  return Math.max(row.next, 1000);
}

export async function findActiveCompletion(db, questId, periodKey) {
  const row = await db.getFirstAsync(
    'SELECT * FROM quest_completions WHERE quest_id = ? AND period_key = ? AND undone_at IS NULL',
    questId,
    periodKey,
  );
  return row ? mapCompletionRow(row) : null;
}

/** How many completions (active or undone) a quest has in a period; numbers the next attempt. */
export async function countCompletionsInPeriod(db, questId, periodKey) {
  const row = await db.getFirstAsync(
    'SELECT COUNT(*) AS count FROM quest_completions WHERE quest_id = ? AND period_key = ?',
    questId,
    periodKey,
  );
  return row.count;
}

export async function insertCompletion(db, completion) {
  await db.runAsync(
    `INSERT INTO quest_completions
       (id, quest_id, period_key, completed_at, xp_transaction_id, xp_awarded, quest_title, category, difficulty)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    completion.id,
    completion.questId,
    completion.periodKey,
    completion.completedAt,
    completion.xpTransactionId,
    completion.xpAwarded,
    completion.questTitle,
    completion.category,
    completion.difficulty,
  );
}

export async function getCompletion(db, completionId) {
  const row = await db.getFirstAsync('SELECT * FROM quest_completions WHERE id = ?', completionId);
  return row ? mapCompletionRow(row) : null;
}

export async function markCompletionUndone(db, completionId, undoneAt) {
  await db.runAsync('UPDATE quest_completions SET undone_at = ? WHERE id = ?', undoneAt, completionId);
}

/** Active completions whose period is one of `periodKeys` (the board's current periods). */
export async function listActiveCompletionsForPeriods(db, periodKeys) {
  const rows = await db.getAllAsync(
    `SELECT * FROM quest_completions
     WHERE undone_at IS NULL AND period_key IN (${periodKeys.map(() => '?').join(', ')})`,
    periodKeys,
  );
  return rows.map(mapCompletionRow);
}

/** Completion history, newest first, including undone entries. */
export async function listCompletionHistory(db, { limit, offset }) {
  const rows = await db.getAllAsync(
    'SELECT * FROM quest_completions ORDER BY completed_at DESC, id DESC LIMIT ? OFFSET ?',
    limit,
    offset,
  );
  return rows.map(mapCompletionRow);
}

export async function readCompletionTotals(db) {
  return db.getFirstAsync(
    `SELECT COUNT(*) AS completed_count, COALESCE(SUM(xp_awarded), 0) AS xp_total
     FROM quest_completions WHERE undone_at IS NULL`,
  );
}
