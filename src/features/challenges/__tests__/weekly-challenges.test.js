import { CHALLENGE_METRICS, generateWeeklyChallenges, getChallengeProgress, hashString } from '../weekly-challenges';

describe('generateWeeklyChallenges', () => {
  test('creates three challenges, one per slot', () => {
    const challenges = generateWeeklyChallenges('2026-W48', ['fitness', 'career']);
    expect(challenges.map((challenge) => challenge.slot)).toEqual([0, 1, 2]);
    for (const challenge of challenges) {
      expect(CHALLENGE_METRICS[challenge.metric]).toBeDefined();
      expect(challenge.target).toBeGreaterThan(0);
      expect(challenge.xpReward).toBeGreaterThan(0);
    }
  });

  test('is deterministic for a week', () => {
    expect(generateWeeklyChallenges('2026-W48', ['fitness'])).toEqual(generateWeeklyChallenges('2026-W48', ['fitness']));
  });

  test('varies across weeks', () => {
    const weeks = Array.from({ length: 12 }, (_, index) => `2026-W${String(index + 1).padStart(2, '0')}`);
    const combos = new Set(weeks.map((week) => generateWeeklyChallenges(week, []).map((c) => c.challengeId).join('|')));
    expect(combos.size).toBeGreaterThan(3);
  });

  test('focus challenge only targets categories the player has quests in', () => {
    for (let week = 1; week <= 20; week += 1) {
      const focus = generateWeeklyChallenges(`2026-W${week}`, ['nutrition', 'gaming'])[1];
      expect(['nutrition', 'gaming']).toContain(focus.category);
    }
  });

  test('stable hash', () => {
    expect(hashString('2026-W48')).toBe(hashString('2026-W48'));
    expect(hashString('2026-W48')).not.toBe(hashString('2026-W49'));
  });
});

describe('getChallengeProgress', () => {
  const week = { completions: 7, questXp: 420, byCategory: { fitness: 3 }, activeDays: 4, hardQuests: 1, weeklyQuests: 2 };
  test.each([
    [{ metric: 'quests_completed', target: 15 }, 7],
    [{ metric: 'quest_xp', target: 800 }, 420],
    [{ metric: 'category_completed', category: 'fitness', target: 5 }, 3],
    [{ metric: 'category_completed', category: 'social', target: 5 }, 0],
    [{ metric: 'active_days', target: 5 }, 4],
    [{ metric: 'hard_quests', target: 3 }, 1],
    [{ metric: 'weekly_quests', target: 2 }, 2],
  ])('%o → %i', (challenge, current) => {
    expect(getChallengeProgress(challenge, week)).toEqual({ current, target: challenge.target });
  });
});
