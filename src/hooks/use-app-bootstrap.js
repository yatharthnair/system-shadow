import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { FontAssets } from '@/constants/theme';
import { usePlayerStore } from '@/store/player-store';
import { useQuestStore } from '@/store/quest-store';
import { useRewardStore } from '@/store/reward-store';

const isSettled = (status) => status === 'ready' || status === 'error';

/** Loads fonts, the database, player progression, quests and rewards, then hides the splash screen. */
export function useAppBootstrap() {
  const [fontsLoaded, fontError] = useFonts(FontAssets);
  const playerStatus = usePlayerStore((state) => state.hydrationStatus);
  const playerError = usePlayerStore((state) => state.hydrationError);
  const questStatus = useQuestStore((state) => state.status);
  const questError = useQuestStore((state) => state.error);
  const rewardStatus = useRewardStore((state) => state.status);
  const rewardError = useRewardStore((state) => state.error);

  useEffect(() => {
    retryAppBootstrap();
  }, []);

  // Fall back to system fonts rather than blocking launch if a font fails to load.
  const fontsSettled = fontsLoaded || Boolean(fontError);
  const isReady = fontsSettled && isSettled(playerStatus) && isSettled(questStatus) && isSettled(rewardStatus);

  useEffect(() => {
    if (isReady) SplashScreen.hideAsync();
  }, [isReady]);

  return { isReady, error: playerError ?? questError ?? rewardError };
}

/** (Re)loads persisted state. Safe to call again after a failure. */
export async function retryAppBootstrap() {
  await Promise.all([usePlayerStore.getState().hydrate(), useQuestStore.getState().hydrate()]);
  // Rewards reconcile against the loaded quests and XP, so they load last.
  await useRewardStore.getState().hydrate();
}
