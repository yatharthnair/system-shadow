import { getQuestPeriod } from '@/features/quests/quest-schedule';
import { addLocalDays, getIsoWeekday, startOfIsoWeek, toIsoWeekKey, toLocalDateKey } from '@/features/quests/quest-periods';
import { formatTimeUntil } from '@/utils/format';

import { parseTimeToMinutes } from './notification-settings';
import { isWithinQuietHours } from './quiet-hours';

/** How far ahead reminders are scheduled. The plan is rebuilt whenever data or settings change. */
export const SCHEDULE_HORIZON_DAYS = 7;
/** iOS keeps only the 64 soonest pending local notifications per app; stay safely below. */
export const MAX_SCHEDULED_NOTIFICATIONS = 60;
/** Every notification this app schedules has this identifier prefix, so it never touches others. */
export const NOTIFICATION_ID_PREFIX = 'shadow:';

const ROUTES = { quests: '/quests', challenges: '/challenges', achievements: '/achievements', player: '/player' };

function atLocalTime(day, time) {
  const minutes = parseTimeToMinutes(time);
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), Math.floor(minutes / 60), minutes % 60);
}

const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;

/** Quests on the board on a given day (daily + specific-days quests scheduled then). */
function countQuestsScheduledOn(quests, day) {
  return quests.filter((quest) => !quest.archivedAt && (quest.cadence === 'daily' || quest.cadence === 'weekdays') && getQuestPeriod(quest, day)).length;
}

/**
 * Plans every scheduled (future) notification from settings and current data. Pure.
 *
 * Content is computed now, so reminders are specific ("3 quests left · 120 XP"), and a reminder is
 * skipped when there's nothing to remind about (today's quests all cleared, challenges done).
 * Anything that would fire during quiet hours is skipped. Call again whenever data changes.
 *
 * @param {object} input
 * @param {object} input.settings normalized notification settings
 * @param {Date} input.now
 * @param {Array<object>} input.quests active quest definitions
 * @param {{ remainingCount: number, remainingXp: number }} input.today today's not-yet-cleared daily/custom quests
 * @param {{ incomplete: number, total: number, endsAt: Date } | null} input.weeklyChallenges
 * @returns {Array<{ identifier: string, fireAt: Date, title: string, body: string, data: object }>}
 */
export function planScheduledNotifications({ settings, now, quests, today, weeklyChallenges }) {
  if (!settings.enabled) return [];
  const planned = [];
  const add = (notification) => {
    if (notification.fireAt <= now) return;
    if (isWithinQuietHours(notification.fireAt, settings.quietHours)) return;
    planned.push(notification);
  };

  for (let offset = 0; offset < SCHEDULE_HORIZON_DAYS; offset += 1) {
    const day = addLocalDays(now, offset);
    const dateKey = toLocalDateKey(day);
    const isToday = offset === 0;

    for (const reminder of settings.questReminders) {
      if (!reminder.enabled || !reminder.weekdays.includes(getIsoWeekday(day))) continue;

      let body;
      if (isToday) {
        if (today.remainingCount === 0) continue; // all cleared: nothing to remind about
        body = `${plural(today.remainingCount, 'quest')} left today · ${today.remainingXp} XP on the table.`;
      } else {
        const scheduled = countQuestsScheduledOn(quests, day);
        if (scheduled === 0) continue;
        body = `${plural(scheduled, 'quest')} on today’s board. Clear them to keep your streak alive.`;
      }

      add({
        identifier: `${NOTIFICATION_ID_PREFIX}reminder:${reminder.id}:${dateKey}`,
        fireAt: atLocalTime(day, reminder.time),
        title: `System · ${reminder.label}`,
        body,
        data: { kind: 'quest-reminder', url: ROUTES.quests },
      });
    }
  }

  const weekly = settings.weeklyChallengeReminder;
  if (weekly.enabled && weeklyChallenges) {
    for (const weekOffset of [0, 1]) {
      const weekStart = addLocalDays(startOfIsoWeek(now), weekOffset * 7);
      const fireAt = atLocalTime(addLocalDays(weekStart, weekly.weekday - 1), weekly.time);
      if (fireAt >= addLocalDays(now, SCHEDULE_HORIZON_DAYS)) continue;

      const isThisWeek = weekOffset === 0;
      if (isThisWeek && weeklyChallenges.incomplete === 0) continue;
      const weekEndsAt = addLocalDays(weekStart, 7);

      add({
        identifier: `${NOTIFICATION_ID_PREFIX}weekly:${toIsoWeekKey(weekStart)}`,
        fireAt,
        title: 'System · Weekly Challenges',
        body: isThisWeek
          ? `${weeklyChallenges.incomplete} of ${weeklyChallenges.total} challenges unfinished. Resets in ${formatTimeUntil(weekEndsAt, fireAt)}.`
          : `Weekly challenges reset in ${formatTimeUntil(weekEndsAt, fireAt)}. Finish what you can.`,
        data: { kind: 'weekly-challenge-reminder', url: ROUTES.challenges },
      });
    }
  }

  return planned.sort((a, b) => a.fireAt - b.fireAt).slice(0, MAX_SCHEDULED_NOTIFICATIONS);
}

/**
 * Immediate notification for an activity event, or null if that kind is disabled, notifications
 * are off, or it's quiet hours.
 * @param {{ type: 'quest-completed', title: string, xp: number } | { type: 'level-up', toLevel: number, rankUp: null | { toRank: string } }} event
 */
export function buildEventNotification(event, settings, now) {
  if (!settings.enabled || isWithinQuietHours(now, settings.quietHours)) return null;

  if (event.type === 'quest-completed' && settings.questCompletion) {
    return {
      title: 'Quest Cleared',
      body: `${event.title} · +${event.xp} XP`,
      data: { kind: 'quest-completed', url: ROUTES.quests },
    };
  }
  if (event.type === 'level-up' && settings.levelUp) {
    return {
      title: event.rankUp ? `Rank Up · ${event.rankUp.toRank}` : 'Level Up',
      body: event.rankUp ? `You reached level ${event.toLevel} and rank ${event.rankUp.toRank}.` : `You reached level ${event.toLevel}.`,
      data: { kind: 'level-up', url: ROUTES.player },
    };
  }
  return null;
}
