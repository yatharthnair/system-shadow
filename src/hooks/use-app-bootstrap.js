import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { FontAssets } from '@/constants/theme';
import { usePlayerStore } from '@/store/player-store';

/**
 * Loads everything the first screen needs (fonts, database, player state) and
 * hides the splash screen once it's all ready.
 */
export function useAppBootstrap() {
  const [fontsLoaded, fontError] = useFonts(FontAssets);
  const hydrationStatus = usePlayerStore((state) => state.hydrationStatus);
  const hydrationError = usePlayerStore((state) => state.hydrationError);

  useEffect(() => {
    usePlayerStore.getState().hydrate();
  }, []);

  // Fall back to system fonts rather than blocking launch if a font fails to load.
  const fontsSettled = fontsLoaded || Boolean(fontError);
  const isReady = fontsSettled && hydrationStatus !== 'idle' && hydrationStatus !== 'loading';

  useEffect(() => {
    if (isReady) SplashScreen.hideAsync();
  }, [isReady]);

  return { isReady, error: hydrationError };
}
