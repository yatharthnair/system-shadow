import { computeBossCampaign, getDamageForCompletion } from '../boss-campaign';

const bosses = [
  { id: 'a', name: 'A', hp: 100, weakness: 'fitness' },
  { id: 'b', name: 'B', hp: 200, weakness: null },
  { id: 'c', name: 'C', hp: 300, weakness: 'career' },
];
let counter = 0;
const hit = (xpAwarded, category = 'social') => ({
  id: `c${(counter += 1)}`,
  completedAt: new Date(2026, 10, 1, 0, counter).toISOString(),
  xpAwarded,
  category,
});

describe('getDamageForCompletion', () => {
  test('weakness category deals 1.5× damage', () => {
    expect(getDamageForCompletion(bosses[0], hit(40, 'fitness'))).toBe(60);
    expect(getDamageForCompletion(bosses[0], hit(40, 'career'))).toBe(40);
    expect(getDamageForCompletion(bosses[1], hit(40, 'fitness'))).toBe(40);
  });
});

describe('computeBossCampaign', () => {
  test('starts with the first boss active and the rest locked', () => {
    const campaign = computeBossCampaign([], bosses);
    expect(campaign.bosses.map((boss) => boss.status)).toEqual(['active', 'locked', 'locked']);
    expect(campaign.activeBossId).toBe('a');
  });

  test('damage accumulates and milestones are reached at 25/50/75/100%', () => {
    const campaign = computeBossCampaign([hit(30), hit(25)], bosses);
    expect(campaign.bosses[0]).toMatchObject({ damage: 55, hpRemaining: 45, milestonesReached: [25, 50], status: 'active' });
  });

  test('defeating a boss activates the next and records when', () => {
    const killingBlow = hit(100);
    const campaign = computeBossCampaign([killingBlow], bosses);
    expect(campaign.bosses[0]).toMatchObject({ status: 'defeated', defeatedAt: killingBlow.completedAt, milestonesReached: [25, 50, 75, 100] });
    expect(campaign.activeBossId).toBe('b');
    expect(campaign.defeatedCount).toBe(1);
  });

  test('overflow damage carries to the next boss, re-scaled by weakness', () => {
    // 80 fitness XP vs A (weak to fitness) = 120 damage: 100 kills A, 20 damage left = 13.33 base XP → 13 vs B.
    const campaign = computeBossCampaign([hit(80, 'fitness')], bosses);
    expect(campaign.bosses[0].status).toBe('defeated');
    expect(campaign.bosses[1].damage).toBe(13);
  });

  test('one huge hit can clear several bosses', () => {
    const campaign = computeBossCampaign([hit(1000)], bosses);
    expect(campaign.isComplete).toBe(true);
    expect(campaign.activeBossId).toBeNull();
    expect(campaign.bosses.every((boss) => boss.status === 'defeated')).toBe(true);
  });

  test('replay is deterministic, and removing a completion (undo) rolls progress back', () => {
    const completions = [hit(60), hit(60), hit(50)];
    expect(computeBossCampaign(completions, bosses)).toEqual(computeBossCampaign(completions, bosses));

    const withoutSecond = computeBossCampaign([completions[0], completions[2]], bosses);
    expect(withoutSecond.bosses[0]).toMatchObject({ status: 'defeated' });
    expect(withoutSecond.bosses[1].damage).toBe(10);

    const onlyFirst = computeBossCampaign([completions[0]], bosses);
    expect(onlyFirst.bosses[0]).toMatchObject({ status: 'active', damage: 60, milestonesReached: [25, 50] });
  });
});
