import { allocateXpByWeights, ATTRIBUTE_KEYS } from '../attributes';
import { ProgressionError } from '../progression-errors';

describe('attributes', () => {
  test('there are six attributes', () => {
    expect(ATTRIBUTE_KEYS).toEqual(['strength', 'agility', 'vitality', 'intelligence', 'discipline', 'charisma']);
  });
});

describe('allocateXpByWeights', () => {
  test('splits proportionally', () => {
    expect(allocateXpByWeights(30, { strength: 2, vitality: 1 })).toEqual({ strength: 20, vitality: 10 });
  });

  test('always sums exactly to the total (largest remainder)', () => {
    expect(allocateXpByWeights(10, { strength: 2, vitality: 1 })).toEqual({ strength: 7, vitality: 3 });

    const evenSplit = allocateXpByWeights(100, { strength: 1, agility: 1, vitality: 1 });
    expect(Object.values(evenSplit).reduce((a, b) => a + b, 0)).toBe(100);
  });

  test('breaks ties deterministically in attribute order', () => {
    // 100 / 3 = 33.33 each; the one leftover point goes to the first-listed attribute.
    expect(allocateXpByWeights(100, { vitality: 1, agility: 1, strength: 1 })).toEqual({
      strength: 34,
      agility: 33,
      vitality: 33,
    });
  });

  test('omits zero-weight and zero-XP attributes', () => {
    expect(allocateXpByWeights(1, { strength: 1, agility: 1, charisma: 0 })).toEqual({ strength: 1 });
    expect(allocateXpByWeights(0, { strength: 1 })).toEqual({});
  });

  test.each([
    [10, { unknown: 1 }],
    [10, { strength: -1 }],
    [10, { strength: 0 }],
    [10, {}],
    [-5, { strength: 1 }],
    [2.5, { strength: 1 }],
  ])('rejects invalid input %#', (xp, weights) => {
    expect(() => allocateXpByWeights(xp, weights)).toThrow(ProgressionError);
  });
});
