export function formatNumber(value) {
  return value.toLocaleString('en-US');
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/** Zero-pads to a fixed width, e.g. formatLevel(7) → "07". */
export function padNumber(value, width = 2) {
  return String(value).padStart(width, '0');
}

/** Compact countdown, e.g. "5h 12m", "2d 4h", "45m", "<1m". */
export function formatTimeUntil(target, now = new Date()) {
  const totalMinutes = Math.floor((target.getTime() - now.getTime()) / 60_000);
  if (totalMinutes < 1) return '<1m';
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

const WEEKDAY_FORMAT = new Intl.DateTimeFormat('en-US', { weekday: 'short' });
const DAY_HEADING_FORMAT = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
const TIME_FORMAT = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' });

export function formatWeekdayShort(date) {
  return WEEKDAY_FORMAT.format(date);
}

export function formatDayHeading(date) {
  return DAY_HEADING_FORMAT.format(date);
}

export function formatTimeOfDay(date) {
  return TIME_FORMAT.format(date);
}
