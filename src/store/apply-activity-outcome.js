import { buildNoticesFromEvents } from '@/features/progression/progression-notices';
import { buildRewardNotices } from '@/features/rewards/reward-notices';

import { usePlayerStore } from './player-store';
import { useSystemNoticeStore } from './system-notice-store';

/**
 * Syncs the UI with a committed activity outcome (quest completion/undo, quest creation, reward
 * reconciliation): sets the final XP state and queues level-up, achievement and reward notices.
 *
 * @param {{ progression: object | null, rewards: object | null }} outcome
 *   `progression`: the activity's own XP outcome; `rewards`: reconciliation result (final state).
 */
export function applyActivityOutcome({ progression, rewards }) {
  const finalState = rewards?.state ?? progression?.state;
  if (!finalState) return;

  const progressionEvents = [...(progression?.events ?? []), ...(rewards?.progressionEvents ?? [])];
  const progressionNotices = buildNoticesFromEvents(progressionEvents);
  usePlayerStore.getState().applyProgressionOutcome({ state: finalState, events: [] });

  // Show order: level-up → boss defeat → achievements → reward banners → attribute growth.
  const rewardNotices = buildRewardNotices(rewards?.events ?? []);
  const levelUp = progressionNotices.filter((notice) => notice.kind === 'level-up');
  const attributeGrowth = progressionNotices.filter((notice) => notice.kind !== 'level-up');
  useSystemNoticeStore.getState().publishNotices([...levelUp, ...rewardNotices, ...attributeGrowth]);
  if (rewards?.events?.some((event) => event.reward.titleId || event.reward.titleReward)) {
    usePlayerStore.getState().refreshProfile();
  }
}
