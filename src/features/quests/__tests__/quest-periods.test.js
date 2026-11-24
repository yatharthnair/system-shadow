import {
  addLocalDays,
  getIsoWeekday,
  parseLocalDateKey,
  startOfIsoWeek,
  toIsoWeekKey,
  toLocalDateKey,
} from '../quest-periods';

// Tests run in America/New_York (see jest globalSetup). Months are 0-based in `new Date(y, m, d)`.

describe('toLocalDateKey', () => {
  test('last millisecond of a day and first of the next are different days', () => {
    expect(toLocalDateKey(new Date(2026, 10, 25, 23, 59, 59, 999))).toBe('2026-11-25');
    expect(toLocalDateKey(new Date(2026, 10, 26, 0, 0, 0, 0))).toBe('2026-11-26');
  });

  test('uses local time, not UTC', () => {
    // 2026-11-26T03:00Z is still 22:00 on the 25th in New York.
    expect(toLocalDateKey(new Date('2026-11-26T03:00:00Z'))).toBe('2026-11-25');
  });

  test('round-trips through parseLocalDateKey', () => {
    expect(toLocalDateKey(parseLocalDateKey('2026-03-08'))).toBe('2026-03-08');
  });
});

describe('DST transitions', () => {
  test('spring forward (23-hour day) still advances exactly one calendar day', () => {
    const dayBefore = new Date(2026, 2, 7, 12); // Sat 7 Mar 2026; DST starts 8 Mar 02:00
    expect(toLocalDateKey(addLocalDays(dayBefore, 1))).toBe('2026-03-08');
    expect(toLocalDateKey(addLocalDays(dayBefore, 2))).toBe('2026-03-09');
    const springDay = addLocalDays(dayBefore, 1);
    expect(addLocalDays(springDay, 1) - springDay).toBe(23 * 3_600_000);
  });

  test('fall back (25-hour day) still advances exactly one calendar day', () => {
    const fallDay = new Date(2026, 10, 1); // Sun 1 Nov 2026; DST ends 02:00
    expect(addLocalDays(fallDay, 1) - fallDay).toBe(25 * 3_600_000);
    expect(toLocalDateKey(addLocalDays(fallDay, 1))).toBe('2026-11-02');
    expect(toLocalDateKey(new Date(2026, 10, 1, 23, 30))).toBe('2026-11-01');
  });
});

describe('ISO weeks', () => {
  test('weekday numbering is Monday = 1 … Sunday = 7', () => {
    expect(getIsoWeekday(new Date(2026, 10, 23))).toBe(1); // Monday
    expect(getIsoWeekday(new Date(2026, 10, 29))).toBe(7); // Sunday
  });

  test('Sunday 23:59 and Monday 00:00 are in different weeks', () => {
    expect(toIsoWeekKey(new Date(2026, 10, 29, 23, 59, 59, 999))).toBe('2026-W48');
    expect(toIsoWeekKey(new Date(2026, 10, 30, 0, 0))).toBe('2026-W49');
  });

  test('week starts on Monday at local midnight', () => {
    const start = startOfIsoWeek(new Date(2026, 10, 27, 18)); // Friday
    expect(start).toEqual(new Date(2026, 10, 23));
  });

  test.each([
    [new Date(2025, 11, 29), '2026-W01'], // Monday 29 Dec 2025 belongs to 2026's first week
    [new Date(2026, 0, 1), '2026-W01'],
    [new Date(2026, 11, 31), '2026-W53'], // 2026 has 53 ISO weeks
    [new Date(2027, 0, 3), '2026-W53'], // Sunday 3 Jan 2027 is still 2026-W53
    [new Date(2027, 0, 4), '2027-W01'],
    [new Date(2024, 11, 30), '2025-W01'],
    [new Date(2021, 0, 3), '2020-W53'],
  ])('%s → %s across year boundaries', (date, expected) => {
    expect(toIsoWeekKey(date)).toBe(expected);
  });

  test('a week containing a DST change is still one week', () => {
    expect(toIsoWeekKey(new Date(2026, 2, 2))).toBe(toIsoWeekKey(new Date(2026, 2, 8, 23, 59)));
    expect(toIsoWeekKey(new Date(2026, 2, 9))).not.toBe(toIsoWeekKey(new Date(2026, 2, 8)));
  });
});
