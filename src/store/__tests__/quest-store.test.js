import { getDatabase } from '@/database/database';
import { runMigrations } from '@/database/migrations';
import { createTestDatabase } from '@/test-utils/create-test-database';

import { usePlayerStore } from '../player-store';
import { useQuestStore } from '../quest-store';
import { useSystemNoticeStore } from '../system-notice-store';

jest.mock('@/database/database', () => ({ getDatabase: jest.fn() }));

let db;
const initialQuestState = useQuestStore.getState();
const initialPlayerState = usePlayerStore.getState();

beforeEach(async () => {
  db = createTestDatabase();
  await runMigrations(db);
  getDatabase.mockResolvedValue(db);
  useQuestStore.setState(initialQuestState, true);
  usePlayerStore.setState(initialPlayerState, true);
  useSystemNoticeStore.setState({ queue: [] });
  await usePlayerStore.getState().hydrate();
  await useQuestStore.getState().hydrate();
});

afterEach(() => db.close());

const createDailyQuest = (overrides = {}) =>
  useQuestStore.getState().createQuest({
    title: 'Stretch',
    category: 'recovery',
    difficulty: 'elite', // 150 XP → level up from level 1
    cadence: 'daily',
    attributeWeights: { vitality: 1 },
    ...overrides,
  });

test('hydrates the board with seeded quests', () => {
  const { status, board, summary } = useQuestStore.getState();
  expect(status).toBe('ready');
  expect(board.length).toBeGreaterThan(0);
  expect(summary.overall.completed).toBe(0);
});

test('completing a quest updates the board, player XP and notices; undo reverts all of it', async () => {
  const quest = await createDailyQuest();

  await useQuestStore.getState().completeQuest(quest.id);
  const completedItem = useQuestStore.getState().board.find((item) => item.quest.id === quest.id);
  expect(completedItem.status).toBe('completed');
  // 150 quest XP + 50 "First Steps" + 50 "Architect" (created a custom quest)
  // + 30 for hitting 25% of the first boss (150 damage vs 600 HP).
  expect(usePlayerStore.getState().progression).toMatchObject({ totalXp: 280, level: 2 });
  expect(useSystemNoticeStore.getState().queue.map((notice) => notice.kind)).toContain('achievement-unlocked');
  expect(useSystemNoticeStore.getState().queue.map((notice) => notice.kind)).toContain('level-up');
  expect(useQuestStore.getState().pendingQuestIds).toEqual({});

  await useQuestStore.getState().undoCompletion(quest.id, completedItem.completion.id);
  expect(useQuestStore.getState().board.find((item) => item.quest.id === quest.id).status).toBe('available');
  // The quest XP, "First Steps" and the boss milestone are reversed; "Architect" (quest creation) stands.
  expect(usePlayerStore.getState().progression).toMatchObject({ totalXp: 50, level: 1 });
});

test('a second tap while a completion is in flight is ignored', async () => {
  const quest = await createDailyQuest();
  const [first, second] = await Promise.all([
    useQuestStore.getState().completeQuest(quest.id),
    useQuestStore.getState().completeQuest(quest.id),
  ]);
  expect(first.status).toBe('completed');
  expect(second).toBeNull();
  expect(usePlayerStore.getState().progression.totalXp).toBe(280);
});

test('history loads completions with totals', async () => {
  const quest = await createDailyQuest({ difficulty: 'easy' });
  await useQuestStore.getState().completeQuest(quest.id);
  await useQuestStore.getState().loadHistory();

  expect(useQuestStore.getState().history).toMatchObject({
    status: 'ready',
    totals: { completedCount: 1, xpTotal: 20 },
    entries: [expect.objectContaining({ questTitle: 'Stretch' })],
  });
});
