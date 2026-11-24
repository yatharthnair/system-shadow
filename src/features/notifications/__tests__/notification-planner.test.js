import { DEFAULT_NOTIFICATION_SETTINGS, normalizeNotificationSettings } from '../notification-settings';
import { buildEventNotification, MAX_SCHEDULED_NOTIFICATIONS, planScheduledNotifications } from '../notification-planner';

const quests = [
  { id: 'q1', cadence: 'daily', archivedAt: null },
  { id: 'q2', cadence: 'daily', archivedAt: null },
  { id: 'q3', cadence: 'weekdays', weekdays: [6, 7], archivedAt: null }, // weekends
  { id: 'q4', cadence: 'weekly', archivedAt: null },
];
const settings = (overrides = {}) => normalizeNotificationSettings({ ...DEFAULT_NOTIFICATION_SETTINGS, enabled: true, ...overrides });
const plan = (overrides = {}) =>
  planScheduledNotifications({
    settings: settings(),
    now: new Date(2026, 10, 25, 12), // Wednesday noon
    quests,
    today: { remainingCount: 2, remainingXp: 80 },
    weeklyChallenges: { incomplete: 2, total: 3, endsAt: new Date(2026, 10, 30) },
    ...overrides,
  });

describe('planScheduledNotifications', () => {
  test('nothing is planned while notifications are off', () => {
    expect(plan({ settings: settings({ enabled: false }) })).toEqual([]);
  });

  test('schedules daily reminders over the next 7 days, skipping times already past today', () => {
    const reminders = plan().filter((item) => item.data.kind === 'quest-reminder');
    // Today: only the 20:00 evening reminder is still ahead. Then 6 more days × 2 reminders.
    expect(reminders).toHaveLength(13);
    expect(reminders[0]).toMatchObject({
      identifier: 'shadow:reminder:evening:2026-11-25',
      fireAt: new Date(2026, 10, 25, 20, 0),
      body: '2 quests left today · 80 XP on the table.',
      data: { url: '/quests' },
    });
  });

  test('future days count the quests scheduled that day (weekend quests included on weekends)', () => {
    const reminders = plan();
    expect(reminders.find((item) => item.identifier === 'shadow:reminder:morning:2026-11-26').body).toMatch(/^2 quests/); // Thu
    expect(reminders.find((item) => item.identifier === 'shadow:reminder:morning:2026-11-28').body).toMatch(/^3 quests/); // Sat
  });

  test('skips today’s reminders once every quest is cleared', () => {
    const reminders = plan({ today: { remainingCount: 0, remainingXp: 0 } });
    expect(reminders.some((item) => item.identifier.endsWith(':2026-11-25'))).toBe(false);
    expect(reminders.some((item) => item.identifier.endsWith(':2026-11-26'))).toBe(true);
  });

  test('respects each reminder’s weekdays and enabled flag', () => {
    const reminders = plan({
      settings: settings({
        questReminders: [
          { id: 'weekdays', label: 'Work', time: '09:00', weekdays: [1, 2, 3, 4, 5] },
          { id: 'off', label: 'Off', time: '09:00', weekdays: [1, 2, 3, 4, 5, 6, 7], enabled: false },
        ],
      }),
    }).filter((item) => item.data.kind === 'quest-reminder');
    expect(reminders.map((item) => item.identifier)).toEqual([
      'shadow:reminder:weekdays:2026-11-26',
      'shadow:reminder:weekdays:2026-11-27',
      'shadow:reminder:weekdays:2026-11-30',
      'shadow:reminder:weekdays:2026-12-01',
    ]);
  });

  test('nothing is scheduled inside quiet hours', () => {
    const reminders = plan({
      settings: settings({
        questReminders: [{ id: 'late', label: 'Late', time: '23:00', weekdays: [1, 2, 3, 4, 5, 6, 7] }],
        quietHours: { enabled: true, start: '22:00', end: '07:00' },
      }),
    });
    expect(reminders.filter((item) => item.data.kind === 'quest-reminder')).toEqual([]);
  });

  test('weekly challenge reminder fires this week only while challenges are unfinished', () => {
    const weekly = plan().filter((item) => item.data.kind === 'weekly-challenge-reminder');
    expect(weekly[0]).toMatchObject({
      identifier: 'shadow:weekly:2026-W48',
      fireAt: new Date(2026, 10, 29, 18, 0), // Sunday 18:00
      body: '2 of 3 challenges unfinished. Resets in 6h 0m.',
      data: { url: '/challenges' },
    });

    const allDone = plan({ weeklyChallenges: { incomplete: 0, total: 3, endsAt: new Date(2026, 10, 30) } });
    expect(allDone.some((item) => item.identifier === 'shadow:weekly:2026-W48')).toBe(false);
  });

  test('reminders land on the right local time across a DST change', () => {
    const reminders = planScheduledNotifications({
      settings: settings(),
      now: new Date(2026, 9, 30, 12), // Fri 30 Oct; DST ends Sun 1 Nov
      quests,
      today: { remainingCount: 1, remainingXp: 40 },
      weeklyChallenges: null,
    });
    const sundayMorning = reminders.find((item) => item.identifier === 'shadow:reminder:morning:2026-11-01');
    expect(sundayMorning.fireAt.getHours()).toBe(8);
    expect(sundayMorning.fireAt.getMinutes()).toBe(0);
  });

  test('stays under the iOS pending-notification limit and is sorted by time', () => {
    const many = Array.from({ length: 5 }, (_, index) => ({ id: `r${index}`, time: `1${index}:00`, weekdays: [1, 2, 3, 4, 5, 6, 7] }));
    const reminders = plan({ settings: settings({ questReminders: many }) });
    expect(reminders.length).toBeLessThanOrEqual(MAX_SCHEDULED_NOTIFICATIONS);
    expect(reminders.map((item) => item.fireAt.getTime())).toEqual([...reminders].map((item) => item.fireAt.getTime()).sort((a, b) => a - b));
  });
});

describe('buildEventNotification', () => {
  const noon = new Date(2026, 10, 25, 12);

  test('quest completion and level-up notifications', () => {
    expect(buildEventNotification({ type: 'quest-completed', title: '50 push-ups', xp: 40 }, settings(), noon)).toEqual({
      title: 'Quest Cleared',
      body: '50 push-ups · +40 XP',
      data: { kind: 'quest-completed', url: '/quests' },
    });
    expect(buildEventNotification({ type: 'level-up', toLevel: 10, rankUp: { toRank: 'D' } }, settings(), noon).title).toBe('Rank Up · D');
  });

  test('suppressed when disabled per type, globally, or during quiet hours', () => {
    const event = { type: 'quest-completed', title: 'x', xp: 1 };
    expect(buildEventNotification(event, settings({ questCompletion: false }), noon)).toBeNull();
    expect(buildEventNotification(event, settings({ enabled: false }), noon)).toBeNull();
    expect(buildEventNotification(event, settings(), new Date(2026, 10, 25, 23))).toBeNull();
  });
});
