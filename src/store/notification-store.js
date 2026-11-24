import { create } from 'zustand';

import { buildEventNotification, planScheduledNotifications } from '@/features/notifications/notification-planner';
import {
  cancelAllAppNotifications,
  canDeliver,
  getPermissionState,
  presentNotificationNow,
  requestPermission,
  syncScheduledNotifications,
} from '@/features/notifications/notification-scheduler';
import { DEFAULT_NOTIFICATION_SETTINGS, normalizeNotificationSettings } from '@/features/notifications/notification-settings';
import { loadNotificationSettings, saveNotificationSettings } from '@/features/notifications/notification-settings-service';

import { useQuestStore } from './quest-store';
import { useRewardStore } from './reward-store';

/** Inputs the planner needs, read from the quest and reward stores. */
function readPlannerInputs() {
  const { board, quests } = useQuestStore.getState();
  const remainingToday = board.filter((item) => item.status === 'available' && item.quest.cadence !== 'weekly');
  const challenges = useRewardStore.getState().overview?.challenges ?? null;
  return {
    quests,
    today: {
      remainingCount: remainingToday.length,
      remainingXp: remainingToday.reduce((sum, item) => sum + item.xpReward, 0),
    },
    weeklyChallenges: challenges && {
      incomplete: challenges.filter((challenge) => !challenge.unlock).length,
      total: challenges.length,
      endsAt: challenges[0]?.endsAt,
    },
  };
}

/**
 * Notification preferences and OS permission. Settings persist in SQLite; scheduling is local.
 * Permission is requested only when the player turns notifications on.
 */
export const useNotificationStore = create((set, get) => ({
  settings: DEFAULT_NOTIFICATION_SETTINGS,
  /** { state: 'granted' | 'provisional' | 'denied' | 'undetermined', canAskAgain: boolean } */
  permission: { state: 'undetermined', canAskAgain: true },
  status: 'idle',
  /** Notifications currently scheduled by the app (next 7 days). */
  scheduledCount: 0,

  hydrate: async () => {
    set({ status: 'loading' });
    const [settings, permission] = await Promise.all([loadNotificationSettings(), getPermissionState()]);
    set({ settings, permission, status: 'ready' });
  },

  refreshPermission: async () => {
    set({ permission: await getPermissionState() });
  },

  /**
   * Master switch. Turning on asks iOS for permission if it hasn't been asked yet; if permission is
   * refused, notifications stay off. Turning off cancels everything scheduled.
   * @returns {Promise<{ enabled: boolean, blocked: boolean }>}
   */
  setEnabled: async (enabled) => {
    let { permission } = get();
    if (enabled && permission.state === 'undetermined') {
      permission = await requestPermission();
      set({ permission });
    }
    const blocked = enabled && !canDeliver(permission);
    await get().updateSettings((settings) => ({ ...settings, enabled: enabled && !blocked }));
    return { enabled: enabled && !blocked, blocked };
  },

  /** Applies a settings change (validated), saves it and reschedules. */
  updateSettings: async (updater) => {
    const next = normalizeNotificationSettings(updater(get().settings));
    set({ settings: next });
    const saved = await saveNotificationSettings(next);
    set({ settings: saved });
    await get().resync();
  },

  /** Rebuilds the next 7 days of reminders from current data and syncs them with iOS. */
  resync: async () => {
    const { settings, permission } = get();
    if (!settings.enabled || !canDeliver(permission)) {
      await cancelAllAppNotifications();
      set({ scheduledCount: 0 });
      return;
    }
    const plan = planScheduledNotifications({ settings, now: new Date(), ...readPlannerInputs() });
    await syncScheduledNotifications(plan);
    set({ scheduledCount: plan.length });
  },

  /** Immediate notification for an activity event, if enabled and outside quiet hours. */
  notifyActivity: async (event) => {
    const { settings, permission } = get();
    if (!canDeliver(permission)) return;
    const notification = buildEventNotification(event, settings, new Date());
    if (notification) await presentNotificationNow(notification);
  },
}));
