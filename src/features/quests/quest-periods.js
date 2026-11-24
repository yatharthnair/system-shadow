/**
 * Calendar helpers in the device's local time zone. All arithmetic goes through
 * year/month/day components (never "+ 24h"), so DST transitions can't shift a day.
 */

const pad = (value) => String(value).padStart(2, '0');

/** Local calendar date key, e.g. "2026-11-25". */
export function toLocalDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Parses a "YYYY-MM-DD" key into local midnight of that day. */
export function parseLocalDateKey(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Local midnight at the start of `date`'s day. */
export function startOfLocalDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Local midnight `days` calendar days after `date`'s day. */
export function addLocalDays(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** ISO weekday: 1 = Monday … 7 = Sunday. */
export function getIsoWeekday(date) {
  return date.getDay() === 0 ? 7 : date.getDay();
}

/** Local midnight on the Monday that starts `date`'s ISO week. */
export function startOfIsoWeek(date) {
  return addLocalDays(date, 1 - getIsoWeekday(date));
}

/**
 * ISO-8601 week key, e.g. "2026-W48". Weeks start Monday; week 1 contains the year's first
 * Thursday, so late-December days can belong to next year's W01 and early-January days to W52/W53.
 */
export function toIsoWeekKey(date) {
  // Work in UTC on the local calendar date so DST can't skew the day count.
  const calendarDay = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  calendarDay.setUTCDate(calendarDay.getUTCDate() + 4 - getIsoWeekday(date)); // Thursday of this week
  const isoYear = calendarDay.getUTCFullYear();
  const firstOfYear = Date.UTC(isoYear, 0, 1);
  const week = Math.floor((calendarDay.getTime() - firstOfYear) / 86_400_000 / 7) + 1;
  return `${isoYear}-W${pad(week)}`;
}
