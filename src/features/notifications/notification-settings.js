/**
 * Notification preferences: defaults, validation and time helpers. Pure.
 * Times are local "HH:MM" strings; weekdays are ISO (1 = Monday … 7 = Sunday), like quests.
 */

export const MAX_REMINDERS = 5;

export const DEFAULT_NOTIFICATION_SETTINGS = {
  /** Master switch. Off until the player opts in (which is when permission is requested). */
  enabled: false,
  questReminders: [
    { id: 'morning', label: 'Morning briefing', time: '08:00', weekdays: [1, 2, 3, 4, 5, 6, 7], enabled: true },
    { id: 'evening', label: 'Evening check-in', time: '20:00', weekdays: [1, 2, 3, 4, 5, 6, 7], enabled: true },
  ],
  weeklyChallengeReminder: { enabled: true, weekday: 7, time: '18:00' },
  questCompletion: true,
  levelUp: true,
  quietHours: { enabled: true, start: '22:00', end: '07:00' },
};

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isValidTime(value) {
  return typeof value === 'string' && TIME_PATTERN.test(value);
}

/** "HH:MM" → minutes after midnight. */
export function parseTimeToMinutes(time) {
  const [, hours, minutes] = TIME_PATTERN.exec(time);
  return Number(hours) * 60 + Number(minutes);
}

/** Minutes after midnight → "HH:MM". */
export function formatMinutesAsTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/** Date → its local "HH:MM". */
export function toTimeString(date) {
  return formatMinutesAsTime(date.getHours() * 60 + date.getMinutes());
}

/** A Date today at a local "HH:MM" (for pickers). */
export function timeStringToDate(time, base = new Date()) {
  const minutes = parseTimeToMinutes(time);
  return new Date(base.getFullYear(), base.getMonth(), base.getDate(), Math.floor(minutes / 60), minutes % 60);
}

const isWeekday = (day) => Number.isInteger(day) && day >= 1 && day <= 7;

function normalizeReminder(reminder, index) {
  if (!reminder || typeof reminder !== 'object') return null;
  const weekdays = Array.isArray(reminder.weekdays) ? [...new Set(reminder.weekdays.filter(isWeekday))].sort((a, b) => a - b) : [];
  if (!isValidTime(reminder.time) || weekdays.length === 0) return null;
  return {
    id: typeof reminder.id === 'string' && reminder.id ? reminder.id : `reminder-${index}`,
    label: typeof reminder.label === 'string' && reminder.label.trim() ? reminder.label.trim().slice(0, 40) : 'Quest reminder',
    time: reminder.time,
    weekdays,
    enabled: reminder.enabled !== false,
  };
}

/**
 * Fills in defaults and drops anything invalid, so stored or partially-updated settings are always
 * safe to use. Unknown keys are discarded.
 */
export function normalizeNotificationSettings(raw) {
  const input = raw && typeof raw === 'object' ? raw : {};
  const defaults = DEFAULT_NOTIFICATION_SETTINGS;

  const reminders = Array.isArray(input.questReminders)
    ? input.questReminders.map(normalizeReminder).filter(Boolean)
    : defaults.questReminders;
  const uniqueReminders = reminders.filter((reminder, index) => reminders.findIndex((other) => other.id === reminder.id) === index);

  const weekly = input.weeklyChallengeReminder ?? {};
  const quiet = input.quietHours ?? {};

  return {
    enabled: typeof input.enabled === 'boolean' ? input.enabled : defaults.enabled,
    questReminders: uniqueReminders.slice(0, MAX_REMINDERS),
    weeklyChallengeReminder: {
      enabled: typeof weekly.enabled === 'boolean' ? weekly.enabled : defaults.weeklyChallengeReminder.enabled,
      weekday: isWeekday(weekly.weekday) ? weekly.weekday : defaults.weeklyChallengeReminder.weekday,
      time: isValidTime(weekly.time) ? weekly.time : defaults.weeklyChallengeReminder.time,
    },
    questCompletion: typeof input.questCompletion === 'boolean' ? input.questCompletion : defaults.questCompletion,
    levelUp: typeof input.levelUp === 'boolean' ? input.levelUp : defaults.levelUp,
    quietHours: {
      enabled: typeof quiet.enabled === 'boolean' ? quiet.enabled : defaults.quietHours.enabled,
      start: isValidTime(quiet.start) ? quiet.start : defaults.quietHours.start,
      end: isValidTime(quiet.end) ? quiet.end : defaults.quietHours.end,
    },
  };
}
