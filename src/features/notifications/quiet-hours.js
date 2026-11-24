import { parseTimeToMinutes } from './notification-settings';

/**
 * Whether a moment falls inside quiet hours. Windows may cross midnight (22:00 → 07:00).
 * Start is inclusive, end exclusive. Equal start and end means no quiet hours.
 */
export function isWithinQuietHours(date, quietHours) {
  if (!quietHours?.enabled) return false;
  const start = parseTimeToMinutes(quietHours.start);
  const end = parseTimeToMinutes(quietHours.end);
  if (start === end) return false;

  const minutes = date.getHours() * 60 + date.getMinutes();
  return start < end ? minutes >= start && minutes < end : minutes >= start || minutes < end;
}

/** Whether a daily "HH:MM" time is always inside quiet hours (for settings warnings). */
export function isTimeInQuietHours(time, quietHours) {
  const minutes = parseTimeToMinutes(time);
  return isWithinQuietHours(new Date(2000, 0, 1, Math.floor(minutes / 60), minutes % 60), quietHours);
}
