/**
 * Reads for analytics. Only real, standing activity: undone completions and reversed XP awards are
 * excluded. XP is dated by when it was earned — a quest's completion time, a reward's unlock time —
 * falling back to the ledger timestamp for other sources. Legacy pre-ledger XP has no date and is skipped.
 */

const STANDING_AWARDS = `
  t.kind = 'award'
  AND t.source <> 'migration'
  AND NOT EXISTS (SELECT 1 FROM xp_transactions r WHERE r.reverses_transaction_id = t.id)`;

const OCCURRED_AT = 'COALESCE(c.completed_at, u.unlocked_at, t.created_at)';

export async function readAnalyticsData(db) {
  const completions = await db.getAllAsync(
    `SELECT c.quest_id, c.period_key, c.completed_at, c.xp_awarded, c.category, q.cadence
     FROM quest_completions c JOIN quests q ON q.id = c.quest_id
     WHERE c.undone_at IS NULL
     ORDER BY c.completed_at`,
  );
  const quests = await db.getAllAsync('SELECT id, cadence, weekdays, created_at, archived_at FROM quests');
  const xpEvents = await db.getAllAsync(
    `SELECT t.source, t.xp, ${OCCURRED_AT} AS occurred_at
     FROM xp_transactions t
     LEFT JOIN quest_completions c ON c.xp_transaction_id = t.id
     LEFT JOIN reward_unlocks u ON u.xp_transaction_id = t.id
     WHERE ${STANDING_AWARDS}`,
  );
  const attributeXpEvents = await db.getAllAsync(
    `SELECT a.attribute_key, a.xp, ${OCCURRED_AT} AS occurred_at
     FROM xp_transaction_attributes a
     JOIN xp_transactions t ON t.id = a.transaction_id
     LEFT JOIN quest_completions c ON c.xp_transaction_id = t.id
     LEFT JOIN reward_unlocks u ON u.xp_transaction_id = t.id
     WHERE ${STANDING_AWARDS}`,
  );

  return {
    completions: completions.map((row) => ({
      questId: row.quest_id,
      periodKey: row.period_key,
      completedAt: row.completed_at,
      xpAwarded: row.xp_awarded,
      category: row.category,
      cadence: row.cadence,
    })),
    quests: quests.map((row) => ({
      id: row.id,
      cadence: row.cadence,
      weekdays: row.weekdays ? row.weekdays.split(',').map(Number) : null,
      createdAt: row.created_at,
      archivedAt: row.archived_at,
    })),
    xpEvents: xpEvents.map((row) => ({ source: row.source, xp: row.xp, occurredAt: row.occurred_at })),
    attributeXpEvents: attributeXpEvents.map((row) => ({ attributeKey: row.attribute_key, xp: row.xp, occurredAt: row.occurred_at })),
  };
}
