import { runExclusiveWrite } from '@/database/exclusive-write';
import {
  applyXpRewardInTransaction,
  reverseXpTransactionInTransaction,
} from '@/features/progression/progression-service';
import { createXpReward } from '@/features/progression/xp-reward';
import { reconcileRewardsInTransaction } from '@/features/rewards/reward-reconciler';
import { createId } from '@/utils/create-id';

import { QuestError } from './quest-errors';
import { toIsoWeekKey, toLocalDateKey } from './quest-periods';
import {
  archiveQuestRow,
  countCompletionsInPeriod,
  findActiveCompletion,
  getCompletion,
  getNextCustomSortOrder,
  getQuest,
  insertCompletion,
  insertQuest,
  listActiveCompletionsForPeriods,
  listActiveQuests,
  listCompletionHistory,
  markCompletionUndone,
  readCompletionTotals,
  updateQuestRow,
} from './quest-repository';
import { buildQuestRewardInput } from './quest-rewards';
import { canUndoCompletion, getQuestPeriod, ONCE_PERIOD_KEY } from './quest-schedule';
import { QUEST_TEMPLATES } from './quest-templates';
import { assertValidQuestInput } from './quest-validation';

/**
 * Quest operations against SQLite.
 *
 * XP integrity:
 * - A completion row and its XP award are written in the same exclusive transaction — both or neither.
 * - The database allows one active completion per quest per period (partial unique index), and the
 *   service checks it first, so completing twice in a period returns 'already-completed' with no XP.
 * - Each completion gets its own XP transaction id (`quest:<questId>:<period>:<attempt>`), so
 *   undo → complete again earns XP again, exactly once per valid completion.
 * - Undo appends a reversal for that exact award (see progression-service) and marks the completion
 *   undone, atomically. Undo is allowed only while the completion's period is current.
 * - Rewards (achievements, challenges, boss milestones, level milestones) are reconciled in the same
 *   transaction, so a completion and everything it unlocks — or an undo and everything it revokes —
 *   commit together. `rewards` in the result carries the unlock events and the final XP state.
 */

async function seedQuestTemplates(txn, nowIso) {
  for (const [index, template] of QUEST_TEMPLATES.entries()) {
    await insertQuest(txn, {
      id: `system:${template.templateId}`,
      templateId: template.templateId,
      origin: 'system',
      title: template.title,
      description: template.description ?? '',
      category: template.category,
      difficulty: template.difficulty,
      cadence: template.cadence,
      weekdays: template.weekdays ?? null,
      attributeWeights: assertValidQuestInput(template).attributeWeights,
      sortOrder: index,
      createdAt: nowIso,
      updatedAt: nowIso,
    });
  }
}

/** Everything the quest board needs at `now`. Seeds built-in quests on first run. */
export function loadQuestBoardData(now = new Date()) {
  return runExclusiveWrite(async (txn) => {
    await seedQuestTemplates(txn, now.toISOString());
    const quests = await listActiveQuests(txn);
    const activeCompletions = await listActiveCompletionsForPeriods(txn, [
      toLocalDateKey(now),
      toIsoWeekKey(now),
      ONCE_PERIOD_KEY,
    ]);
    return { quests, activeCompletions };
  });
}

export async function createQuest(input, now = new Date()) {
  const value = assertValidQuestInput(input);
  return runExclusiveWrite(async (txn) => {
    const nowIso = now.toISOString();
    const quest = {
      ...value,
      id: createId('quest'),
      templateId: null,
      origin: 'custom',
      sortOrder: await getNextCustomSortOrder(txn),
      createdAt: nowIso,
      updatedAt: nowIso,
      archivedAt: null,
    };
    await insertQuest(txn, quest);
    const rewards = await reconcileRewardsInTransaction(txn, now);
    return { ...quest, rewards };
  });
}

/**
 * Edits title, description, category, difficulty, days and attributes. The repeat type is fixed.
 * Past completions keep the XP they awarded; changes apply to future completions.
 */
export function updateQuest(questId, input, now = new Date()) {
  return runExclusiveWrite(async (txn) => {
    const existingQuest = await getQuest(txn, questId);
    if (!existingQuest || existingQuest.archivedAt) throw new QuestError('QUEST_NOT_FOUND', `No active quest "${questId}"`);

    const value = assertValidQuestInput(input, { existingQuest });
    const quest = { ...existingQuest, ...value, updatedAt: now.toISOString() };
    await updateQuestRow(txn, quest);
    return quest;
  });
}

/** Removes a quest from the board. Its history (and the XP it earned) is kept. */
export function archiveQuest(questId, now = new Date()) {
  return runExclusiveWrite(async (txn) => {
    const quest = await getQuest(txn, questId);
    if (!quest) throw new QuestError('QUEST_NOT_FOUND', `No quest "${questId}"`);
    if (!quest.archivedAt) await archiveQuestRow(txn, questId, now.toISOString());
  });
}

/**
 * Completes a quest for its current period and awards XP, exactly once.
 * @returns {Promise<
 *   | { status: 'completed', completion: object, progression: object, rewards: object }
 *   | { status: 'already-completed', completion: object, progression: null, rewards: null }
 * >}
 * @throws {QuestError} QUEST_NOT_FOUND | QUEST_ARCHIVED | NOT_SCHEDULED_TODAY
 */
export function completeQuest(questId, now = new Date()) {
  return runExclusiveWrite(async (txn) => {
    const quest = await getQuest(txn, questId);
    if (!quest) throw new QuestError('QUEST_NOT_FOUND', `No quest "${questId}"`);
    if (quest.archivedAt) throw new QuestError('QUEST_ARCHIVED', 'This quest has been archived');

    const period = getQuestPeriod(quest, now);
    if (!period) throw new QuestError('NOT_SCHEDULED_TODAY', 'This quest isn’t scheduled today');

    const existingCompletion = await findActiveCompletion(txn, quest.id, period.periodKey);
    if (existingCompletion) {
      return { status: 'already-completed', completion: existingCompletion, progression: null, rewards: null };
    }

    const attempt = (await countCompletionsInPeriod(txn, quest.id, period.periodKey)) + 1;
    const completionId = `${quest.id}:${period.periodKey}:${attempt}`;
    const reward = createXpReward(buildQuestRewardInput(quest, completionId));

    const progression = await applyXpRewardInTransaction(txn, reward);
    if (progression.status !== 'applied') {
      // Unreachable while ids are derived from attempts; abort rather than record a completion without XP.
      throw new QuestError('XP_ALREADY_AWARDED', `XP transaction ${reward.id} already exists`);
    }

    const completion = {
      id: completionId,
      questId: quest.id,
      periodKey: period.periodKey,
      completedAt: now.toISOString(),
      xpTransactionId: reward.id,
      xpAwarded: reward.xp,
      questTitle: quest.title,
      category: quest.category,
      difficulty: quest.difficulty,
      undoneAt: null,
    };
    await insertCompletion(txn, completion);
    const rewards = await reconcileRewardsInTransaction(txn, now);

    return { status: 'completed', completion, progression, rewards };
  });
}

/**
 * Undoes a completion and reverses exactly the XP it awarded.
 * @returns {Promise<
 *   | { status: 'undone', completion: object, progression: object, rewards: object }
 *   | { status: 'already-undone', completion: object, progression: null, rewards: null }
 * >}
 * @throws {QuestError} COMPLETION_NOT_FOUND | UNDO_WINDOW_CLOSED
 */
export function undoQuestCompletion(completionId, now = new Date()) {
  return runExclusiveWrite(async (txn) => {
    const completion = await getCompletion(txn, completionId);
    if (!completion) throw new QuestError('COMPLETION_NOT_FOUND', `No completion "${completionId}"`);
    if (completion.undoneAt) return { status: 'already-undone', completion, progression: null, rewards: null };

    const quest = await getQuest(txn, completion.questId);
    if (!canUndoCompletion(quest, completion, now)) {
      throw new QuestError('UNDO_WINDOW_CLOSED', 'This quest’s period has ended, so it can no longer be undone');
    }

    const progression = await reverseXpTransactionInTransaction(txn, completion.xpTransactionId);
    const undoneAt = now.toISOString();
    await markCompletionUndone(txn, completionId, undoneAt);
    const rewards = await reconcileRewardsInTransaction(txn, now);

    return { status: 'undone', completion: { ...completion, undoneAt }, progression, rewards };
  });
}

/** Quest log, newest first (including undone entries), plus lifetime totals. */
export function loadQuestHistory({ limit = 100, offset = 0 } = {}) {
  return runExclusiveWrite(async (txn) => {
    const entries = await listCompletionHistory(txn, { limit, offset });
    const totals = await readCompletionTotals(txn);
    return {
      entries,
      totals: { completedCount: totals.completed_count, xpTotal: totals.xp_total },
      hasMore: entries.length === limit,
    };
  });
}
