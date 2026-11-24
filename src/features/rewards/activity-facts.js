import { computeBossCampaign } from '@/features/bosses/boss-campaign';
import { RANKS } from '@/features/progression/progression-config';
import { addLocalDays, parseLocalDateKey, toIsoWeekKey, toLocalDateKey } from '@/features/quests/quest-periods';

const RANK_INDEX_BY_ID = Object.fromEntries(RANKS.map((rank, index) => [rank.id, index]));

function increment(map, key, amount = 1) {
  map[key] = (map[key] ?? 0) + amount;
}

/** Longest run of consecutive local days in a sorted list of date keys. */
export function getLongestStreak(sortedDayKeys) {
  let longest = 0;
  let current = 0;
  let previousDay = null;
  for (const dayKey of sortedDayKeys) {
    const day = parseLocalDateKey(dayKey);
    current = previousDay && toLocalDateKey(addLocalDays(previousDay, 1)) === dayKey ? current + 1 : 1;
    longest = Math.max(longest, current);
    previousDay = day;
  }
  return longest;
}

/** Streak still alive at `now`: consecutive days ending today, or yesterday if nothing yet today. */
export function getCurrentStreak(sortedDayKeys, now) {
  const days = new Set(sortedDayKeys);
  let cursor = days.has(toLocalDateKey(now)) ? now : addLocalDays(now, -1);
  let streak = 0;
  while (days.has(toLocalDateKey(cursor))) {
    streak += 1;
    cursor = addLocalDays(cursor, -1);
  }
  return streak;
}

/**
 * Everything rewards are judged on, computed only from real activity.
 *
 * @param {object} input
 * @param {Array<{ id, completedAt, xpAwarded, category, difficulty, cadence }>} input.completions active (not undone), oldest first
 * @param {number} input.customQuestsCreated
 * @param {object} input.progression progression snapshot (level, rank, attributes)
 * @param {Date} input.now
 */
export function buildActivityFacts({ completions, customQuestsCreated, progression, now }) {
  const weekKey = toIsoWeekKey(now);
  const byCategory = {};
  const byDifficulty = {};
  const byCadence = {};
  const dayKeys = new Set();
  const week = { weekKey, completions: 0, questXp: 0, byCategory: {}, activeDays: 0, hardQuests: 0, weeklyQuests: 0 };
  const weekDayKeys = new Set();
  let questXpTotal = 0;
  let hasNightCompletion = false;
  let hasDawnCompletion = false;

  for (const completion of completions) {
    const completedAt = new Date(completion.completedAt);
    const dayKey = toLocalDateKey(completedAt);
    const hour = completedAt.getHours();

    increment(byCategory, completion.category);
    increment(byDifficulty, completion.difficulty);
    increment(byCadence, completion.cadence);
    dayKeys.add(dayKey);
    questXpTotal += completion.xpAwarded;
    if (hour < 4) hasNightCompletion = true;
    if (hour >= 4 && hour < 7) hasDawnCompletion = true;

    if (toIsoWeekKey(completedAt) === weekKey) {
      week.completions += 1;
      week.questXp += completion.xpAwarded;
      increment(week.byCategory, completion.category);
      weekDayKeys.add(dayKey);
      if (completion.difficulty === 'hard' || completion.difficulty === 'elite') week.hardQuests += 1;
      if (completion.cadence === 'weekly') week.weeklyQuests += 1;
    }
  }
  week.activeDays = weekDayKeys.size;

  const sortedDayKeys = [...dayKeys].sort();
  const attributeLevels = Object.fromEntries(
    Object.entries(progression.attributes).map(([key, attribute]) => [key, attribute.level]),
  );

  return {
    now,
    totalCompletions: completions.length,
    questXpTotal,
    byCategory,
    byDifficulty,
    byCadence,
    activeDayCount: sortedDayKeys.length,
    longestStreak: getLongestStreak(sortedDayKeys),
    currentStreak: getCurrentStreak(sortedDayKeys, now),
    hasNightCompletion,
    hasDawnCompletion,
    customQuestsCreated,
    level: progression.level,
    rank: progression.rank,
    rankIndex: RANK_INDEX_BY_ID[progression.rank],
    rankIndexById: RANK_INDEX_BY_ID,
    attributeLevels,
    week,
    bossCampaign: computeBossCampaign(completions),
  };
}
