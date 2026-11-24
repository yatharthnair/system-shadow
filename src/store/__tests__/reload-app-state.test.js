import { getDatabase } from '@/database/database';
import { runMigrations } from '@/database/migrations';
import { createBackup, inspectBackup, restoreBackup } from '@/features/backup/backup-service';
import { createTestDatabase } from '@/test-utils/create-test-database';

import { usePlayerStore } from '../player-store';
import { useQuestStore } from '../quest-store';
import { reloadAppState } from '../reload-app-state';
import { useRewardStore } from '../reward-store';
import { useSystemNoticeStore } from '../system-notice-store';

jest.mock('@/database/database', () => ({ getDatabase: jest.fn() }));
jest.mock('@/features/notifications/notification-scheduler', () => ({
  canDeliver: () => false,
  getPermissionState: jest.fn(async () => ({ state: 'undetermined', canAskAgain: true })),
  requestPermission: jest.fn(),
  syncScheduledNotifications: jest.fn(async () => ({})),
  cancelAllAppNotifications: jest.fn(async () => ({})),
  presentNotificationNow: jest.fn(async () => {}),
}));

const databases = [];
async function useFreshDatabase() {
  const db = createTestDatabase();
  databases.push(db);
  await runMigrations(db);
  getDatabase.mockResolvedValue(db);
}
afterEach(() => {
  while (databases.length) databases.pop().close();
});

test('after a restore, every store shows the restored data in place', async () => {
  await useFreshDatabase();
  await usePlayerStore.getState().hydrate();
  await useQuestStore.getState().hydrate();
  await useRewardStore.getState().hydrate();
  const quest = await useQuestStore.getState().createQuest({ title: 'Read', category: 'career', difficulty: 'elite', cadence: 'daily', attributeWeights: { intelligence: 1 } });
  await useQuestStore.getState().completeQuest(quest.id);
  const progressionBefore = usePlayerStore.getState().progression;
  const backup = await createBackup();

  // A different device with no progress restores the backup.
  await useFreshDatabase();
  await usePlayerStore.getState().reload();
  await useQuestStore.getState().refresh();
  expect(usePlayerStore.getState().progression.totalXp).toBe(0);

  await restoreBackup(inspectBackup(JSON.stringify(backup)));
  await reloadAppState();

  expect(usePlayerStore.getState().progression).toEqual(progressionBefore);
  expect(useQuestStore.getState().board.find((item) => item.quest.id === quest.id).status).toBe('completed');
  expect(useRewardStore.getState().overview.achievementSummary.unlocked).toBeGreaterThan(0);
  expect(useSystemNoticeStore.getState().queue).toEqual([]);
  expect(usePlayerStore.getState().hydrationStatus).toBe('ready'); // no loading flash / navigation reset
});
