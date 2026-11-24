import {
  applyXpReward,
  buildProgressionSnapshot,
  createInitialProgressionState,
  createProgressionRules,
  replayXpRewards,
  reverseXpReward,
} from '../progression-engine';
import { createXpReward } from '../xp-reward';

// Small, readable rules: player levels need 100, 200, 300 … XP; attributes need 10, 20, 30 …
const rules = createProgressionRules({
  playerCurve: { maxLevel: 50, formula: { base: 100, exponent: 1 } },
  attributeCurve: { maxLevel: 20, formula: { base: 10, exponent: 1 } },
  ranks: [
    { id: 'E', minimumLevel: 1 },
    { id: 'D', minimumLevel: 3 },
    { id: 'C', minimumLevel: 5 },
    { id: 'B', minimumLevel: 8 },
  ],
});

let rewardCounter = 0;
const reward = (fields) => createXpReward({ id: `test:${(rewardCounter += 1)}`, source: 'test', ...fields });
const apply = (state, fields) => applyXpReward(state, reward(fields), rules);

describe('applyXpReward — player XP and levels', () => {
  test('adds XP without leveling below the threshold', () => {
    const { state, events } = apply(createInitialProgressionState(), { xp: 99 });
    expect(state.totalXp).toBe(99);
    expect(events).toEqual([]);
    expect(buildProgressionSnapshot(state, rules)).toMatchObject({ level: 1, xpIntoLevel: 99 });
  });

  test('levels up exactly on the threshold', () => {
    const { state, events } = apply(createInitialProgressionState(), { xp: 100 });
    expect(events).toEqual([{ type: 'player-level-up', fromLevel: 1, toLevel: 2, levelsGained: 1 }]);
    expect(buildProgressionSnapshot(state, rules)).toMatchObject({ level: 2, xpIntoLevel: 0 });
  });

  test('carries surplus XP into the new level', () => {
    const { state } = apply({ ...createInitialProgressionState(), totalXp: 90 }, { xp: 25 });
    expect(buildProgressionSnapshot(state, rules)).toMatchObject({ level: 2, xpIntoLevel: 15 });
  });

  test('a large reward grants multiple levels in one event', () => {
    // Thresholds: L2 100, L3 300, L4 600, L5 1000, L6 1500.
    const { state, events } = apply(createInitialProgressionState(), { xp: 1234 });
    expect(events[0]).toEqual({ type: 'player-level-up', fromLevel: 1, toLevel: 5, levelsGained: 4 });
    expect(buildProgressionSnapshot(state, rules)).toMatchObject({ level: 5, xpIntoLevel: 234, xpForNextLevel: 500 });
  });

  test('reports a rank-up, skipping intermediate ranks in one jump', () => {
    const { events } = apply(createInitialProgressionState(), { xp: 1000 }); // L1 → L5: E → C
    expect(events).toContainEqual({ type: 'rank-up', fromRank: 'E', toRank: 'C' });
  });

  test('no rank-up event when the level changes within a rank', () => {
    const { events } = apply({ ...createInitialProgressionState(), totalXp: 300 }, { xp: 300 }); // L3 → L4, both D
    expect(events.map((event) => event.type)).toEqual(['player-level-up']);
  });

  test('does not mutate the input state', () => {
    const initial = createInitialProgressionState();
    const snapshotBefore = JSON.stringify(initial);
    apply(initial, { xp: 500, attributeXp: { strength: 50 } });
    expect(JSON.stringify(initial)).toBe(snapshotBefore);
  });
});

describe('applyXpReward — attributes', () => {
  test('updates only the attributes in the reward', () => {
    const { state } = apply(createInitialProgressionState(), { xp: 10, attributeXp: { strength: 5, charisma: 3 } });
    expect(state.attributeXp).toEqual({
      strength: 5,
      agility: 0,
      vitality: 0,
      intelligence: 0,
      discipline: 0,
      charisma: 3,
    });
  });

  test('attribute XP is independent of player XP', () => {
    const { state, events } = apply(createInitialProgressionState(), { attributeXp: { agility: 30 } });
    expect(state.totalXp).toBe(0);
    expect(events).toEqual([{ type: 'attribute-level-up', attributeKey: 'agility', fromLevel: 1, toLevel: 3, levelsGained: 2 }]);
  });

  test('each attribute levels independently and reports its own event', () => {
    const { state, events } = apply(createInitialProgressionState(), {
      xp: 0,
      attributeXp: { strength: 10, intelligence: 9 },
    });
    expect(events).toEqual([{ type: 'attribute-level-up', attributeKey: 'strength', fromLevel: 1, toLevel: 2, levelsGained: 1 }]);

    const snapshot = buildProgressionSnapshot(state, rules);
    expect(snapshot.attributes.strength).toMatchObject({ level: 2, xpIntoLevel: 0 });
    expect(snapshot.attributes.intelligence).toMatchObject({ level: 1, xpIntoLevel: 9 });
    expect(snapshot.attributes.vitality).toMatchObject({ level: 1, xpIntoLevel: 0 });
  });

  test('weighted allocation flows through to attribute totals', () => {
    const { state } = apply(createInitialProgressionState(), { xp: 30, attributeWeights: { strength: 2, vitality: 1 } });
    expect(state.totalXp).toBe(30);
    expect(state.attributeXp).toMatchObject({ strength: 20, vitality: 10 });
  });
});

describe('snapshot and replay', () => {
  test('snapshot includes rank and next rank', () => {
    const { state } = apply(createInitialProgressionState(), { xp: 300 }); // L3, rank D
    expect(buildProgressionSnapshot(state, rules)).toMatchObject({
      level: 3,
      rank: 'D',
      nextRank: { id: 'C', minimumLevel: 5, levelsRemaining: 2 },
    });
  });

  test('replaying rewards reproduces sequential application exactly', () => {
    const rewards = [
      reward({ xp: 120, attributeXp: { strength: 15 } }),
      reward({ xp: 800, attributeWeights: { agility: 1, discipline: 3 } }),
      reward({ attributeXp: { charisma: 7 } }),
    ];
    let sequential = createInitialProgressionState();
    for (const item of rewards) sequential = applyXpReward(sequential, item, rules).state;

    expect(replayXpRewards(rewards, rules)).toEqual(sequential);
  });

  test('outcome does not depend on how XP is split across rewards', () => {
    const oneBigReward = apply(createInitialProgressionState(), { xp: 1500 }).state;
    let manySmall = createInitialProgressionState();
    for (let index = 0; index < 15; index += 1) manySmall = apply(manySmall, { xp: 100 }).state;
    expect(buildProgressionSnapshot(manySmall, rules)).toEqual(buildProgressionSnapshot(oneBigReward, rules));
  });
});

describe('reverseXpReward', () => {
  test('exactly restores the state before the reward', () => {
    const before = apply(createInitialProgressionState(), { xp: 250, attributeXp: { strength: 15 } }).state;
    const award = reward({ xp: 1234, attributeXp: { strength: 40, charisma: 12 } });
    const after = applyXpReward(before, award, rules).state;

    expect(reverseXpReward(after, award, rules).state).toEqual(before);
  });

  test('reports level, rank and attribute level-downs', () => {
    const award = reward({ xp: 1000, attributeXp: { agility: 30 } }); // L1 → L5 (E → C), AGI L1 → L3
    const after = applyXpReward(createInitialProgressionState(), award, rules).state;

    expect(reverseXpReward(after, award, rules).events).toEqual([
      { type: 'player-level-down', fromLevel: 5, toLevel: 1, levelsLost: 4 },
      { type: 'rank-down', fromRank: 'C', toRank: 'E' },
      { type: 'attribute-level-down', attributeKey: 'agility', fromLevel: 3, toLevel: 1, levelsLost: 2 },
    ]);
  });

  test('refuses to reverse more XP than exists', () => {
    const award = reward({ xp: 100 });
    expect(() => reverseXpReward(createInitialProgressionState(), award, rules)).toThrow(
      expect.objectContaining({ code: 'REVERSAL_EXCEEDS_TOTAL' }),
    );
    const attributeAward = reward({ attributeXp: { vitality: 5 } });
    expect(() => reverseXpReward(createInitialProgressionState(), attributeAward, rules)).toThrow(
      expect.objectContaining({ code: 'REVERSAL_EXCEEDS_TOTAL' }),
    );
  });
});
