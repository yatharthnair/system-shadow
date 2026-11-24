import { create } from 'zustand';

import { equipTitle, loadRewardOverview } from '@/features/rewards/reward-service';

import { applyActivityOutcome } from './apply-activity-outcome';
import { usePlayerStore } from './player-store';

/**
 * RPG state for the UI: weekly challenges, bosses, achievements, titles, inventory and milestones.
 * Loading also reconciles rewards, so anything earned is granted before it's shown.
 */
export const useRewardStore = create((set, get) => ({
  overview: null,
  /** 'idle' | 'loading' | 'ready' | 'error' */
  status: 'idle',
  error: null,

  hydrate: async () => {
    if (get().status === 'loading') return;
    set({ status: 'loading', error: null });
    try {
      await get().refresh();
      set({ status: 'ready' });
    } catch (error) {
      set({ status: 'error', error });
    }
  },

  refresh: async (now = new Date()) => {
    const { overview, reconciliation } = await loadRewardOverview(now);
    set({ overview });
    applyActivityOutcome({ progression: null, rewards: reconciliation });
  },

  equipTitle: async (titleId) => {
    await equipTitle(titleId);
    await get().refresh();
    await usePlayerStore.getState().refreshProfile();
  },
}));
