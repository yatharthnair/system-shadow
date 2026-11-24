import { useEffect } from 'react';
import { AppState } from 'react-native';

import { addLocalDays } from '@/features/quests/quest-periods';
import { useQuestStore } from '@/store/quest-store';
import { useRewardStore } from '@/store/reward-store';

/** Small delay past midnight so the new period's key is unambiguous. */
const ROLLOVER_GRACE_MS = 1000;

function refreshQuestBoard() {
  Promise.all([useQuestStore.getState().refresh(), useRewardStore.getState().refresh()]).catch((error) =>
    console.warn('[quests] Failed to refresh after period rollover', error),
  );
}

/**
 * Keeps quests and rewards in sync with the calendar: refreshes at each local midnight (daily and
 * weekly resets — and new weekly challenges — all happen then) and whenever the app returns to the
 * foreground, so anything that reset while the app was closed or backgrounded is shown.
 */
export function useQuestPeriodRollover() {
  useEffect(() => {
    let midnightTimer;

    function scheduleNextMidnightRefresh() {
      const now = new Date();
      const nextMidnight = addLocalDays(now, 1);
      midnightTimer = setTimeout(() => {
        refreshQuestBoard();
        scheduleNextMidnightRefresh();
      }, nextMidnight.getTime() - now.getTime() + ROLLOVER_GRACE_MS);
    }

    scheduleNextMidnightRefresh();

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') return;
      // The timer may have been suspended in the background; reschedule from the current time.
      clearTimeout(midnightTimer);
      scheduleNextMidnightRefresh();
      refreshQuestBoard();
    });

    return () => {
      clearTimeout(midnightTimer);
      subscription.remove();
    };
  }, []);
}
