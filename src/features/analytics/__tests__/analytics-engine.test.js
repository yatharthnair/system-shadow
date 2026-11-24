import { buildAnalytics, getRangeBuckets, getRangeDayKeys, getStreakRuns } from '../analytics-engine';

const now = new Date(2026, 10, 25, 15); // Wed 25 Nov 2026
const iso = (month, day, hour = 12) => new Date(2026, month - 1, day, hour).toISOString();

const quest = (id, cadence, extra = {}) => ({ id, cadence, weekdays: null, createdAt: iso(10, 1), archivedAt: null, ...extra });
const completion = (questId, day, { category = 'fitness', cadence = 'daily', xp = 40, periodKey, month = 11 } = {}) => ({
  questId,
  periodKey: periodKey ?? `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
  completedAt: iso(month, day),
  xpAwarded: xp,
  category,
  cadence,
});
const empty = { completions: [], quests: [], xpEvents: [], attributeXpEvents: [] };

describe('ranges and buckets', () => {
  test('7 and 30 day ranges end today; 7/30 bucket by day, 90 by ISO week', () => {
    expect(getRangeDayKeys(now, 7)).toEqual(['2026-11-19', '2026-11-20', '2026-11-21', '2026-11-22', '2026-11-23', '2026-11-24', '2026-11-25']);
    expect(getRangeBuckets(getRangeDayKeys(now, 30), now)).toHaveLength(30);
    const weekly = getRangeBuckets(getRangeDayKeys(now, 90), now);
    expect(weekly.length).toBeGreaterThanOrEqual(13);
    expect(weekly.at(-1)).toMatchObject({ key: '2026-W48', isPartial: true });
    expect(weekly.flatMap((bucket) => bucket.dayKeys)).toHaveLength(90);
  });

  test('ranges spanning a DST change still have one key per calendar day', () => {
    const keys = getRangeDayKeys(new Date(2026, 10, 3, 12), 7);
    expect(keys).toEqual(['2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02', '2026-11-03']);
  });
});

describe('XP earned', () => {
  const xpEvents = [
    { source: 'quest', xp: 40, occurredAt: iso(11, 25) },
    { source: 'achievement', xp: 50, occurredAt: iso(11, 25) },
    { source: 'quest', xp: 80, occurredAt: iso(11, 20) },
    { source: 'dev', xp: 10, occurredAt: iso(11, 19) },
    { source: 'quest', xp: 100, occurredAt: iso(11, 15) }, // previous 7-day window
    { source: 'quest', xp: 999, occurredAt: iso(10, 1) }, // long before
  ];

  test('totals by source within the range, with the previous period for comparison', () => {
    const { xp } = buildAnalytics({ ...empty, xpEvents }, { now, rangeDays: 7 });
    expect(xp).toMatchObject({ total: 180, fromQuests: 120, fromRewards: 50, previousTotal: 100, changeRatio: 0.8 });
    expect(xp.averagePerDay).toBeCloseTo(180 / 7);
    expect(xp.series.at(-1)).toMatchObject({ key: '2026-11-25', quest: 40, reward: 50, other: 0, total: 90, isPartial: true });
  });

  test('a local-midnight boundary decides the day, not UTC', () => {
    // 23:30 local on the 18th is 04:30 UTC on the 19th — it must not count toward the 7-day range.
    const late = { source: 'quest', xp: 7, occurredAt: new Date(2026, 10, 18, 23, 30).toISOString() };
    expect(buildAnalytics({ ...empty, xpEvents: [late] }, { now, rangeDays: 7 }).xp.total).toBe(0);
  });
});

describe('completion rates', () => {
  test('daily rate only counts quests that existed and were scheduled that day', () => {
    const quests = [
      quest('a', 'daily'),
      quest('b', 'daily', { createdAt: iso(11, 23) }), // created Monday
      quest('c', 'weekdays', { weekdays: [1] }), // Mondays only
      quest('d', 'daily', { archivedAt: iso(11, 21) }), // archived Saturday
    ];
    const completions = [completion('a', 22), completion('a', 23), completion('b', 23), completion('c', 23), completion('a', 25)];
    const { completionRates } = buildAnalytics({ ...empty, quests, completions }, { now, rangeDays: 7 });
    const byDay = Object.fromEntries(completionRates.daily.map((day) => [day.key, day]));

    expect(byDay['2026-11-20']).toMatchObject({ eligible: 2, completed: 0 }); // a, d
    expect(byDay['2026-11-21']).toMatchObject({ eligible: 1 }); // d archived that day
    expect(byDay['2026-11-23']).toMatchObject({ eligible: 3, completed: 3, rate: 1 }); // a, b, c
    expect(byDay['2026-11-24']).toMatchObject({ eligible: 2, completed: 0 });
    expect(byDay['2026-11-25']).toMatchObject({ isPartial: true, completed: 1 });
    // Average over finished days only: (0+0+1+3+0) completed / (2+2+1+1+3+2) eligible.
    expect(completionRates.dailyAverage).toBeCloseTo(4 / 11);
  });

  test('weekly rate per ISO week', () => {
    const quests = [quest('w1', 'weekly'), quest('w2', 'weekly')];
    const completions = [
      completion('w1', 18, { cadence: 'weekly', periodKey: '2026-W47' }),
      completion('w2', 19, { cadence: 'weekly', periodKey: '2026-W47' }),
      completion('w1', 24, { cadence: 'weekly', periodKey: '2026-W48' }),
    ];
    const { completionRates } = buildAnalytics({ ...empty, quests, completions }, { now, rangeDays: 30 });
    const weeks = Object.fromEntries(completionRates.weekly.map((week) => [week.key, week]));
    expect(weeks['2026-W47']).toMatchObject({ eligible: 2, completed: 2, rate: 1, isPartial: false });
    expect(weeks['2026-W48']).toMatchObject({ completed: 1, isPartial: true });
    // Both weekly quests existed for the whole range, so the finished weeks without completions
    // (W44–W46) count too: 2 completed of 8 eligible across W44–W47.
    expect(completionRates.weeklyAverage).toBe(2 / 8);
  });
});

describe('category sections', () => {
  const completions = [
    completion('f', 20, { category: 'fitness' }),
    completion('f', 21, { category: 'fitness' }),
    completion('n', 21, { category: 'nutrition' }),
    completion('n', 24, { category: 'nutrition' }),
    completion('n', 25, { category: 'nutrition' }),
    completion('s', 22, { category: 'social' }),
    completion('m', 12, { category: 'family' }), // outside 7-day range
  ];
  const analytics = buildAnalytics({ ...empty, completions }, { now, rangeDays: 7 });

  test('nutrition consistency: share of days with a nutrition quest, plus current streak', () => {
    expect(analytics.nutrition).toMatchObject({ activeDays: 3, currentStreak: 2 });
    expect(analytics.nutrition.consistency).toBeCloseTo(3 / 7);
    // Range is 19–25 Nov; nutrition quests on the 21st, 24th and 25th.
    expect(analytics.nutrition.calendar.map((cell) => cell.value)).toEqual([0, 0, 1, 0, 0, 1, 1]);
  });

  test('social and family activity, including days since the last one', () => {
    expect(analytics.social).toMatchObject({ socialCompletions: 1, familyCompletions: 0, daysSinceSocial: 3, daysSinceFamily: 13 });
  });

  test('category breakdown is sorted and shares sum to 1', () => {
    expect(analytics.categories.slice(0, 3).map((row) => [row.category, row.count])).toEqual([['nutrition', 3], ['fitness', 2], ['social', 1]]);
    expect(analytics.categories.reduce((sum, row) => sum + row.share, 0)).toBeCloseTo(1);
    expect(analytics.categories).toHaveLength(8);
  });

  test('fitness completions per bucket', () => {
    expect(analytics.fitness.fitnessCompletions).toBe(2);
    expect(analytics.fitness.fitnessPerBucket.map((point) => point.value)).toEqual([0, 1, 1, 0, 0, 0, 0]);
  });
});

describe('attribute progression', () => {
  test('levels are derived from cumulative XP, including XP earned before the range', () => {
    const attributeXpEvents = [
      { attributeKey: 'strength', xp: 40, occurredAt: iso(10, 10) }, // before range: level 2 (40 XP)
      { attributeKey: 'strength', xp: 120, occurredAt: iso(11, 22) },
      { attributeKey: 'charisma', xp: 10, occurredAt: iso(11, 25) },
    ];
    const { attributes, fitness } = buildAnalytics({ ...empty, attributeXpEvents }, { now, rangeDays: 7 });
    const strength = attributes.find((attribute) => attribute.attributeKey === 'strength');
    expect(strength).toMatchObject({ xpGained: 120, startLevel: 2 });
    expect(strength.endLevel).toBeGreaterThan(2);
    expect(strength.series[0].totalXp).toBe(40);
    expect(strength.series.at(-1).totalXp).toBe(160);
    expect(fitness.strengthXpGained).toBe(120);
    expect(attributes).toHaveLength(6);
  });
});

describe('streak history', () => {
  test('runs of consecutive active days, newest first', () => {
    expect(getStreakRuns(['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-10', '2026-11-11'])).toEqual([
      { start: '2026-11-10', end: '2026-11-11', length: 2 },
      { start: '2026-11-01', end: '2026-11-03', length: 3 },
    ]);
  });

  test('current/longest streak and the activity calendar', () => {
    const completions = [20, 21, 22, 24, 25].map((day) => completion('a', day));
    const { streaks } = buildAnalytics({ ...empty, completions }, { now, rangeDays: 7 });
    expect(streaks).toMatchObject({ current: 2, longest: 3, activeDaysInRange: 5 });
    expect(streaks.calendar.map((cell) => cell.value)).toEqual([0, 1, 1, 1, 0, 1, 1]);
  });
});

test('empty data produces a complete, zeroed result (first launch)', () => {
  const analytics = buildAnalytics(empty, { now, rangeDays: 30 });
  expect(analytics.xp.total).toBe(0);
  expect(analytics.xp.changeRatio).toBeNull();
  expect(analytics.completionRates.dailyAverage).toBeNull();
  expect(analytics.streaks).toMatchObject({ current: 0, longest: 0 });
});
