import { useNotificationStore } from './notification-store';
import { usePlayerStore } from './player-store';
import { useQuestStore } from './quest-store';
import { useRewardStore } from './reward-store';
import { useSystemNoticeStore } from './system-notice-store';

/**
 * Re-reads all app state from SQLite in place (after a backup restore), without unmounting
 * navigation. Progression is verified against the ledger and rewards are reconciled on the way.
 */
export async function reloadAppState() {
  useSystemNoticeStore.setState({ queue: [] });
  await usePlayerStore.getState().reload();
  await useQuestStore.getState().refresh();
  await useRewardStore.getState().refresh();
  await useNotificationStore.getState().hydrate();
  await useNotificationStore.getState().resync();
  // Reconciliation after a faithful restore grants nothing; drop any notices it might have queued.
  useSystemNoticeStore.setState({ queue: [] });
}
