import { getDatabase } from '@/database/database';
import { runMigrations } from '@/database/migrations';
import { createTestDatabase } from '@/test-utils/create-test-database';

import { usePlayerStore } from '../player-store';
import { useSystemNoticeStore } from '../system-notice-store';

jest.mock('@/database/database', () => ({ getDatabase: jest.fn() }));

let db;
const initialPlayerState = usePlayerStore.getState();

beforeEach(async () => {
  db = createTestDatabase();
  await runMigrations(db);
  getDatabase.mockResolvedValue(db);
  usePlayerStore.setState(initialPlayerState, true);
  useSystemNoticeStore.setState({ queue: [] });
});

afterEach(() => db.close());

test('hydrates from SQLite', async () => {
  await db.runAsync('INSERT INTO xp_transactions (id, source, xp) VALUES (?, ?, ?)', 'seed', 'test', 500);
  await db.runAsync('UPDATE player SET total_xp = 500 WHERE id = 1');

  await usePlayerStore.getState().hydrate();

  const state = usePlayerStore.getState();
  expect(state.hydrationStatus).toBe('ready');
  expect(state.name).toBe('Hunter');
  expect(state.progression).toMatchObject({ totalXp: 500, level: 3, rank: 'E' });
});

test('awardXp updates the snapshot and queues level-up and attribute notices', async () => {
  await usePlayerStore.getState().hydrate();
  await usePlayerStore.getState().awardXp({ id: 'q1', source: 'quest', xp: 400, attributeXp: { strength: 100 } });

  expect(usePlayerStore.getState().progression).toMatchObject({ level: 3, totalXp: 400 });
  expect(usePlayerStore.getState().progression.attributes.strength.level).toBeGreaterThan(1);
  expect(useSystemNoticeStore.getState().queue.map((notice) => notice.kind)).toEqual(['level-up', 'attribute-growth']);
});

test('a duplicate award queues no notices and leaves progression unchanged', async () => {
  await usePlayerStore.getState().hydrate();
  const reward = { id: 'q1', source: 'quest', xp: 400 };
  await usePlayerStore.getState().awardXp(reward);
  useSystemNoticeStore.setState({ queue: [] });

  const outcome = await usePlayerStore.getState().awardXp(reward);

  expect(outcome.status).toBe('duplicate');
  expect(usePlayerStore.getState().progression.totalXp).toBe(400);
  expect(useSystemNoticeStore.getState().queue).toEqual([]);
});

test('progress survives a store reset (simulated restart)', async () => {
  await usePlayerStore.getState().hydrate();
  await usePlayerStore.getState().awardXp({ id: 'q1', source: 'quest', xp: 1234, attributeXp: { charisma: 77 } });
  const before = usePlayerStore.getState().progression;

  usePlayerStore.setState(initialPlayerState, true); // app killed: memory gone
  await usePlayerStore.getState().hydrate();

  expect(usePlayerStore.getState().progression).toEqual(before);
});
