import { canUndoCompletion, getNextScheduledDate, getQuestPeriod } from '../quest-schedule';

const daily = { cadence: 'daily' };
const weekly = { cadence: 'weekly' };
const monWedFri = { cadence: 'weekdays', weekdays: [1, 3, 5] };
const once = { cadence: 'once' };

const wednesdayNoon = new Date(2026, 10, 25, 12);
const thursdayNoon = new Date(2026, 10, 26, 12);

describe('getQuestPeriod', () => {
  test('daily: period is the local day, ending at next midnight', () => {
    expect(getQuestPeriod(daily, wednesdayNoon)).toEqual({
      periodKey: '2026-11-25',
      startsAt: new Date(2026, 10, 25),
      endsAt: new Date(2026, 10, 26),
    });
  });

  test('daily: resets exactly at local midnight', () => {
    expect(getQuestPeriod(daily, new Date(2026, 10, 25, 23, 59, 59, 999)).periodKey).toBe('2026-11-25');
    expect(getQuestPeriod(daily, new Date(2026, 10, 26, 0, 0)).periodKey).toBe('2026-11-26');
  });

  test('weekly: period is the ISO week, ending Monday 00:00', () => {
    expect(getQuestPeriod(weekly, wednesdayNoon)).toEqual({
      periodKey: '2026-W48',
      startsAt: new Date(2026, 10, 23),
      endsAt: new Date(2026, 10, 30),
    });
  });

  test('specific days: available only on chosen weekdays', () => {
    expect(getQuestPeriod(monWedFri, wednesdayNoon).periodKey).toBe('2026-11-25');
    expect(getQuestPeriod(monWedFri, thursdayNoon)).toBeNull();
  });

  test('one-time: a single permanent period', () => {
    expect(getQuestPeriod(once, wednesdayNoon)).toEqual({ periodKey: 'once', startsAt: null, endsAt: null });
  });
});

describe('getNextScheduledDate', () => {
  test('finds the next chosen weekday, wrapping into next week', () => {
    expect(getNextScheduledDate(monWedFri, thursdayNoon)).toEqual(new Date(2026, 10, 27)); // Fri
    expect(getNextScheduledDate(monWedFri, new Date(2026, 10, 28))).toEqual(new Date(2026, 10, 30)); // Sat → Mon
  });
});

describe('canUndoCompletion', () => {
  const dailyCompletion = { periodKey: '2026-11-25', completedAt: new Date(2026, 10, 25, 9).toISOString(), undoneAt: null };

  test('allowed during the same period', () => {
    expect(canUndoCompletion(daily, dailyCompletion, new Date(2026, 10, 25, 23, 59))).toBe(true);
  });

  test('closed once the period ends', () => {
    expect(canUndoCompletion(daily, dailyCompletion, new Date(2026, 10, 26, 0, 0))).toBe(false);
  });

  test('weekly completions can be undone until the week ends', () => {
    const completion = { periodKey: '2026-W48', completedAt: new Date(2026, 10, 23, 8).toISOString(), undoneAt: null };
    expect(canUndoCompletion(weekly, completion, new Date(2026, 10, 29, 23, 59))).toBe(true);
    expect(canUndoCompletion(weekly, completion, new Date(2026, 10, 30, 0, 0))).toBe(false);
  });

  test('one-time completions can be undone until the end of that day', () => {
    const completion = { periodKey: 'once', completedAt: new Date(2026, 10, 25, 9).toISOString(), undoneAt: null };
    expect(canUndoCompletion(once, completion, new Date(2026, 10, 25, 22))).toBe(true);
    expect(canUndoCompletion(once, completion, new Date(2026, 10, 26, 1))).toBe(false);
  });

  test('never for an already-undone completion', () => {
    expect(canUndoCompletion(daily, { ...dailyCompletion, undoneAt: 'x' }, wednesdayNoon)).toBe(false);
  });
});
