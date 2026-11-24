import { getDatabase } from '@/database/database';
import { runMigrations } from '@/database/migrations';
import { awardXp } from '@/features/progression/progression-service';
import { completeQuest, createQuest, undoQuestCompletion } from '@/features/quests/quest-service';
import { createTestDatabase } from '@/test-utils/create-test-database';

import { loadAnalyticsData } from '../analytics-service';

jest.mock('@/database/database', () => ({ getDatabase: jest.fn() }));

let db;
beforeEach(async () => {
  db = createTestDatabase();
  await runMigrations(db);
  getDatabase.mockResolvedValue(db);
});
afterEach(() => db.close());

const input = { title: 'Lift', category: 'fitness', difficulty: 'normal', cadence: 'daily', attributeWeights: { strength: 1 } };

test('reads only standing activity, dated by when it was earned', async () => {
  const quest = await createQuest(input, new Date(2026, 10, 20, 9));
  await completeQuest(quest.id, new Date(2026, 10, 23, 8)); // Monday
  const undone = await completeQuest(quest.id, new Date(2026, 10, 24, 8));
  await undoQuestCompletion(undone.completion.id, new Date(2026, 10, 24, 9));
  await awardXp({ id: 'dev:1', source: 'dev', xp: 5 });

  const data = await loadAnalyticsData();

  expect(data.completions).toEqual([
    expect.objectContaining({ periodKey: '2026-11-23', completedAt: new Date(2026, 10, 23, 8).toISOString(), category: 'fitness', cadence: 'daily' }),
  ]);

  const questXp = data.xpEvents.filter((event) => event.source === 'quest');
  expect(questXp).toEqual([{ source: 'quest', xp: 40, occurredAt: new Date(2026, 10, 23, 8).toISOString() }]);
  // Reward XP (first quest, quest creation, …) is dated by its unlock time, not "now".
  expect(data.xpEvents.filter((event) => event.source === 'achievement').every((event) => event.occurredAt.startsWith('2026-11-2'))).toBe(true);
  expect(data.xpEvents.some((event) => event.source === 'dev' && event.xp === 5)).toBe(true);

  expect(data.attributeXpEvents).toEqual([{ attributeKey: 'strength', xp: 40, occurredAt: new Date(2026, 10, 23, 8).toISOString() }]);
  expect(data.quests).toEqual(expect.arrayContaining([expect.objectContaining({ id: quest.id, cadence: 'daily', archivedAt: null })]));
});
