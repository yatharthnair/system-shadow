import * as Notifications from 'expo-notifications';

import { syncScheduledNotifications } from '../notification-scheduler';

// In-memory stand-in for the OS notification scheduler.
const mockScheduled = new Map();
// Functions read `mockScheduled` lazily: jest.mock is hoisted above the const declaration.
jest.mock('expo-notifications', () => {
  return {
    SchedulableTriggerInputTypes: { DATE: 'date' },
    getAllScheduledNotificationsAsync: jest.fn(async () => [...mockScheduled.values()]),
    cancelScheduledNotificationAsync: jest.fn(async (identifier) => mockScheduled.delete(identifier)),
    scheduleNotificationAsync: jest.fn(async (request) => {
      mockScheduled.set(request.identifier, request);
      return request.identifier;
    }),
  };
});

const item = (identifier, fireAt, body = 'body') => ({ identifier, fireAt, title: 't', body, data: { kind: 'quest-reminder' } });
const ids = () => [...mockScheduled.keys()].sort();

beforeEach(() => {
  mockScheduled.clear();
  jest.clearAllMocks();
});

test('schedules a plan as one-time date triggers', async () => {
  const fireAt = new Date(2026, 10, 25, 20);
  expect(await syncScheduledNotifications([item('shadow:a', fireAt)])).toEqual({ scheduled: 1, cancelled: 0, kept: 0 });
  expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
    identifier: 'shadow:a',
    content: { title: 't', body: 'body', data: { kind: 'quest-reminder', fireAt: fireAt.getTime() } },
    trigger: { type: 'date', date: fireAt },
  });
});

test('re-syncing an unchanged plan does nothing (no churn)', async () => {
  const plan = [item('shadow:a', new Date(2026, 10, 25, 20))];
  await syncScheduledNotifications(plan);
  jest.clearAllMocks();
  expect(await syncScheduledNotifications(plan)).toEqual({ scheduled: 0, cancelled: 0, kept: 1 });
  expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
});

test('replaces changed notifications and cancels ones no longer planned', async () => {
  await syncScheduledNotifications([item('shadow:a', new Date(2026, 10, 25, 20), 'old'), item('shadow:b', new Date(2026, 10, 26, 8))]);
  const result = await syncScheduledNotifications([item('shadow:a', new Date(2026, 10, 25, 20), '1 quest left')]);
  expect(result).toEqual({ scheduled: 1, cancelled: 2, kept: 0 });
  expect(ids()).toEqual(['shadow:a']);
  expect(mockScheduled.get('shadow:a').content.body).toBe('1 quest left');
});

test('never touches notifications it did not create', async () => {
  mockScheduled.set('other-app-thing', { identifier: 'other-app-thing', content: { data: {} } });
  await syncScheduledNotifications([]);
  expect(ids()).toEqual(['other-app-thing']);
});
