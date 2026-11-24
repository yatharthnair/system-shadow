import { buildNoticesFromEvents } from '@/features/progression/progression-notices';

import { buildRewardNotices } from '../reward-notices';

describe('buildNoticesFromEvents (merging)', () => {
  test('several level-ups from one action merge into one notice', () => {
    const notices = buildNoticesFromEvents([
      { type: 'player-level-up', fromLevel: 4, toLevel: 5, levelsGained: 1 },
      { type: 'player-level-up', fromLevel: 5, toLevel: 7, levelsGained: 2 },
      { type: 'rank-up', fromRank: 'E', toRank: 'E' },
    ]);
    expect(notices).toEqual([{ kind: 'level-up', fromLevel: 4, toLevel: 7, levelsGained: 3, rankUp: null }]);
  });

  test('level-downs produce no notice', () => {
    expect(buildNoticesFromEvents([{ type: 'player-level-down', fromLevel: 3, toLevel: 2, levelsLost: 1 }])).toEqual([]);
  });
});

describe('buildRewardNotices', () => {
  const reward = (overrides) => ({ sourceKey: overrides.kind, xp: 50, itemKeys: [], titleId: null, title: 'T', description: 'D', ...overrides });

  test('boss defeat and achievements are cinematics; others are one grouped banner', () => {
    const notices = buildRewardNotices([
      { type: 'reward-unlocked', reward: reward({ kind: 'achievement', refId: 'first-steps', tier: 'bronze', titleId: 'awakened' }) },
      { type: 'reward-unlocked', reward: reward({ kind: 'achievement', refId: 'architect', tier: 'bronze' }) },
      { type: 'reward-unlocked', reward: reward({ kind: 'boss_milestone', refId: 'slothwarden', milestone: 100, itemKeys: ['trophy-slothwarden'] }) },
      { type: 'reward-unlocked', reward: reward({ sourceKey: 'boss:slothwarden:75', kind: 'boss_milestone', milestone: 75 }) },
      { type: 'reward-unlocked', reward: reward({ sourceKey: 'challenge:x', kind: 'challenge' }) },
    ]);
    expect(notices.map((notice) => notice.kind)).toEqual(['boss-defeated', 'achievement-unlocked', 'reward-banner']);
    expect(notices[0].loot.items[0].key).toBe('trophy-slothwarden');
    expect(notices[1].achievements).toHaveLength(2);
    expect(notices[1].achievements[0].loot.title.label).toBe('The Awakened');
    expect(notices[2].lines).toHaveLength(2);
  });

  test('revocations become a muted banner', () => {
    const notices = buildRewardNotices([{ type: 'reward-revoked', reward: { sourceKey: 'achievement:a', title: 'First Steps', xpReward: 50 } }]);
    expect(notices).toEqual([
      { kind: 'reward-banner', tone: 'muted', heading: 'System · Rewards revoked', lines: [{ key: 'achievement:a', title: 'First Steps', xp: -50 }] },
    ]);
  });
});
