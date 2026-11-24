import { computeBossCampaign } from '@/features/bosses/boss-campaign';
import { RANKS } from '@/features/progression/progression-config';

import { diffRewards, evaluateRewards } from '../reward-evaluation';

const rankIndexById = Object.fromEntries(RANKS.map((rank, index) => [rank.id, index]));
const baseFacts = {
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
  week: { weekKey: '2026-W48', completions: 0, questXp: 0, byCategory: {}, activeDays: 0, hardQuests: 0, weeklyQuests: 0 },
  bossCampaign: computeBossCampaign([]),
};
const challenge = (challengeId, metric, target) => ({
  weekKey: '2026-W48', challengeId, metric, category: null, target, xpReward: 100, itemKey: 'weekly-sigil', title: challengeId, description: '',
});
const weeklyChallenges = [challenge('quests_completed', 'quests_completed', 3), challenge('active_days', 'active_days', 2), challenge('weekly_quests', 'weekly_quests', 1)];

describe('evaluateRewards', () => {
  test('weekly challenges are earned at their target and carry XP + sigil', () => {
    const facts = { ...baseFacts, week: { ...baseFacts.week, completions: 3, activeDays: 1 } };
    const { earned, progress } = evaluateRewards(facts, { weeklyChallenges, otherWeekChallengeKeys: [] });
    expect(earned.get('challenge:2026-W48:quests_completed')).toMatchObject({ kind: 'challenge', xp: 100, itemKeys: ['weekly-sigil'] });
    expect(earned.has('challenge:2026-W48:active_days')).toBe(false);
    expect(progress.get('challenge:2026-W48:active_days')).toEqual({ current: 1, target: 2 });
  });

  test('completing all three challenges in a week earns Flawless; past weeks count toward totals', () => {
    const facts = { ...baseFacts, week: { ...baseFacts.week, completions: 3, activeDays: 2, weeklyQuests: 1 } };
    const { earned } = evaluateRewards(facts, { weeklyChallenges, otherWeekChallengeKeys: ['challenge:2026-W47:x'] });
    expect(earned.has('achievement:clean-sweep')).toBe(true);
    expect(earned.has('achievement:first-challenge')).toBe(true);
  });

  test('boss milestones earn XP; 50% gives a shard; defeat gives trophy and title', () => {
    const campaign = computeBossCampaign([{ id: 'x', completedAt: '2026-11-01T00:00:00Z', xpAwarded: 600, category: 'social' }]);
    const { earned } = evaluateRewards({ ...baseFacts, bossCampaign: campaign }, { weeklyChallenges: [], otherWeekChallengeKeys: [] });
    expect(earned.get('boss:slothwarden:50').itemKeys).toEqual(['shard-slothwarden']);
    expect(earned.get('boss:slothwarden:100')).toMatchObject({ itemKeys: ['trophy-slothwarden'], titleId: 'bossbreaker', xp: 150 });
    expect(earned.has('achievement:first-boss')).toBe(true);
  });

  test('level milestones', () => {
    const { earned } = evaluateRewards({ ...baseFacts, level: 10 }, { weeklyChallenges: [], otherWeekChallengeKeys: [] });
    expect([...earned.keys()].filter((key) => key.startsWith('level:'))).toEqual(['level:5', 'level:10']);
  });
});

describe('diffRewards', () => {
  const earned = new Map([['achievement:a', { sourceKey: 'achievement:a' }]]);

  test('grants new and revokes no-longer-earned rewards', () => {
    const active = [{ sourceKey: 'achievement:b' }];
    const { toGrant, toRevoke } = diffRewards(earned, active, '2026-W48');
    expect(toGrant.map((reward) => reward.sourceKey)).toEqual(['achievement:a']);
    expect(toRevoke.map((unlock) => unlock.sourceKey)).toEqual(['achievement:b']);
  });

  test('never revokes settled challenges from other weeks', () => {
    const active = [{ sourceKey: 'achievement:a' }, { sourceKey: 'challenge:2026-W47:x' }, { sourceKey: 'challenge:2026-W48:y' }];
    const { toGrant, toRevoke } = diffRewards(earned, active, '2026-W48');
    expect(toGrant).toEqual([]);
    expect(toRevoke.map((unlock) => unlock.sourceKey)).toEqual(['challenge:2026-W48:y']);
  });
});
