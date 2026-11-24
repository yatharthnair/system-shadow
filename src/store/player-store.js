import { create } from 'zustand';

import { DEFAULT_PLAYER_PROFILE } from '@/features/player/player-model';
import { loadPlayerProfile } from '@/features/player/player-repository';
import {
  buildProgressionSnapshot,
  createInitialProgressionState,
} from '@/features/progression/progression-engine';
import { buildNoticesFromEvents } from '@/features/progression/progression-notices';
import { awardXp, loadProgression } from '@/features/progression/progression-service';

import { useSystemNoticeStore } from './system-notice-store';

/**
 * Global player state for the UI. Holds a derived progression *snapshot*; the source of truth
 * is SQLite, reached only through the progression service. Components never compute levels.
 */
export const usePlayerStore = create((set, get) => ({
  ...DEFAULT_PLAYER_PROFILE,
  progression: buildProgressionSnapshot(createInitialProgressionState()),
  /** 'idle' | 'loading' | 'ready' | 'error' */
  hydrationStatus: 'idle',
  hydrationError: null,

  hydrate: async () => {
    if (get().hydrationStatus === 'loading') return;
    set({ hydrationStatus: 'loading', hydrationError: null });
    try {
      const [profile, { state }] = await Promise.all([loadPlayerProfile(), loadProgression()]);
      set({ ...profile, progression: buildProgressionSnapshot(state), hydrationStatus: 'ready' });
    } catch (error) {
      set({ hydrationStatus: 'error', hydrationError: error });
    }
  },

  /**
   * Awards XP through the engine (exactly once per `id`), refreshes the snapshot from what was
   * committed, and queues level-up / attribute notices.
   * @param {Parameters<typeof awardXp>[0]} rewardInput
   */
  /** Re-reads name and equipped title (e.g. after a title is equipped, earned or revoked). */
  refreshProfile: async () => {
    set(await loadPlayerProfile());
  },

  awardXp: async (rewardInput) => {
    const outcome = await awardXp(rewardInput);
    get().applyProgressionOutcome(outcome);
    return outcome;
  },

  /**
   * Syncs the snapshot with a committed progression outcome (from an award, a reversal, or a
   * quest completion/undo) and queues any level-up / attribute notices it produced.
   */
  applyProgressionOutcome: (outcome) => {
    if (!outcome) return;
    set({ progression: buildProgressionSnapshot(outcome.state) });
    useSystemNoticeStore.getState().publishNotices(buildNoticesFromEvents(outcome.events));
  },
}));
