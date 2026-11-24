import { RANKS } from '../progression-config';
import { ProgressionError } from '../progression-errors';
import { getNextRank, getRankForLevel, validateRankTable } from '../ranks';

describe('ranks', () => {
  test.each([
    [1, 'E'],
    [9, 'E'],
    [10, 'D'],
    [20, 'C'],
    [35, 'B'],
    [50, 'A'],
    [74, 'A'],
    [75, 'S'],
    [100, 'SS'],
    [150, 'SSS'],
    [200, 'EX'],
    [300, 'EX'],
  ])('level %i is rank %s', (level, rank) => {
    expect(getRankForLevel(level, RANKS).id).toBe(rank);
  });

  test('next rank, and null at the top', () => {
    expect(getNextRank(1, RANKS)).toMatchObject({ id: 'D', minimumLevel: 10 });
    expect(getNextRank(149, RANKS)).toMatchObject({ id: 'SSS' });
    expect(getNextRank(250, RANKS)).toBeNull();
  });

  test('default table is valid', () => {
    expect(() => validateRankTable(RANKS)).not.toThrow();
  });

  test.each([
    [[]],
    [[{ id: 'E', minimumLevel: 2 }]],
    [[{ id: 'E', minimumLevel: 1 }, { id: 'D', minimumLevel: 1 }]],
    [[{ id: 'E', minimumLevel: 1 }, { id: 'E', minimumLevel: 5 }]],
  ])('rejects invalid table %#', (table) => {
    expect(() => validateRankTable(table)).toThrow(ProgressionError);
  });
});
