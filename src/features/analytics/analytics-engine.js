import { ATTRIBUTE_KEYS } from '@/features/progression/attributes';
import { DEFAULT_PROGRESSION_RULES } from '@/features/progression/progression-engine';
import { QUEST_CATEGORIES } from '@/features/quests/quest-config';
import {
  addLocalDays,
  getIsoWeekday,
  parseLocalDateKey,
  startOfIsoWeek,
  toIsoWeekKey,
  toLocalDateKey,
} from '@/features/quests/quest-periods';
import { getCurrentStreak, getLongestStreak } from '@/features/rewards/activity-facts';

export const ANALYTICS_RANGES = [7, 30, 90];

const REWARD_SOURCES = new Set(['achievement', 'challenge', 'boss_milestone', 'level_milestone']);

function classifyXpSource(source) {
  if (source === 'quest') return 'quest';
  if (REWARD_SOURCES.has(source)) return 'reward';
  return 'other';
}

/** Local date keys for the `rangeDays` days ending today, oldest first. */
export function getRangeDayKeys(now, rangeDays) {
  return Array.from({ length: rangeDays }, (_, index) => toLocalDateKey(addLocalDays(now, index - rangeDays + 1)));
}

/**
 * Chart buckets: one per day for 7/30-day ranges, one per ISO week for longer ranges.
 * @returns {Array<{ key: string, label: string, dayKeys: string[], isPartial: boolean }>}
 */
export function getRangeBuckets(dayKeys, now) {
  const todayKey = toLocalDateKey(now);
  if (dayKeys.length <= 31) {
    return dayKeys.map((dayKey) => ({ key: dayKey, startDate: parseLocalDateKey(dayKey), dayKeys: [dayKey], isPartial: dayKey === todayKey }));
  }
  const buckets = [];
  for (const dayKey of dayKeys) {
    const weekKey = toIsoWeekKey(parseLocalDateKey(dayKey));
    if (buckets.at(-1)?.key !== weekKey) {
      buckets.push({ key: weekKey, startDate: parseLocalDateKey(dayKey), dayKeys: [], isPartial: false });
    }
    buckets.at(-1).dayKeys.push(dayKey);
  }
  for (const bucket of buckets) bucket.isPartial = bucket.dayKeys.length < 7 || bucket.dayKeys.includes(todayKey);
  return buckets;
}

const dayKeyOf = (isoTimestamp) => toLocalDateKey(new Date(isoTimestamp));

function sumBy(items, keyFn, valueFn = () => 1) {
  const totals = new Map();
  for (const item of items) {
    const key = keyFn(item);
    totals.set(key, (totals.get(key) ?? 0) + valueFn(item));
  }
  return totals;
}

/** Whether a quest was on the board on a local day (created by then, not archived by then). */
function existedOn(quest, dayKey) {
  return dayKeyOf(quest.createdAt) <= dayKey && (!quest.archivedAt || dayKeyOf(quest.archivedAt) > dayKey);
}

function xpSection(xpEvents, dayKeys, buckets) {
  const firstDay = dayKeys[0];
  const inRange = xpEvents.filter((event) => dayKeyOf(event.occurredAt) >= firstDay);
  const byDayAndKind = new Map();
  for (const event of inRange) {
    const key = `${dayKeyOf(event.occurredAt)}|${classifyXpSource(event.source)}`;
    byDayAndKind.set(key, (byDayAndKind.get(key) ?? 0) + event.xp);
  }
  const series = buckets.map((bucket) => {
    const point = { key: bucket.key, startDate: bucket.startDate, isPartial: bucket.isPartial, quest: 0, reward: 0, other: 0 };
    for (const dayKey of bucket.dayKeys) {
      for (const kind of ['quest', 'reward', 'other']) point[kind] += byDayAndKind.get(`${dayKey}|${kind}`) ?? 0;
    }
    point.total = point.quest + point.reward + point.other;
    return point;
  });

  const total = series.reduce((sum, point) => sum + point.total, 0);
  const rangeLength = dayKeys.length;
  const previousStart = toLocalDateKey(addLocalDays(parseLocalDateKey(firstDay), -rangeLength));
  const previousTotal = xpEvents
    .filter((event) => {
      const dayKey = dayKeyOf(event.occurredAt);
      return dayKey >= previousStart && dayKey < firstDay;
    })
    .reduce((sum, event) => sum + event.xp, 0);

  return {
    series,
    total,
    fromQuests: series.reduce((sum, point) => sum + point.quest, 0),
    fromRewards: series.reduce((sum, point) => sum + point.reward, 0),
    averagePerDay: total / rangeLength,
    previousTotal,
    changeRatio: previousTotal > 0 ? (total - previousTotal) / previousTotal : null,
  };
}

function completionRateSection(quests, completions, dayKeys, now) {
  const todayKey = toLocalDateKey(now);
  const completedByPeriod = sumBy(completions, (completion) => `${completion.questId}|${completion.periodKey}`);

  const daily = dayKeys.map((dayKey) => {
    const weekday = getIsoWeekday(parseLocalDateKey(dayKey));
    const eligible = quests.filter(
      (quest) =>
        (quest.cadence === 'daily' || (quest.cadence === 'weekdays' && quest.weekdays?.includes(weekday))) && existedOn(quest, dayKey),
    );
    const completed = eligible.filter((quest) => completedByPeriod.has(`${quest.id}|${dayKey}`)).length;
    return { key: dayKey, startDate: parseLocalDateKey(dayKey), eligible: eligible.length, completed, rate: eligible.length ? completed / eligible.length : null, isPartial: dayKey === todayKey };
  });

  const weekKeys = [...new Set(dayKeys.map((dayKey) => toIsoWeekKey(parseLocalDateKey(dayKey))))];
  const weekly = weekKeys.map((weekKey) => {
    const daysOfWeek = dayKeys.filter((dayKey) => toIsoWeekKey(parseLocalDateKey(dayKey)) === weekKey);
    const weekStart = startOfIsoWeek(parseLocalDateKey(daysOfWeek[0]));
    const weekEndKey = toLocalDateKey(addLocalDays(weekStart, 6));
    const weekStartKey = toLocalDateKey(weekStart);
    const eligible = quests.filter(
      (quest) => quest.cadence === 'weekly' && dayKeyOf(quest.createdAt) <= weekEndKey && (!quest.archivedAt || dayKeyOf(quest.archivedAt) > weekStartKey),
    );
    const completed = eligible.filter((quest) => completedByPeriod.has(`${quest.id}|${weekKey}`)).length;
    return { key: weekKey, startDate: weekStart, eligible: eligible.length, completed, rate: eligible.length ? completed / eligible.length : null, isPartial: daysOfWeek.includes(todayKey) };
  });

  // Averages use finished periods only, so a half-finished today/this week doesn't drag them down.
  const average = (periods) => {
    const finished = periods.filter((period) => !period.isPartial && period.eligible > 0);
    const eligible = finished.reduce((sum, period) => sum + period.eligible, 0);
    return eligible ? finished.reduce((sum, period) => sum + period.completed, 0) / eligible : null;
  };

  return { daily, weekly, dailyAverage: average(daily), weeklyAverage: average(weekly) };
}

function cumulativeLevelSeries(events, dayKeys, curve) {
  const firstDay = dayKeys[0];
  const before = events.filter((event) => dayKeyOf(event.occurredAt) < firstDay).reduce((sum, event) => sum + event.xp, 0);
  const byDay = sumBy(events.filter((event) => dayKeyOf(event.occurredAt) >= firstDay), (event) => dayKeyOf(event.occurredAt), (event) => event.xp);

  let running = before;
  const series = dayKeys.map((dayKey) => {
    running += byDay.get(dayKey) ?? 0;
    const levelState = curve.getLevelState(running);
    return { key: dayKey, startDate: parseLocalDateKey(dayKey), totalXp: running, level: levelState.level, levelProgress: levelState.level + levelState.progress };
  });
  return { series, xpGained: running - before, startLevel: curve.getLevelState(before).level, endLevel: series.at(-1).level };
}

function attributeSection(attributeXpEvents, dayKeys, rules) {
  return ATTRIBUTE_KEYS.map((attributeKey) => ({
    attributeKey,
    ...cumulativeLevelSeries(
      attributeXpEvents.filter((event) => event.attributeKey === attributeKey),
      dayKeys,
      rules.attribute,
    ),
  }));
}

function categoryCountsPerBucket(completions, buckets, categories) {
  const byDayAndCategory = sumBy(completions, (completion) => `${dayKeyOf(completion.completedAt)}|${completion.category}`);
  return buckets.map((bucket) => {
    const point = { key: bucket.key, startDate: bucket.startDate, isPartial: bucket.isPartial };
    for (const category of categories) {
      point[category] = bucket.dayKeys.reduce((sum, dayKey) => sum + (byDayAndCategory.get(`${dayKey}|${category}`) ?? 0), 0);
    }
    return point;
  });
}

function daysSince(completions, category, now) {
  const last = completions.filter((completion) => completion.category === category).at(-1);
  if (!last) return null;
  const lastDay = parseLocalDateKey(dayKeyOf(last.completedAt));
  return Math.round((parseLocalDateKey(toLocalDateKey(now)) - lastDay) / 86_400_000);
}

/** Consecutive-day runs from sorted day keys, newest first. */
export function getStreakRuns(sortedDayKeys) {
  const runs = [];
  for (const dayKey of sortedDayKeys) {
    const run = runs.at(-1);
    if (run && toLocalDateKey(addLocalDays(parseLocalDateKey(run.end), 1)) === dayKey) {
      run.end = dayKey;
      run.length += 1;
    } else {
      runs.push({ start: dayKey, end: dayKey, length: 1 });
    }
  }
  return runs.reverse();
}

/**
 * Builds every analytics section for the `rangeDays` days ending at `now`. Pure.
 *
 * @param {object} data from readAnalyticsData
 * @param {{ now: Date, rangeDays: number, rules?: object }} options
 */
export function buildAnalytics({ completions, quests, xpEvents, attributeXpEvents }, { now, rangeDays, rules = DEFAULT_PROGRESSION_RULES }) {
  const dayKeys = getRangeDayKeys(now, rangeDays);
  const buckets = getRangeBuckets(dayKeys, now);
  const firstDay = dayKeys[0];
  const completionsInRange = completions.filter((completion) => dayKeyOf(completion.completedAt) >= firstDay);
  const countsByDay = sumBy(completionsInRange, (completion) => dayKeyOf(completion.completedAt));

  // Fitness & strength
  const strength = cumulativeLevelSeries(attributeXpEvents.filter((event) => event.attributeKey === 'strength'), dayKeys, rules.attribute);
  const fitnessPerBucket = categoryCountsPerBucket(completionsInRange, buckets, ['fitness']);

  // Nutrition consistency
  const nutritionDays = new Set(completions.filter((completion) => completion.category === 'nutrition').map((completion) => dayKeyOf(completion.completedAt)));
  const nutritionDaysInRange = dayKeys.filter((dayKey) => nutritionDays.has(dayKey)).length;

  // Social & family
  const socialFamilyPerBucket = categoryCountsPerBucket(completionsInRange, buckets, ['social', 'family']);

  // Category breakdown
  const categoryCounts = sumBy(completionsInRange, (completion) => completion.category);
  const categoryXp = sumBy(completionsInRange, (completion) => completion.category, (completion) => completion.xpAwarded);
  const totalInRange = completionsInRange.length;
  const categories = QUEST_CATEGORIES.map((category) => ({
    category: category.key,
    count: categoryCounts.get(category.key) ?? 0,
    xp: categoryXp.get(category.key) ?? 0,
    share: totalInRange ? (categoryCounts.get(category.key) ?? 0) / totalInRange : 0,
  })).sort((a, b) => b.count - a.count || b.xp - a.xp);

  // Streaks (all-time history)
  const activeDayKeys = [...new Set(completions.map((completion) => dayKeyOf(completion.completedAt)))].sort();

  return {
    rangeDays,
    dayKeys,
    xp: xpSection(xpEvents, dayKeys, buckets),
    completionRates: completionRateSection(quests, completions, dayKeys, now),
    fitness: {
      strengthSeries: strength.series,
      strengthXpGained: strength.xpGained,
      strengthLevel: { start: strength.startLevel, end: strength.endLevel },
      fitnessPerBucket: fitnessPerBucket.map((point) => ({ ...point, value: point.fitness })),
      fitnessCompletions: categoryCounts.get('fitness') ?? 0,
    },
    nutrition: {
      activeDays: nutritionDaysInRange,
      consistency: nutritionDaysInRange / rangeDays,
      currentStreak: getCurrentStreak([...nutritionDays].sort(), now),
      calendar: dayKeys.map((dayKey) => ({ key: dayKey, date: parseLocalDateKey(dayKey), value: nutritionDays.has(dayKey) ? 1 : 0 })),
    },
    social: {
      perBucket: socialFamilyPerBucket,
      socialCompletions: categoryCounts.get('social') ?? 0,
      familyCompletions: categoryCounts.get('family') ?? 0,
      daysSinceSocial: daysSince(completions, 'social', now),
      daysSinceFamily: daysSince(completions, 'family', now),
    },
    attributes: attributeSection(attributeXpEvents, dayKeys, rules),
    categories,
    totalCompletions: totalInRange,
    streaks: {
      current: getCurrentStreak(activeDayKeys, now),
      longest: getLongestStreak(activeDayKeys),
      activeDaysInRange: dayKeys.filter((dayKey) => countsByDay.has(dayKey)).length,
      runs: getStreakRuns(activeDayKeys).filter((run) => run.length >= 2).slice(0, 5),
      calendar: dayKeys.map((dayKey) => ({ key: dayKey, date: parseLocalDateKey(dayKey), value: countsByDay.get(dayKey) ?? 0 })),
    },
  };
}
