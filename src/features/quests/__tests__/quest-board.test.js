import { buildQuestBoard, filterQuestBoard, sortQuestBoard, summarizeQuestBoard } from '../quest-board';

const makeQuest = (overrides) => ({
  id: overrides.id,
  title: overrides.id,
  category: 'fitness',
  difficulty: 'normal',
  cadence: 'daily',
  weekdays: null,
  attributeWeights: { strength: 1 },
  sortOrder: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  archivedAt: null,
  ...overrides,
});

const now = new Date(2026, 10, 25, 12); // Wednesday
const quests = [
  makeQuest({ id: 'pushups' }),
  makeQuest({ id: 'water', category: 'nutrition', difficulty: 'easy' }),
  makeQuest({ id: 'run', cadence: 'weekly', difficulty: 'hard' }),
  makeQuest({ id: 'stream', category: 'livestreaming', cadence: 'weekdays', weekdays: [2, 4] }), // Tue/Thu
  makeQuest({ id: 'resume', category: 'career', cadence: 'once' }),
  makeQuest({ id: 'old', archivedAt: '2026-11-01T00:00:00.000Z' }),
];
const completion = (questId, periodKey, xpAwarded, completedAt = now) => ({
  id: `${questId}:${periodKey}:1`,
  questId,
  periodKey,
  xpAwarded,
  completedAt: completedAt.toISOString(),
  undoneAt: null,
});

describe('buildQuestBoard', () => {
  const board = buildQuestBoard(quests, [completion('pushups', '2026-11-25', 40), completion('run', '2026-W48', 240)], now);
  const byId = Object.fromEntries(board.map((item) => [item.quest.id, item]));

  test('excludes archived quests', () => {
    expect(byId.old).toBeUndefined();
  });

  test('marks quests completed only for the current period', () => {
    expect(byId.pushups).toMatchObject({ status: 'completed', canUndo: true, xpReward: 40 });
    expect(byId.water).toMatchObject({ status: 'available', xpReward: 20, attributeXp: { strength: 20 } });
    expect(byId.run).toMatchObject({ status: 'completed', group: 'weekly' });
  });

  test('a completion from yesterday does not count today (daily reset)', () => {
    const nextDay = buildQuestBoard(quests, [completion('pushups', '2026-11-25', 40)], new Date(2026, 10, 26, 0, 0));
    expect(nextDay.find((item) => item.quest.id === 'pushups').status).toBe('available');
  });

  test('specific-days quests rest on other days and show when they return', () => {
    expect(byId.stream).toMatchObject({ status: 'resting', group: 'custom', nextScheduledAt: new Date(2026, 10, 26) });
  });

  test('includes reset times', () => {
    expect(byId.water.resetsAt).toEqual(new Date(2026, 10, 26));
    expect(byId.run.resetsAt).toEqual(new Date(2026, 10, 30));
  });

  test('one-time quests stay visible the day they are completed, then leave the board', () => {
    const doneToday = buildQuestBoard(quests, [completion('resume', 'once', 80)], now);
    expect(doneToday.find((item) => item.quest.id === 'resume').status).toBe('completed');

    const doneYesterday = buildQuestBoard(quests, [completion('resume', 'once', 80, new Date(2026, 10, 24, 9))], now);
    expect(doneYesterday.find((item) => item.quest.id === 'resume')).toBeUndefined();
  });

  test('summary counts progress per group, ignoring resting quests', () => {
    expect(summarizeQuestBoard(board)).toEqual({
      overall: { completed: 2, total: 4, progress: 0.5 },
      daily: { completed: 1, total: 2 },
      weekly: { completed: 1, total: 1 },
      custom: { completed: 0, total: 1 },
      xpEarned: 280,
      xpAvailable: 100,
    });
  });

  test('filters by group, category and completion', () => {
    expect(filterQuestBoard(board, { group: 'daily' }).map((item) => item.quest.id)).toEqual(['pushups', 'water']);
    expect(filterQuestBoard(board, { group: 'custom' }).map((item) => item.quest.id)).toEqual(['stream', 'resume']);
    expect(filterQuestBoard(board, { category: 'nutrition' }).map((item) => item.quest.id)).toEqual(['water']);
    expect(filterQuestBoard(board, { hideCompleted: true }).map((item) => item.quest.id)).toEqual(['water', 'stream', 'resume']);
  });

  test('sorts available, then completed, then resting', () => {
    expect(sortQuestBoard(board).map((item) => item.status)).toEqual([
      'available',
      'available',
      'completed',
      'completed',
      'resting',
    ]);
  });
});
