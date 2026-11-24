import { MAX_XP_PER_TRANSACTION } from '../progression-config';
import { createXpReward } from '../xp-reward';

describe('createXpReward', () => {
  test('normalizes a reward with exact attribute XP', () => {
    expect(
      createXpReward({ id: ' quest:1 ', source: 'quest', xp: 50, attributeXp: { strength: 30, agility: 0 } }),
    ).toEqual({ id: 'quest:1', source: 'quest', xp: 50, attributeXp: { strength: 30 } });
  });

  test('allocates attribute XP from weights', () => {
    expect(createXpReward({ id: 'q', source: 'quest', xp: 30, attributeWeights: { strength: 2, vitality: 1 } }).attributeXp)
      .toEqual({ strength: 20, vitality: 10 });
  });

  test('allows attribute-only rewards', () => {
    expect(createXpReward({ id: 'q', source: 'quest', attributeXp: { charisma: 5 } })).toMatchObject({ xp: 0 });
  });

  test('returns a frozen object', () => {
    const reward = createXpReward({ id: 'q', source: 'quest', xp: 1 });
    expect(Object.isFrozen(reward)).toBe(true);
    expect(Object.isFrozen(reward.attributeXp)).toBe(true);
  });

  test.each([
    ['missing id', { source: 'quest', xp: 1 }, 'INVALID_TRANSACTION_ID'],
    ['blank id', { id: '  ', source: 'quest', xp: 1 }, 'INVALID_TRANSACTION_ID'],
    ['missing source', { id: 'q', xp: 1 }, 'INVALID_SOURCE'],
    ['negative xp', { id: 'q', source: 'quest', xp: -1 }, 'INVALID_XP'],
    ['fractional xp', { id: 'q', source: 'quest', xp: 1.5 }, 'INVALID_XP'],
    ['too much xp', { id: 'q', source: 'quest', xp: MAX_XP_PER_TRANSACTION + 1 }, 'INVALID_XP'],
    ['unknown attribute', { id: 'q', source: 'quest', xp: 1, attributeXp: { luck: 1 } }, 'UNKNOWN_ATTRIBUTE'],
    ['empty reward', { id: 'q', source: 'quest', xp: 0 }, 'EMPTY_REWARD'],
    [
      'both allocation styles',
      { id: 'q', source: 'quest', xp: 1, attributeXp: { strength: 1 }, attributeWeights: { strength: 1 } },
      'CONFLICTING_ALLOCATION',
    ],
  ])('rejects %s', (_label, input, code) => {
    expect(() => createXpReward(input)).toThrow(expect.objectContaining({ code }));
  });
});
