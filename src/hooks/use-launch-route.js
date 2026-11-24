import { router } from 'expo-router';
import { useEffect } from 'react';
import { Platform, Settings } from 'react-native';

/**
 * QA hook for screenshot automation: when the app is launched with the iOS launch argument
 * `-SSInitialRoute /some/route` (e.g. `xcrun simctl launch <device> <bundle> -SSInitialRoute /quests`),
 * it opens that route. Launch arguments can only be passed by Xcode / simctl, so this is inert for
 * users and avoids iOS's "Open in app?" prompt that custom-scheme deep links trigger.
 */
export function useLaunchRoute() {
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    const route = Settings.get('SSInitialRoute');
    if (typeof route === 'string' && route.startsWith('/')) {
      // Defer one tick so the navigator is mounted.
      setTimeout(() => router.push(route), 0);
    }
  }, []);
}
