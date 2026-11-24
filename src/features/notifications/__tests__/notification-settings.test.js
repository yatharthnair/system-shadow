import {
  DEFAULT_NOTIFICATION_SETTINGS,
  formatMinutesAsTime,
  MAX_REMINDERS,
  normalizeNotificationSettings,
  parseTimeToMinutes,
} from '../notification-settings';
import { isTimeInQuietHours, isWithinQuietHours } from '../quiet-hours';

describe('normalizeNotificationSettings', () => {
  test('missing or corrupt input yields defaults (notifications off until the player opts in)', () => {
    expect(normalizeNotificationSettings(null)).toEqual(DEFAULT_NOTIFICATION_SETTINGS);
    expect(normalizeNotificationSettings('garbage').enabled).toBe(false);
  });

  test('drops invalid reminders and sanitizes the rest', () => {
    const settings = normalizeNotificationSettings({
      questReminders: [
        { id: 'a', label: '  Lunch  ', time: '12:30', weekdays: [5, 1, 1, 9] },
        { id: 'b', time: '25:00', weekdays: [1] },
        { id: 'c', time: '09:00', weekdays: [] },
        { id: 'a', time: '10:00', weekdays: [2] },
      ],
    });
    expect(settings.questReminders).toEqual([{ id: 'a', label: 'Lunch', time: '12:30', weekdays: [1, 5], enabled: true }]);
  });

  test('caps the number of reminders', () => {
    const many = Array.from({ length: 9 }, (_, index) => ({ id: `r${index}`, time: '09:00', weekdays: [1] }));
    expect(normalizeNotificationSettings({ questReminders: many }).questReminders).toHaveLength(MAX_REMINDERS);
  });

  test('falls back per field for invalid weekly and quiet-hours values', () => {
    const settings = normalizeNotificationSettings({
      weeklyChallengeReminder: { enabled: false, weekday: 0, time: 'noon' },
      quietHours: { enabled: true, start: '23:15', end: 'x' },
    });
    expect(settings.weeklyChallengeReminder).toEqual({ enabled: false, weekday: 7, time: '18:00' });
    expect(settings.quietHours).toEqual({ enabled: true, start: '23:15', end: '07:00' });
  });
});

describe('time helpers', () => {
  test('round-trip', () => {
    expect(parseTimeToMinutes('07:05')).toBe(425);
    expect(formatMinutesAsTime(425)).toBe('07:05');
  });
});

describe('quiet hours', () => {
  const overnight = { enabled: true, start: '22:00', end: '07:00' };
  const at = (hour, minute = 0) => new Date(2026, 10, 25, hour, minute);

  test('overnight window: start inclusive, end exclusive', () => {
    expect(isWithinQuietHours(at(21, 59), overnight)).toBe(false);
    expect(isWithinQuietHours(at(22, 0), overnight)).toBe(true);
    expect(isWithinQuietHours(at(2), overnight)).toBe(true);
    expect(isWithinQuietHours(at(6, 59), overnight)).toBe(true);
    expect(isWithinQuietHours(at(7, 0), overnight)).toBe(false);
  });

  test('same-day window', () => {
    const afternoon = { enabled: true, start: '13:00', end: '15:00' };
    expect(isWithinQuietHours(at(14), afternoon)).toBe(true);
    expect(isWithinQuietHours(at(15), afternoon)).toBe(false);
  });

  test('disabled or zero-length windows never silence', () => {
    expect(isWithinQuietHours(at(23), { ...overnight, enabled: false })).toBe(false);
    expect(isWithinQuietHours(at(23), { enabled: true, start: '22:00', end: '22:00' })).toBe(false);
  });

  test('isTimeInQuietHours for settings warnings', () => {
    expect(isTimeInQuietHours('23:30', overnight)).toBe(true);
    expect(isTimeInQuietHours('08:00', overnight)).toBe(false);
  });
});
