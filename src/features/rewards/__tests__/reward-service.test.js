import { getDatabase } from '@/database/database';
import { runMigrations } from '@/database/migrations';
import { DEFAULT_PROGRESSION_RULES } from '@/features/progression/progression-engine';
import { awardXp, loadProgression } from '@/features/progression/progression-service';
import { completeQuest, createQuest, undoQuestCompletion } from '@/features/quests/quest-service';
import { createTestDatabase } from '@/test-utils/create-test-database';

import * as rewardRepository from '../reward-repository';
import { equipTitle, loadRewardOverview } from '../reward-service';

jest.mock('@/database/database', () => ({ getDatabase: jest.fn() }));

let db;

beforeEach(async () => {
  db = createTestDatabase();
  await runMigrations(db);
  getDatabase.mockResolvedValue(db);
});

afterEach(() => {
  jest.restoreAllMocks();
  db.close();
});

const at = (month, day, hour = 12) => new Date(2026, month - 1, day, hour);
const WED = at(11, 25);

const questInput = (overrides = {}) => ({
  title: 'Quest',
  category: 'social',
  difficulty: 'normal',
  cadence: 'daily',
  attributeWeights: { charisma: 1 },
  ...overrides,
});

const activeUnlockKeys = async () =>
  (await db.getAllAsync('SELECT source_key FROM reward_unlocks WHERE revoked_at IS NULL ORDER BY source_key')).map((row) => row.source_key);
const rewardLedgerXp = async () =>
  (
    await db.getFirstAsync(
      "SELECT COALESCE(SUM(CASE kind WHEN 'reversal' THEN -xp ELSE xp END), 0) AS xp FROM xp_transactions WHERE id LIKE 'reward:%' OR reverses_transaction_id LIKE 'reward:%'",
    )
  ).xp;

describe('automatic unlocks from real activity', () => {
  test('nothing is unlocked before any activity', async () => {
    const { overview } = await loadRewardOverview(WED);
    expect(await activeUnlockKeys()).toEqual([]);
    expect(overview.achievementSummary.unlocked).toBe(0);
    expect(overview.equippedTitleId).toBe('unawakened');
  });

  test('the first quest completion unlocks First Steps in the same transaction, with XP and a title', async () => {
    const quest = await createQuest(questInput(), WED);
    const outcome = await completeQuest(quest.id, WED);

    expect(outcome.rewards.events.map((event) => event.reward.sourceKey)).toContain('achievement:first-steps');
    expect(await activeUnlockKeys()).toEqual(expect.arrayContaining(['achievement:architect', 'achievement:first-steps']));
    const ledgerRow = await db.getFirstAsync("SELECT xp, source FROM xp_transactions WHERE id = 'reward:achievement:first-steps#1'");
    expect(ledgerRow).toEqual({ xp: 50, source: 'achievement' });

    const { overview } = await loadRewardOverview(WED);
    expect(overview.titles.find((title) => title.id === 'awakened').isOwned).toBe(true);
  });

  test('reconciling again never grants twice', async () => {
    const quest = await createQuest(questInput(), WED);
    await completeQuest(quest.id, WED);
    const before = await rewardLedgerXp();

    const { reconciliation } = await loadRewardOverview(WED);
    await loadRewardOverview(WED);

    expect(reconciliation.events).toEqual([]);
    expect(await rewardLedgerXp()).toBe(before);
    expect((await db.getFirstAsync("SELECT COUNT(*) AS n FROM reward_unlocks WHERE source_key = 'achievement:first-steps'")).n).toBe(1);
  });

  test('undo revokes rewards that are no longer earned and reverses their XP; redo re-grants', async () => {
    const quest = await createQuest(questInput(), WED);
    const { completion } = await completeQuest(quest.id, WED);
    const undo = await undoQuestCompletion(completion.id, WED);

    expect(undo.rewards.events).toContainEqual(expect.objectContaining({ type: 'reward-revoked', reward: expect.objectContaining({ sourceKey: 'achievement:first-steps' }) }));
    expect(await activeUnlockKeys()).toEqual(['achievement:architect']); // creating a quest still counts
    expect(await rewardLedgerXp()).toBe(50);
    expect((await loadProgression()).repaired).toBe(false);

    await completeQuest(quest.id, WED);
    const regranted = await db.getFirstAsync(
      "SELECT id FROM reward_unlocks WHERE source_key = 'achievement:first-steps' AND revoked_at IS NULL",
    );
    expect(regranted.id).toBe('achievement:first-steps#2');
  });

  test('a revoked equipped title is unequipped', async () => {
    const quest = await createQuest(questInput(), WED);
    const { completion } = await completeQuest(quest.id, WED);
    await equipTitle('awakened');

    await undoQuestCompletion(completion.id, WED);
    expect((await loadRewardOverview(WED)).overview.equippedTitleId).toBe('unawakened');
  });

  test('if granting a reward fails, the whole quest completion rolls back', async () => {
    const quest = await createQuest(questInput(), WED);
    jest.spyOn(rewardRepository, 'insertUnlock').mockRejectedValueOnce(new Error('disk full'));

    await expect(completeQuest(quest.id, WED)).rejects.toThrow('disk full');
    expect((await db.getFirstAsync('SELECT COUNT(*) AS n FROM quest_completions')).n).toBe(0);
    expect((await db.getFirstAsync("SELECT COUNT(*) AS n FROM xp_transactions WHERE source = 'quest'")).n).toBe(0);
  });

  test('streak achievements follow consecutive days of activity', async () => {
    const quest = await createQuest(questInput(), at(11, 1));
    for (let day = 1; day <= 7; day += 1) await completeQuest(quest.id, at(11, day, 9));
    expect(await activeUnlockKeys()).toEqual(expect.arrayContaining(['achievement:streak-3', 'achievement:streak-7']));
  });

  test('time-of-day secret achievements use the completion time', async () => {
    const quest = await createQuest(questInput(), WED);
    await completeQuest(quest.id, new Date(2026, 10, 25, 2, 15));
    expect(await activeUnlockKeys()).toContain('achievement:night-owl');
  });
});

describe('weekly challenges', () => {
  test('are generated once per week and stay fixed even if quests change mid-week', async () => {
    await createQuest(questInput({ category: 'gaming' }), at(11, 23));
    const first = (await loadRewardOverview(at(11, 23))).overview.challenges;
    await createQuest(questInput({ category: 'fitness' }), at(11, 24));
    const later = (await loadRewardOverview(at(11, 26))).overview.challenges;

    expect(first).toHaveLength(3);
    expect(later.map((challenge) => challenge.challengeId)).toEqual(first.map((challenge) => challenge.challengeId));
    expect(first[1].category).toBe('gaming');
  });

  test('a new week brings new stored challenges, and last week’s completed challenges are kept', async () => {
    const quest = await createQuest(questInput({ category: 'social' }), at(11, 23));
    const { overview } = await loadRewardOverview(at(11, 23));
    const focus = overview.challenges.find((challenge) => challenge.metric === 'category_completed');
    expect(focus.category).toBe('social');

    for (let day = 23; day <= 27; day += 1) await completeQuest(quest.id, at(11, day));
    const focusKey = focus.sourceKey;
    expect(await activeUnlockKeys()).toContain(focusKey);
    expect((await db.getFirstAsync("SELECT COUNT(*) AS n FROM inventory_items WHERE item_key = 'weekly-sigil' AND revoked_at IS NULL")).n).toBeGreaterThan(0);

    const nextWeek = (await loadRewardOverview(at(11, 30))).overview;
    expect(nextWeek.weekKey).toBe('2026-W49');
    expect(nextWeek.challenges.every((challenge) => challenge.progress.current === 0)).toBe(true);
    expect(await activeUnlockKeys()).toContain(focusKey); // settled, not revoked by the new week's evaluation
  });

  test('progress counts only this week’s active completions', async () => {
    const quest = await createQuest(questInput(), at(11, 22)); // Sunday, previous week
    await completeQuest(quest.id, at(11, 22));
    await completeQuest(quest.id, at(11, 23));
    const { overview } = await loadRewardOverview(at(11, 23));
    const volume = overview.challenges[0];
    expect(volume.progress.current).toBe(volume.metric === 'quest_xp' ? 40 : 1);
  });
});

describe('boss battles', () => {
  test('quest XP damages the active boss; milestones and defeat grant rewards; overflow moves on', async () => {
    const quest = await createQuest(questInput({ category: 'fitness', difficulty: 'elite', cadence: 'weekly' }), WED); // 450 XP, Slothwarden weak to fitness
    await completeQuest(quest.id, WED); // 675 damage vs 600 HP

    const { overview } = await loadRewardOverview(WED);
    expect(overview.bosses[0]).toMatchObject({ id: 'slothwarden', status: 'defeated' });
    expect(overview.activeBoss.id).toBe('glutton-wyrm');
    expect(overview.activeBoss.damage).toBe(50); // 75 overflow damage = 50 base XP, no weakness
    expect(await activeUnlockKeys()).toEqual(
      expect.arrayContaining(['boss:slothwarden:25', 'boss:slothwarden:50', 'boss:slothwarden:75', 'boss:slothwarden:100', 'achievement:first-boss']),
    );
    const trophies = overview.inventory.filter((item) => item.type === 'trophy').map((item) => item.key);
    expect(trophies).toEqual(['trophy-slothwarden']);
    expect(overview.titles.find((title) => title.id === 'bossbreaker').isOwned).toBe(true);
  });

  test('undoing the killing blow resurrects the boss and revokes its rewards', async () => {
    const quest = await createQuest(questInput({ category: 'fitness', difficulty: 'elite', cadence: 'weekly' }), WED);
    const { completion } = await completeQuest(quest.id, WED);
    await undoQuestCompletion(completion.id, WED);

    const { overview } = await loadRewardOverview(WED);
    expect(overview.activeBoss).toMatchObject({ id: 'slothwarden', damage: 0 });
    expect((await activeUnlockKeys()).filter((key) => key.startsWith('boss:'))).toEqual([]);
    expect(overview.inventory).toEqual([]);
  });
});

describe('level milestones and convergence', () => {
  test('reward XP that crosses further milestones is granted in the same reconciliation', async () => {
    // Award activity XP just 90 short of level 10. The level-5 milestone (+100 XP) then carries the
    // player over level 10 — earning the level-10 milestone and achievement in later passes of the
    // same reconciliation.
    const level10Xp = DEFAULT_PROGRESSION_RULES.player.getTotalXpForLevel(10);
    await awardXp({ id: 'dev:1', source: 'dev', xp: level10Xp - 90 });
    const { reconciliation, overview } = await loadRewardOverview(WED);

    const grantedKeys = reconciliation.events.map((event) => event.reward.sourceKey);
    expect(grantedKeys).toEqual(expect.arrayContaining(['level:5', 'level:10', 'achievement:level-10']));
    expect(overview.levelMilestones.filter((milestone) => milestone.unlock).map((milestone) => milestone.level)).toEqual([5, 10]);
    expect(overview.inventory.map((item) => item.key)).toEqual(expect.arrayContaining(['relic-initiate-band', 'relic-hunters-mark']));
    expect((await loadProgression()).repaired).toBe(false);
  });
});

describe('titles', () => {
  test('only owned titles can be equipped', async () => {
    await expect(equipTitle('bossbreaker')).rejects.toMatchObject({ code: 'TITLE_NOT_OWNED' });
    await expect(equipTitle('nope')).rejects.toMatchObject({ code: 'UNKNOWN_TITLE' });
    await equipTitle('unawakened');
  });
});
