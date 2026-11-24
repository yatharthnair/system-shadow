import { getDatabase } from '@/database/database';
import { runMigrations } from '@/database/migrations';
import * as scheduler from '@/features/notifications/notification-scheduler';
import { createTestDatabase } from '@/test-utils/create-test-database';

import { useNotificationStore } from '../notification-store';
import { useQuestStore } from '../quest-store';

jest.mock('@/database/database', () => ({ getDatabase: jest.fn() }));
jest.mock('@/features/notifications/notification-scheduler', () => ({
  canDeliver: (permission) => permission.state === 'granted' || permission.state === 'provisional',
  getPermissionState: jest.fn(),
  requestPermission: jest.fn(),
  syncScheduledNotifications: jest.fn(async () => ({})),
  cancelAllAppNotifications: jest.fn(async () => ({})),
  presentNotificationNow: jest.fn(async () => {}),
}));

let db;
const initialState = useNotificationStore.getState();

beforeEach(async () => {
  jest.clearAllMocks();
  db = createTestDatabase();
  await runMigrations(db);
  getDatabase.mockResolvedValue(db);
  useNotificationStore.setState(initialState, true);
  scheduler.getPermissionState.mockResolvedValue({ state: 'undetermined', canAskAgain: true });
});
afterEach(() => db.close());

test('loading settings never prompts for permission; notifications start off', async () => {
  await useNotificationStore.getState().hydrate();
  expect(scheduler.requestPermission).not.toHaveBeenCalled();
  expect(useNotificationStore.getState().settings.enabled).toBe(false);
});

test('turning notifications on asks for permission, then schedules', async () => {
  scheduler.requestPermission.mockResolvedValue({ state: 'granted', canAskAgain: true });
  await useNotificationStore.getState().hydrate();

  expect(await useNotificationStore.getState().setEnabled(true)).toEqual({ enabled: true, blocked: false });
  expect(scheduler.requestPermission).toHaveBeenCalledTimes(1);
  expect(scheduler.syncScheduledNotifications).toHaveBeenCalled();

  // Persisted: a fresh load reads it back from SQLite.
  useNotificationStore.setState(initialState, true);
  scheduler.getPermissionState.mockResolvedValue({ state: 'granted', canAskAgain: true });
  await useNotificationStore.getState().hydrate();
  expect(useNotificationStore.getState().settings.enabled).toBe(true);
});

test('if permission is refused, notifications stay off and nothing is scheduled', async () => {
  scheduler.requestPermission.mockResolvedValue({ state: 'denied', canAskAgain: false });
  await useNotificationStore.getState().hydrate();

  expect(await useNotificationStore.getState().setEnabled(true)).toEqual({ enabled: false, blocked: true });
  expect(useNotificationStore.getState().settings.enabled).toBe(false);
  expect(scheduler.syncScheduledNotifications).not.toHaveBeenCalled();
  expect(scheduler.cancelAllAppNotifications).toHaveBeenCalled();
});

test('does not re-prompt once permission has been answered', async () => {
  scheduler.getPermissionState.mockResolvedValue({ state: 'denied', canAskAgain: false });
  await useNotificationStore.getState().hydrate();
  await useNotificationStore.getState().setEnabled(true);
  expect(scheduler.requestPermission).not.toHaveBeenCalled();
});

test('turning notifications off cancels everything scheduled', async () => {
  scheduler.getPermissionState.mockResolvedValue({ state: 'granted', canAskAgain: true });
  await useNotificationStore.getState().hydrate();
  await useNotificationStore.getState().setEnabled(true);
  await useNotificationStore.getState().setEnabled(false);

  expect(scheduler.cancelAllAppNotifications).toHaveBeenCalled();
  expect(useNotificationStore.getState().scheduledCount).toBe(0);
});

test('the schedule is built from live quest data', async () => {
  scheduler.getPermissionState.mockResolvedValue({ state: 'granted', canAskAgain: true });
  await useQuestStore.getState().hydrate();
  await useNotificationStore.getState().hydrate();
  await useNotificationStore.getState().setEnabled(true);

  const plan = scheduler.syncScheduledNotifications.mock.calls.at(-1)[0];
  expect(plan.length).toBeGreaterThan(0);
  expect(plan.every((item) => item.identifier.startsWith('shadow:'))).toBe(true);
});

test('event notifications respect per-type toggles', async () => {
  scheduler.getPermissionState.mockResolvedValue({ state: 'granted', canAskAgain: true });
  await useNotificationStore.getState().hydrate();
  await useNotificationStore.getState().setEnabled(true);
  await useNotificationStore.getState().updateSettings((settings) => ({ ...settings, questCompletion: false, quietHours: { ...settings.quietHours, enabled: false } }));

  await useNotificationStore.getState().notifyActivity({ type: 'quest-completed', title: 'x', xp: 10 });
  await useNotificationStore.getState().notifyActivity({ type: 'level-up', toLevel: 3, rankUp: null });

  expect(scheduler.presentNotificationNow).toHaveBeenCalledTimes(1);
  expect(scheduler.presentNotificationNow.mock.calls[0][0].title).toBe('Level Up');
});
