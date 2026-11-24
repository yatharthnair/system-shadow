import {
  addLocalDays,
  getIsoWeekday,
  startOfIsoWeek,
  startOfLocalDay,
  toIsoWeekKey,
  toLocalDateKey,
} from './quest-periods';

export const ONCE_PERIOD_KEY = 'once';

/**
 * The period a quest can be completed in at `now`, or null if it isn't scheduled then.
 * A quest can have at most one active completion per period; a new period = a reset.
 *
 * @returns {null | { periodKey: string, startsAt: Date | null, endsAt: Date | null }}
 */
export function getQuestPeriod(quest, now) {
  switch (quest.cadence) {
    case 'daily':
      return { periodKey: toLocalDateKey(now), startsAt: startOfLocalDay(now), endsAt: addLocalDays(now, 1) };

    case 'weekly': {
      const weekStart = startOfIsoWeek(now);
      return { periodKey: toIsoWeekKey(now), startsAt: weekStart, endsAt: addLocalDays(weekStart, 7) };
    }

    case 'weekdays':
      if (!quest.weekdays?.includes(getIsoWeekday(now))) return null;
      return { periodKey: toLocalDateKey(now), startsAt: startOfLocalDay(now), endsAt: addLocalDays(now, 1) };

    case 'once':
      return { periodKey: ONCE_PERIOD_KEY, startsAt: null, endsAt: null };

    default:
      return null;
  }
}

/** For a `weekdays` quest not scheduled today: local midnight of its next scheduled day. */
export function getNextScheduledDate(quest, now) {
  if (quest.cadence !== 'weekdays' || !quest.weekdays?.length) return null;
  for (let offset = 1; offset <= 7; offset += 1) {
    const candidate = addLocalDays(now, offset);
    if (quest.weekdays.includes(getIsoWeekday(candidate))) return candidate;
  }
  return null;
}

/**
 * A completion can be undone only while its period is still current. One-time quests have no
 * period, so they can be undone until the end of the local day they were completed.
 * After that the completion is history and its XP is settled.
 */
export function canUndoCompletion(quest, completion, now) {
  if (completion.undoneAt) return false;
  if (quest.cadence === 'once') return isCompletedToday(completion, now);
  return getQuestPeriod(quest, now)?.periodKey === completion.periodKey;
}

export function isCompletedToday(completion, now) {
  return toLocalDateKey(new Date(completion.completedAt)) === toLocalDateKey(now);
}
