import { buildNoticesFromEvents } from '../progression-notices';

describe('buildNoticesFromEvents', () => {
  test('no events → no notices', () => {
    expect(buildNoticesFromEvents([])).toEqual([]);
  });

  test('merges a rank-up into the level-up notice and groups attribute level-ups', () => {
    const notices = buildNoticesFromEvents([
      { type: 'player-level-up', fromLevel: 9, toLevel: 11, levelsGained: 2 },
      { type: 'rank-up', fromRank: 'E', toRank: 'D' },
      { type: 'attribute-level-up', attributeKey: 'strength', fromLevel: 1, toLevel: 2, levelsGained: 1 },
      { type: 'attribute-level-up', attributeKey: 'charisma', fromLevel: 4, toLevel: 6, levelsGained: 2 },
    ]);

    expect(notices).toEqual([
      { kind: 'level-up', fromLevel: 9, toLevel: 11, levelsGained: 2, rankUp: { fromRank: 'E', toRank: 'D' } },
      {
        kind: 'attribute-growth',
        attributes: [
          { key: 'strength', shortLabel: 'STR', label: 'Strength', fromLevel: 1, toLevel: 2 },
          { key: 'charisma', shortLabel: 'CHA', label: 'Charisma', fromLevel: 4, toLevel: 6 },
        ],
      },
    ]);
  });
});
