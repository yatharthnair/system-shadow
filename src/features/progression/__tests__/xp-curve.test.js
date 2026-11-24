import { PLAYER_LEVEL_CURVE } from '../progression-config';
import { ProgressionError } from '../progression-errors';
import { createXpCurve } from '../xp-curve';

const simpleCurve = createXpCurve({ maxLevel: 5, formula: { base: 100, exponent: 1 } });
// Requirements: L1→2: 100, L2→3: 200, L3→4: 300, L4→5: 400. Thresholds: 0, 100, 300, 600, 1000.

describe('createXpCurve', () => {
  test('computes per-level requirements from the formula', () => {
    expect([1, 2, 3, 4].map(simpleCurve.getXpRequiredForLevel)).toEqual([100, 200, 300, 400]);
  });

  test('default player curve matches round(100 × level^1.5)', () => {
    const curve = createXpCurve(PLAYER_LEVEL_CURVE);
    expect(curve.getXpRequiredForLevel(1)).toBe(100);
    expect(curve.getXpRequiredForLevel(2)).toBe(283);
    expect(curve.getXpRequiredForLevel(10)).toBe(3162);
  });

  test('per-level overrides replace the formula for those levels only', () => {
    const curve = createXpCurve({ maxLevel: 5, formula: { base: 100, exponent: 1 }, overrides: { 2: 50 } });
    expect([1, 2, 3].map(curve.getXpRequiredForLevel)).toEqual([100, 50, 300]);
    expect(curve.getTotalXpForLevel(4)).toBe(450);
  });

  test('cumulative thresholds', () => {
    expect([1, 2, 3, 4, 5].map(simpleCurve.getTotalXpForLevel)).toEqual([0, 100, 300, 600, 1000]);
  });

  test.each([
    [0, 1, 0],
    [99, 1, 99],
    [100, 2, 0], // exactly on a threshold → the new level, 0 XP into it
    [101, 2, 1],
    [599, 3, 299],
    [600, 4, 0],
  ])('getLevelState(%i) → level %i with %i XP into level', (totalXp, level, xpIntoLevel) => {
    expect(simpleCurve.getLevelState(totalXp)).toMatchObject({ level, xpIntoLevel });
  });

  test('reports progress and XP remaining', () => {
    expect(simpleCurve.getLevelState(150)).toMatchObject({
      level: 2,
      xpIntoLevel: 50,
      xpForNextLevel: 200,
      xpToNextLevel: 150,
      progress: 0.25,
      isMaxLevel: false,
    });
  });

  test('caps at maxLevel and keeps counting XP past the cap', () => {
    expect(simpleCurve.getLevelState(1000)).toMatchObject({ level: 5, isMaxLevel: true, xpForNextLevel: null, progress: 1 });
    expect(simpleCurve.getLevelState(5000)).toMatchObject({ level: 5, xpIntoLevel: 4000, totalXp: 5000 });
  });

  test.each([-1, 1.5, NaN, '100', null])('rejects invalid total XP %p', (totalXp) => {
    expect(() => simpleCurve.getLevelState(totalXp)).toThrow(ProgressionError);
  });

  test.each([
    [{ maxLevel: 1, formula: { base: 100, exponent: 1 } }],
    [{ maxLevel: 10, formula: { base: 0, exponent: 1 } }],
    [{ maxLevel: 10, formula: { base: 100, exponent: 1 }, overrides: { 10: 50 } }],
    [{ maxLevel: 10, formula: { base: 100, exponent: 1 }, overrides: { 3: -5 } }],
  ])('rejects invalid config %#', (config) => {
    expect(() => createXpCurve(config)).toThrow(ProgressionError);
  });
});
