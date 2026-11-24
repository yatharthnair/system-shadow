import { CADENCES_BY_KEY } from './quest-config';
import { previewQuestReward } from './quest-rewards';
import { canUndoCompletion, getNextScheduledDate, getQuestPeriod, isCompletedToday } from './quest-schedule';

/**
 * Combines quest definitions with their active completions into what the quest screen shows
 * at `now`. Pure: the same inputs always produce the same board.
 *
 * Item `status`:
 * - 'available'  — can be completed in the current period
 * - 'completed'  — has an active completion in the current period
 * - 'resting'    — a specific-days quest that isn't scheduled today
 *
 * One-time quests completed before today are finished for good: they leave the board
 * (they remain in the quest log).
 */
export function buildQuestBoard(quests, activeCompletions, now) {
  const completionByQuestAndPeriod = new Map(
    activeCompletions.map((completion) => [`${completion.questId}|${completion.periodKey}`, completion]),
  );

  return quests
    .filter((quest) => !quest.archivedAt)
    .map((quest) => {
      const period = getQuestPeriod(quest, now);
      const completion = period ? (completionByQuestAndPeriod.get(`${quest.id}|${period.periodKey}`) ?? null) : null;
      const reward = previewQuestReward(quest);

      let status = 'available';
      if (!period) status = 'resting';
      else if (completion) status = 'completed';

      return {
        quest,
        group: CADENCES_BY_KEY[quest.cadence].group,
        status,
        periodKey: period?.periodKey ?? null,
        resetsAt: period?.endsAt ?? null,
        nextScheduledAt: period ? null : getNextScheduledDate(quest, now),
        completion,
        canUndo: completion ? canUndoCompletion(quest, completion, now) : false,
        xpReward: completion ? completion.xpAwarded : reward.xp,
        attributeXp: reward.attributeXp,
      };
    })
    .filter((item) => !(item.quest.cadence === 'once' && item.completion && !isCompletedToday(item.completion, now)));
}

function countProgress(items) {
  const counted = items.filter((item) => item.status !== 'resting');
  return {
    completed: counted.filter((item) => item.status === 'completed').length,
    total: counted.length,
  };
}

/** Progress counts for the summary panel. */
export function summarizeQuestBoard(items) {
  const overall = countProgress(items);
  return {
    overall: { ...overall, progress: overall.total === 0 ? 0 : overall.completed / overall.total },
    daily: countProgress(items.filter((item) => item.group === 'daily')),
    weekly: countProgress(items.filter((item) => item.group === 'weekly')),
    custom: countProgress(items.filter((item) => item.group === 'custom')),
    xpEarned: items.filter((item) => item.status === 'completed').reduce((sum, item) => sum + item.xpReward, 0),
    xpAvailable: items.filter((item) => item.status === 'available').reduce((sum, item) => sum + item.xpReward, 0),
  };
}

/**
 * @param {{ group?: 'all' | 'daily' | 'weekly' | 'custom', category?: string | null, hideCompleted?: boolean }} filters
 */
export function filterQuestBoard(items, { group = 'all', category = null, hideCompleted = false } = {}) {
  return items.filter(
    (item) =>
      (group === 'all' || item.group === group) &&
      (category == null || item.quest.category === category) &&
      (!hideCompleted || item.status !== 'completed'),
  );
}

const STATUS_ORDER = { available: 0, completed: 1, resting: 2 };

/** Sort for display: available first, then completed, then resting; stable by sort order and age. */
export function sortQuestBoard(items) {
  return [...items].sort(
    (a, b) =>
      STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
      a.quest.sortOrder - b.quest.sortOrder ||
      a.quest.createdAt.localeCompare(b.quest.createdAt),
  );
}
