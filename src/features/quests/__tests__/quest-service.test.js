import { getDatabase } from '@/database/database';
import { runMigrations } from '@/database/migrations';
import * as progressionRepository from '@/features/progression/progression-repository';
import { buildProgressionSnapshot } from '@/features/progression/progression-engine';
import { loadProgression } from '@/features/progression/progression-service';
import { createTestDatabase } from '@/test-utils/create-test-database';

import { buildQuestBoard } from '../quest-board';
import {
  archiveQuest,
  completeQuest,
  createQuest,
  loadQuestBoardData,
  loadQuestHistory,
  undoQuestCompletion,
  updateQuest,
} from '../quest-service';
import { QUEST_TEMPLATES } from '../quest-templates';

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

// Wednesday 25 Nov 2026, local (America/New_York).
const at = (day, hour = 12, minute = 0) => new Date(2026, 10, day, hour, minute);
const WED = at(25);

const dailyInput = {
  title: 'Read 20 pages',
  category: 'career',
  difficulty: 'normal', // 40 XP daily
  cadence: 'daily',
  attributeWeights: { intelligence: 1 },
};

// Quests now also unlock achievements (bonus XP), so quest tests measure XP from quests only:
// net ledger XP with source 'quest' (awards minus reversals).
const questXp = async () =>
  (
    await db.getFirstAsync(
      "SELECT COALESCE(SUM(CASE kind WHEN 'reversal' THEN -xp ELSE xp END), 0) AS xp FROM xp_transactions WHERE source = 'quest'",
    )
  ).xp;
const countRows = async (table, where = '1 = 1') =>
  (await db.getFirstAsync(`SELECT COUNT(*) AS count FROM ${table} WHERE ${where}`)).count;
const boardItem = async (questId, now) => {
  const { quests, activeCompletions } = await loadQuestBoardData(now);
  return buildQuestBoard(quests, activeCompletions, now).find((item) => item.quest.id === questId);
};

describe('seeding and quest management', () => {
  test('seeds built-in quests once, idempotently', async () => {
    await loadQuestBoardData(WED);
    await loadQuestBoardData(WED);
    expect(await countRows('quests')).toBe(QUEST_TEMPLATES.length);
  });

  test('an archived built-in quest is not re-seeded', async () => {
    const { quests } = await loadQuestBoardData(WED);
    await archiveQuest(quests[0].id, WED);
    const { quests: after } = await loadQuestBoardData(WED);
    expect(after.map((quest) => quest.id)).not.toContain(quests[0].id);
    expect(await countRows('quests')).toBe(QUEST_TEMPLATES.length);
  });

  test('creates, edits and persists a custom quest with attribute weights', async () => {
    const created = await createQuest({ ...dailyInput, cadence: 'weekdays', weekdays: [1, 3, 5] }, WED);
    await updateQuest(created.id, { ...created, title: 'Read 30 pages', difficulty: 'hard', attributeWeights: { intelligence: 2, discipline: 1 } }, WED);

    const { quests } = await loadQuestBoardData(WED);
    expect(quests.find((quest) => quest.id === created.id)).toMatchObject({
      origin: 'custom',
      title: 'Read 30 pages',
      difficulty: 'hard',
      cadence: 'weekdays',
      weekdays: [1, 3, 5],
      attributeWeights: { intelligence: 2, discipline: 1 },
    });
  });

  test('rejects invalid input and repeat-type changes', async () => {
    await expect(createQuest({ ...dailyInput, title: '' }, WED)).rejects.toMatchObject({ code: 'INVALID_QUEST' });
    const created = await createQuest(dailyInput, WED);
    await expect(updateQuest(created.id, { ...dailyInput, cadence: 'weekly' }, WED)).rejects.toMatchObject({
      code: 'INVALID_QUEST',
      fieldErrors: expect.objectContaining({ cadence: expect.any(String) }),
    });
  });
});

describe('completing quests — XP exactly once', () => {
  test('completion awards difficulty-based XP to the player and the quest’s attributes', async () => {
    const quest = await createQuest({ ...dailyInput, difficulty: 'hard', attributeWeights: { intelligence: 3, discipline: 1 } }, WED);
    const outcome = await completeQuest(quest.id, WED);

    expect(outcome.status).toBe('completed');
    expect(outcome.completion).toMatchObject({ periodKey: '2026-11-25', xpAwarded: 80 });
    expect(await questXp()).toBe(80);
    const { state } = await loadProgression();
    expect(state.attributeXp).toMatchObject({ intelligence: 60, discipline: 20 });
  });

  test('completing twice in the same period awards XP once', async () => {
    const quest = await createQuest(dailyInput, WED);
    await completeQuest(quest.id, at(25, 8));
    const second = await completeQuest(quest.id, at(25, 22));

    expect(second.status).toBe('already-completed');
    expect(second.progression).toBeNull();
    expect(await questXp()).toBe(40);
    expect(await countRows('quest_completions')).toBe(1);
    expect(await countRows('xp_transactions', "source = 'quest'")).toBe(1);
  });

  test('simultaneous completions (double tap) award XP once', async () => {
    const quest = await createQuest(dailyInput, WED);
    const outcomes = await Promise.all([completeQuest(quest.id, WED), completeQuest(quest.id, WED), completeQuest(quest.id, WED)]);

    expect(outcomes.map((outcome) => outcome.status).sort()).toEqual(['already-completed', 'already-completed', 'completed']);
    expect(await questXp()).toBe(40);
  });

  test('the database rejects a second active completion even if the service check were bypassed', async () => {
    const quest = await createQuest(dailyInput, WED);
    await completeQuest(quest.id, WED);
    await expect(
      db.runAsync(
        `INSERT INTO quest_completions (id, quest_id, period_key, completed_at, xp_transaction_id, xp_awarded, quest_title, category, difficulty)
         VALUES ('dup', ?, '2026-11-25', 'now', 'quest:${quest.id}:2026-11-25:1', 40, 't', 'career', 'normal')`,
        quest.id,
      ),
    ).rejects.toThrow(/UNIQUE/);
  });

  test('if the XP award fails, no completion is recorded (atomic)', async () => {
    const quest = await createQuest(dailyInput, WED);
    jest.spyOn(progressionRepository, 'writeProgressionState').mockRejectedValueOnce(new Error('disk full'));

    await expect(completeQuest(quest.id, WED)).rejects.toThrow('disk full');
    expect(await countRows('quest_completions')).toBe(0);
    expect(await countRows('xp_transactions', "source = 'quest'")).toBe(0);

    expect((await completeQuest(quest.id, WED)).status).toBe('completed');
    expect(await questXp()).toBe(40);
  });

  test('cannot complete a specific-days quest on an unscheduled day, or an archived quest', async () => {
    const tueThu = await createQuest({ ...dailyInput, cadence: 'weekdays', weekdays: [2, 4] }, WED);
    await expect(completeQuest(tueThu.id, WED)).rejects.toMatchObject({ code: 'NOT_SCHEDULED_TODAY' });
    expect((await completeQuest(tueThu.id, at(26))).status).toBe('completed');

    const archived = await createQuest(dailyInput, WED);
    await archiveQuest(archived.id, WED);
    await expect(completeQuest(archived.id, WED)).rejects.toMatchObject({ code: 'QUEST_ARCHIVED' });
  });
});

describe('undo', () => {
  test('reverses exactly the XP awarded, including attribute XP', async () => {
    const quest = await createQuest({ ...dailyInput, attributeWeights: { intelligence: 1, charisma: 1 } }, WED);
    const { completion } = await completeQuest(quest.id, WED);

    const outcome = await undoQuestCompletion(completion.id, WED);

    expect(outcome.status).toBe('undone');
    expect(outcome.progression.status).toBe('reversed');
    expect(await questXp()).toBe(0);
    const { state, repaired } = await loadProgression();
    expect(state.attributeXp).toMatchObject({ intelligence: 0, charisma: 0 });
    expect(repaired).toBe(false);
    expect((await boardItem(quest.id, WED)).status).toBe('available');
  });

  test('reverses a multi-level reward back to the original level', async () => {
    const quest = await createQuest({ ...dailyInput, difficulty: 'elite', cadence: 'weekly' }, WED); // 450 XP
    const { completion, progression } = await completeQuest(quest.id, WED);
    expect(progression.events).toContainEqual(expect.objectContaining({ type: 'player-level-up', toLevel: 3 }));

    const undo = await undoQuestCompletion(completion.id, WED);
    expect(undo.progression.events).toContainEqual(expect.objectContaining({ type: 'player-level-down' }));
    // After the quest XP and the rewards it unlocked are reversed, the player is back to level 1.
    expect(buildProgressionSnapshot(undo.rewards.state).level).toBe(1);
  });

  test('undo twice is a no-op the second time', async () => {
    const quest = await createQuest(dailyInput, WED);
    const { completion } = await completeQuest(quest.id, WED);
    await undoQuestCompletion(completion.id, WED);

    expect((await undoQuestCompletion(completion.id, WED)).status).toBe('already-undone');
    expect(await questXp()).toBe(0);
    expect(await countRows('xp_transactions', "kind = 'reversal' AND source = 'quest'")).toBe(1);
  });

  test('simultaneous undos reverse once', async () => {
    const quest = await createQuest(dailyInput, WED);
    await completeQuest(quest.id, at(25, 8)); // some unrelated XP first
    const other = await createQuest({ ...dailyInput, title: 'Other' }, WED);
    const { completion } = await completeQuest(other.id, WED);

    const outcomes = await Promise.all([undoQuestCompletion(completion.id, WED), undoQuestCompletion(completion.id, WED)]);
    expect(outcomes.map((outcome) => outcome.status).sort()).toEqual(['already-undone', 'undone']);
    expect(await questXp()).toBe(40);
  });

  test('complete → undo → complete awards XP again under a new transaction', async () => {
    const quest = await createQuest(dailyInput, WED);
    const first = await completeQuest(quest.id, WED);
    await undoQuestCompletion(first.completion.id, WED);
    const second = await completeQuest(quest.id, WED);

    expect(second.status).toBe('completed');
    expect(second.completion.xpTransactionId).not.toBe(first.completion.xpTransactionId);
    expect(await questXp()).toBe(40);
    expect(await countRows('quest_completions')).toBe(2);
    expect(await countRows('quest_completions', 'undone_at IS NULL')).toBe(1);
  });

  test('undo is refused once the period has ended (XP stays settled)', async () => {
    const quest = await createQuest(dailyInput, WED);
    const { completion } = await completeQuest(quest.id, at(25, 23, 59));

    await expect(undoQuestCompletion(completion.id, at(26, 0, 0))).rejects.toMatchObject({ code: 'UNDO_WINDOW_CLOSED' });
    expect(await questXp()).toBe(40);
  });

  test('undo reverses the XP actually awarded even if the quest was edited since', async () => {
    const quest = await createQuest(dailyInput, WED); // normal: 40 XP
    const { completion } = await completeQuest(quest.id, WED);
    await updateQuest(quest.id, { ...dailyInput, difficulty: 'elite' }, WED); // now worth 150

    await undoQuestCompletion(completion.id, WED);
    expect(await questXp()).toBe(0);
  });
});

describe('daily and weekly resets', () => {
  test('a daily quest resets at local midnight and can be completed again', async () => {
    const quest = await createQuest(dailyInput, WED);
    await completeQuest(quest.id, at(25, 23, 59));

    expect((await boardItem(quest.id, at(25, 23, 59))).status).toBe('completed');
    expect((await boardItem(quest.id, at(26, 0, 0))).status).toBe('available');

    expect((await completeQuest(quest.id, at(26, 0, 0))).status).toBe('completed');
    expect(await questXp()).toBe(80);
  });

  test('a weekly quest stays completed through Sunday and resets Monday 00:00', async () => {
    const quest = await createQuest({ ...dailyInput, cadence: 'weekly' }, WED); // 120 XP
    await completeQuest(quest.id, at(23, 7)); // Monday

    expect((await completeQuest(quest.id, at(29, 23, 59))).status).toBe('already-completed'); // Sunday
    expect((await boardItem(quest.id, at(30, 0, 0))).status).toBe('available'); // next Monday
    expect((await completeQuest(quest.id, at(30, 0, 0))).status).toBe('completed');
    expect(await questXp()).toBe(240);
  });

  test('resets are correct across a DST change (fall back, 1 Nov 2026)', async () => {
    const quest = await createQuest(dailyInput, WED);
    await completeQuest(quest.id, new Date(2026, 10, 1, 1, 30)); // ambiguous 01:30 on the 25-hour day
    expect((await completeQuest(quest.id, new Date(2026, 10, 1, 23, 59))).status).toBe('already-completed');
    expect((await completeQuest(quest.id, new Date(2026, 10, 2, 0, 0))).status).toBe('completed');
  });

  test('one-time quests never reset', async () => {
    const quest = await createQuest({ ...dailyInput, cadence: 'once' }, WED);
    await completeQuest(quest.id, WED);
    expect((await completeQuest(quest.id, new Date(2027, 5, 1))).status).toBe('already-completed');
  });
});

describe('history and persistence', () => {
  test('history lists completions newest first, keeping undone entries, with totals', async () => {
    const quest = await createQuest(dailyInput, WED);
    const monday = await completeQuest(quest.id, at(23, 9));
    await completeQuest(quest.id, at(24, 9));
    const wednesday = await completeQuest(quest.id, at(25, 9));
    await undoQuestCompletion(wednesday.completion.id, at(25, 10));

    const history = await loadQuestHistory();
    expect(history.entries.map((entry) => entry.periodKey)).toEqual(['2026-11-25', '2026-11-24', '2026-11-23']);
    expect(history.entries[0].undoneAt).not.toBeNull();
    expect(history.entries[2].id).toBe(monday.completion.id);
    expect(history.totals).toEqual({ completedCount: 2, xpTotal: 80 });
  });

  test('history keeps the title at completion time after the quest is renamed or archived', async () => {
    const quest = await createQuest(dailyInput, WED);
    await completeQuest(quest.id, WED);
    await updateQuest(quest.id, { ...dailyInput, title: 'Renamed' }, WED);
    await archiveQuest(quest.id, WED);

    expect((await loadQuestHistory()).entries[0].questTitle).toBe('Read 20 pages');
  });

  test('state survives a restart: completions, board status and XP are re-read from SQLite', async () => {
    const quest = await createQuest(dailyInput, WED);
    const weekly = await createQuest({ ...dailyInput, title: 'Weekly', cadence: 'weekly' }, WED);
    await completeQuest(quest.id, WED);
    await completeQuest(weekly.id, at(24));

    // "Restart": re-run migrations (no-op) and reload everything from the same database.
    await runMigrations(db);
    const { quests, activeCompletions } = await loadQuestBoardData(WED);
    const board = buildQuestBoard(quests, activeCompletions, WED);

    expect(board.find((item) => item.quest.id === quest.id).status).toBe('completed');
    expect(board.find((item) => item.quest.id === weekly.id).status).toBe('completed');
    expect(await questXp()).toBe(160);
    expect((await completeQuest(quest.id, WED)).status).toBe('already-completed');
    expect((await loadProgression()).repaired).toBe(false);
  });
});
