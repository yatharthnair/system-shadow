import { buildProgressionSnapshot, createInitialProgressionState } from '@/features/progression/progression-engine';

import { buildActivityFacts, getCurrentStreak, getLongestStreak } from '../activity-facts';

const progression = buildProgressionSnapshot(createInitialProgressionState());
const completion = (date, overrides = {}) => ({
  id: date.toISOString(),
  completedAt: date.toISOString(),
  xpAwarded: 40,
  category: 'fitness',
  difficulty: 'normal',
  cadence: 'daily',
  ...overrides,
});

describe('streaks', () => {
  test('longest run of consecutive days', () => {
    expect(getLongestStreak([])).toBe(0);
    expect(getLongestStreak(['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-05', '2026-11-06'])).toBe(3);
  });

  test('streaks continue across DST (25-hour day on 1 Nov 2026) and month ends', () => {
    expect(getLongestStreak(['2026-10-31', '2026-11-01', '2026-11-02'])).toBe(3);
    expect(getLongestStreak(['2026-03-07', '2026-03-08', '2026-03-09'])).toBe(3);
  });

  test('current streak counts back from today, or from yesterday if nothing yet today', () => {
    const days = ['2026-11-22', '2026-11-23', '2026-11-24'];
    expect(getCurrentStreak(days, new Date(2026, 10, 24, 20))).toBe(3);
    expect(getCurrentStreak(days, new Date(2026, 10, 25, 9))).toBe(3);
    expect(getCurrentStreak(days, new Date(2026, 10, 26, 9))).toBe(0);
  });
});

describe('buildActivityFacts', () => {
  const now = new Date(2026, 10, 25, 12); // Wed, week 2026-W48 (Mon 23 Nov)
  const facts = buildActivityFacts({
    completions: [
      completion(new Date(2026, 10, 20, 2, 30), { category: 'career' }), // previous week, 02:30
      completion(new Date(2026, 10, 23, 6, 0), { difficulty: 'hard', cadence: 'weekly', xpAwarded: 240 }), // Mon 06:00
      completion(new Date(2026, 10, 24, 18)),
      completion(new Date(2026, 10, 24, 19), { category: 'social', difficulty: 'elite' }),
    ],
    customQuestsCreated: 2,
    progression,
    now,
  });

  test('lifetime counts', () => {
    expect(facts).toMatchObject({
      totalCompletions: 4,
      questXpTotal: 360,
      byCategory: { career: 1, fitness: 2, social: 1 },
      byDifficulty: { normal: 2, hard: 1, elite: 1 },
      byCadence: { daily: 3, weekly: 1 },
      activeDayCount: 3,
      customQuestsCreated: 2,
    });
  });

  test('this week only counts completions since Monday 00:00', () => {
    expect(facts.week).toEqual({
      weekKey: '2026-W48',
      completions: 3,
      questXp: 320,
      byCategory: { fitness: 2, social: 1 },
      activeDays: 2,
      hardQuests: 2,
      weeklyQuests: 1,
    });
  });

  test('time-of-day achievements use local completion time', () => {
    expect(facts.hasNightCompletion).toBe(true); // 02:30
    expect(facts.hasDawnCompletion).toBe(true); // 06:00
  });
});
