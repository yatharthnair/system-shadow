import * as Notifications from 'expo-notifications';
import { IosAuthorizationStatus } from 'expo-notifications';

import { NOTIFICATION_ID_PREFIX } from './notification-planner';

/**
 * The only module that talks to expo-notifications. Local notifications only: nothing leaves the device.
 */

/** Event notifications (completion, level-up) arrive while the app is open, where a cinematic already
 * plays, so they go silently to Notification Center. Reminders show normally. */
export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const kind = notification.request.content.data?.kind;
      const isActivityEvent = kind === 'quest-completed' || kind === 'level-up';
      return {
        shouldShowBanner: !isActivityEvent,
        shouldShowList: true,
        shouldPlaySound: !isActivityEvent,
        shouldSetBadge: false,
      };
    },
  });
}

/**
 * @returns {Promise<{ state: 'granted' | 'provisional' | 'denied' | 'undetermined', canAskAgain: boolean }>}
 */
export async function getPermissionState() {
  return toPermissionState(await Notifications.getPermissionsAsync());
}

/** Shows the iOS permission prompt (only if it hasn't been answered yet). */
export async function requestPermission() {
  return toPermissionState(
    await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowSound: true, allowBadge: false } }),
  );
}

function toPermissionState(response) {
  const iosStatus = response.ios?.status;
  let state = response.status;
  if (iosStatus === IosAuthorizationStatus.PROVISIONAL || iosStatus === IosAuthorizationStatus.EPHEMERAL) {
    state = 'provisional';
  } else if (iosStatus === IosAuthorizationStatus.AUTHORIZED) {
    state = 'granted';
  } else if (iosStatus === IosAuthorizationStatus.DENIED) {
    state = 'denied';
  } else if (iosStatus === IosAuthorizationStatus.NOT_DETERMINED) {
    state = 'undetermined';
  }
  return { state, canAskAgain: response.canAskAgain };
}

export const canDeliver = (permission) => permission.state === 'granted' || permission.state === 'provisional';

/**
 * Makes the OS schedule match `plan`: cancels this app's stale notifications, schedules missing
 * ones, and leaves unchanged ones alone (no churn). Notifications from elsewhere are untouched.
 * @returns {Promise<{ scheduled: number, cancelled: number, kept: number }>}
 */
export async function syncScheduledNotifications(plan) {
  const existing = (await Notifications.getAllScheduledNotificationsAsync()).filter((request) =>
    request.identifier.startsWith(NOTIFICATION_ID_PREFIX),
  );
  const fingerprint = (identifier, fireAt, body) => `${identifier}|${fireAt}|${body}`;
  const planned = new Map(plan.map((item) => [item.identifier, item]));
  const existingFingerprints = new Set(
    existing.map((request) => fingerprint(request.identifier, request.content.data?.fireAt, request.content.body)),
  );

  let cancelled = 0;
  for (const request of existing) {
    const item = planned.get(request.identifier);
    const isCurrent = item && request.content.data?.fireAt === item.fireAt.getTime() && request.content.body === item.body;
    if (!isCurrent) {
      await Notifications.cancelScheduledNotificationAsync(request.identifier);
      cancelled += 1;
    }
  }

  let scheduled = 0;
  for (const item of plan) {
    if (existingFingerprints.has(fingerprint(item.identifier, item.fireAt.getTime(), item.body))) continue;
    await Notifications.scheduleNotificationAsync({
      identifier: item.identifier,
      content: { title: item.title, body: item.body, data: { ...item.data, fireAt: item.fireAt.getTime() } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: item.fireAt },
    });
    scheduled += 1;
  }

  return { scheduled, cancelled, kept: plan.length - scheduled };
}

/** Cancels every notification this app scheduled (e.g. when notifications are turned off). */
export async function cancelAllAppNotifications() {
  return syncScheduledNotifications([]);
}

/** Delivers a notification immediately. */
export async function presentNotificationNow(notification) {
  await Notifications.scheduleNotificationAsync({
    content: { title: notification.title, body: notification.body, data: notification.data },
    trigger: null,
  });
}
