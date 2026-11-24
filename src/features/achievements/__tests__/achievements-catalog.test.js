import { BOSSES } from '@/features/bosses/bosses-catalog';
import { computeBossCampaign } from '@/features/bosses/boss-campaign';
import { RANKS } from '@/features/progression/progression-config';
import { ITEMS_BY_KEY } from '@/features/rewards/items-catalog';
import { evaluateRewards } from '@/features/rewards/reward-evaluation';
import { TITLES_BY_ID } from '@/features/rewards/titles-catalog';

import { ACHIEVEMENT_GROUPS, ACHIEVEMENTS } from '../achievements-catalog';

const rankIndexById = Object.fromEntries(RANKS.map((rank, index) => [rank.id, index]));

function factsWith(overrides) {
  return {
    totalCompletions: 0,
    byCategory: {},
    byDifficulty: {},
    longestStreak: 0,
    level: 1,
    rank: 'E',
    rankIndex: 0,
    rankIndexById,
    attributeLevels: { strength: 1, agility: 1, vitality: 1, intelligence: 1, discipline: 1, charisma: 1 },
    customQuestsCreated: 0,
    hasNightCompletion: false,
    hasDawnCompletion: false,
    week: { weekKey: '2026-W48', completions: 0, questXp: 0, byCategory: {}, activeDays: 0, hardQuests: 0, weeklyQuests: 0 },
    bossCampaign: computeBossCampaign([]),
    ...overrides,
  };
}

const maxedFacts = factsWith({
  totalCompletions: 10_000,
  byCategory: Object.fromEntries(['fitness', 'nutrition', 'family', 'social', 'career', 'gaming', 'livestreaming', 'recovery'].map((key) => [key, 1000])),
  byDifficulty: { elite: 1000 },
  longestStreak: 365,
  level: 300,
  rank: 'EX',
  rankIndex: rankIndexById.EX,
  attributeLevels: { strength: 50, agility: 50, vitality: 50, intelligence: 50, discipline: 50, charisma: 50 },
  customQuestsCreated: 5,
  hasNightCompletion: true,
  hasDawnCompletion: true,
  bossCampaign: computeBossCampaign([{ id: 'x', completedAt: '2026-01-01T00:00:00Z', xpAwarded: 1_000_000, category: 'social' }]),
});

const earnedAchievements = (facts, otherWeekChallengeKeys = []) =>
  [...evaluateRewards(facts, { weeklyChallenges: [], otherWeekChallengeKeys }).earned.values()]
    .filter((reward) => reward.kind === 'achievement')
    .map((reward) => reward.refId);

describe('achievement catalog', () => {
  test('ids are unique and every group is known', () => {
    const ids = ACHIEVEMENTS.map((achievement) => achievement.id);
    expect(new Set(ids).size).toBe(ids.length);
    const groups = new Set(ACHIEVEMENT_GROUPS.map((group) => group.key));
    for (const achievement of ACHIEVEMENTS) expect(groups.has(achievement.group)).toBe(true);
  });

  test('every referenced title and item exists', () => {
    for (const achievement of ACHIEVEMENTS) {
      if (achievement.titleId) expect(TITLES_BY_ID[achievement.titleId]).toBeDefined();
      if (achievement.itemKey) expect(ITEMS_BY_KEY[achievement.itemKey]).toBeDefined();
    }
    for (const boss of BOSSES) {
      expect(ITEMS_BY_KEY[`trophy-${boss.id}`]).toBeDefined();
      expect(ITEMS_BY_KEY[`shard-${boss.id}`]).toBeDefined();
      if (boss.titleId) expect(TITLES_BY_ID[boss.titleId]).toBeDefined();
    }
  });

  test('nothing unlocks without activity', () => {
    expect(earnedAchievements(factsWith({}))).toEqual([]);
  });

  test('every achievement is reachable through activity', () => {
    const challengeHistory = Array.from({ length: 12 }, (_, index) => `challenge:2026-W${10 + Math.floor(index / 3)}:c${index % 3}`);
    expect(earnedAchievements(maxedFacts, challengeHistory).sort()).toEqual(ACHIEVEMENTS.map((achievement) => achievement.id).sort());
  });

  test.each([
    ['first-steps', { totalCompletions: 1 }],
    ['streak-7', { longestStreak: 7 }],
    ['level-10', { level: 10 }],
    ['rank-c', { rank: 'C', rankIndex: rankIndexById.C }],
    ['mastery-gaming', { byCategory: { gaming: 25 } }],
    ['balanced-soul', { attributeLevels: { strength: 5, agility: 5, vitality: 5, intelligence: 5, discipline: 5, charisma: 5 } }],
    ['architect', { customQuestsCreated: 1 }],
    ['night-owl', { hasNightCompletion: true }],
  ])('%s unlocks exactly at its threshold', (achievementId, overrides) => {
    expect(earnedAchievements(factsWith(overrides))).toContain(achievementId);
  });

  test('just below a threshold does not unlock', () => {
    expect(earnedAchievements(factsWith({ totalCompletions: 9 }))).not.toContain('quests-10');
    expect(earnedAchievements(factsWith({ longestStreak: 6 }))).not.toContain('streak-7');
    expect(earnedAchievements(factsWith({ byCategory: { gaming: 24 } }))).not.toContain('mastery-gaming');
  });
});
