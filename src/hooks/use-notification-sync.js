import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { subscribeToActivityEvents } from '@/store/activity-events';
import { useNotificationStore } from '@/store/notification-store';
import { useQuestStore } from '@/store/quest-store';
import { useRewardStore } from '@/store/reward-store';

const RESYNC_DEBOUNCE_MS = 800;

function warn(error) {
  console.warn('[notifications]', error);
}

function openNotificationTarget(response) {
  const url = response?.notification.request.content.data?.url;
  if (typeof url === 'string' && url.startsWith('/')) router.push(url);
}

/**
 * Keeps local notifications in step with the app: loads settings, reschedules (debounced) whenever
 * quests, rewards or settings change, re-checks permission when the app returns to the foreground,
 * sends quest-completion / level-up notifications, and opens the right screen when one is tapped.
 * Mount once, inside the navigator.
 */
export function useNotificationSync() {
  useEffect(() => {
    let resyncTimer;
    const scheduleResync = () => {
      clearTimeout(resyncTimer);
      resyncTimer = setTimeout(() => useNotificationStore.getState().resync().catch(warn), RESYNC_DEBOUNCE_MS);
    };

    useNotificationStore.getState().hydrate().then(scheduleResync, warn);

    const unsubscribers = [
      useQuestStore.subscribe((state, previous) => state.board !== previous.board && scheduleResync()),
      useRewardStore.subscribe((state, previous) => state.overview !== previous.overview && scheduleResync()),
      useNotificationStore.subscribe((state, previous) => state.permission !== previous.permission && scheduleResync()),
      subscribeToActivityEvents((event) => useNotificationStore.getState().notifyActivity(event).catch(warn)),
    ];

    // Permission can change in iOS Settings while the app is in the background.
    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') useNotificationStore.getState().refreshPermission().catch(warn);
    });

    // A notification tapped while the app was closed launched it…
    const launchResponse = Notifications.getLastNotificationResponse();
    if (launchResponse) {
      openNotificationTarget(launchResponse);
      Notifications.clearLastNotificationResponse();
    }
    // …or one tapped while it was running.
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      openNotificationTarget(response);
      Notifications.clearLastNotificationResponse();
    });

    return () => {
      clearTimeout(resyncTimer);
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      appStateSubscription.remove();
      responseSubscription.remove();
    };
  }, []);
}
