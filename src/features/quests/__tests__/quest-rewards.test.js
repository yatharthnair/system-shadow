import { QUEST_CATEGORIES } from '../quest-config';
import { buildQuestRewardInput, calculateQuestXp, getDefaultAttributeWeights, previewQuestReward } from '../quest-rewards';

describe('calculateQuestXp', () => {
  test.each([
    ['easy', 'daily', 20],
    ['normal', 'daily', 40],
    ['hard', 'daily', 80],
    ['elite', 'daily', 150],
    ['normal', 'weekly', 120],
    ['elite', 'weekly', 450],
    ['hard', 'weekdays', 80],
    ['hard', 'once', 160],
  ])('%s %s quest → %i XP', (difficulty, cadence, xp) => {
    expect(calculateQuestXp({ difficulty, cadence })).toBe(xp);
  });
});

describe('attribute rewards', () => {
  test('all eight categories have default attribute weights', () => {
    expect(QUEST_CATEGORIES.map((category) => category.key)).toEqual([
      'fitness', 'nutrition', 'family', 'social', 'career', 'gaming', 'livestreaming', 'recovery',
    ]);
    for (const { key } of QUEST_CATEGORIES) {
      expect(Object.keys(getDefaultAttributeWeights(key)).length).toBeGreaterThan(0);
    }
  });

  test('preview splits player XP across the quest’s attributes by weight', () => {
    expect(
      previewQuestReward({ difficulty: 'hard', cadence: 'weekly', attributeWeights: { strength: 2, agility: 1 } }),
    ).toEqual({ xp: 240, attributeXp: { strength: 160, agility: 80 } });
  });

  test('reward input uses a per-completion transaction id', () => {
    expect(
      buildQuestRewardInput({ difficulty: 'easy', cadence: 'daily', attributeWeights: { charisma: 1 } }, 'q1:2026-11-25:1'),
    ).toEqual({ id: 'quest:q1:2026-11-25:1', source: 'quest', xp: 20, attributeWeights: { charisma: 1 } });
  });
});
