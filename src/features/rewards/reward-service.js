import { runExclusiveWrite } from '@/database/exclusive-write';
import { toIsoWeekKey } from '@/features/quests/quest-periods';

import { buildRewardOverview } from './reward-overview';
import { reconcileRewardsInTransaction, readRewardInputs } from './reward-reconciler';
import { evaluateRewards } from './reward-evaluation';
import {
  getEquippedTitleId,
  isTitleOwned,
  listInventoryItems,
  listRecentUnlocks,
  listWeeklyChallenges,
  setEquippedTitleId,
} from './reward-repository';
import { DEFAULT_TITLE_ID, TITLES_BY_ID } from './titles-catalog';
import { RewardError } from './reward-errors';

const RECENT_REWARDS_LIMIT = 30;

/**
 * Reconciles rewards (so anything earned since last time is granted, and this week's challenges
 * exist) and returns everything the RPG screens show.
 * @returns {Promise<{ overview: object, reconciliation: object }>}
 */
export function loadRewardOverview(now = new Date()) {
  return runExclusiveWrite(async (txn) => {
    const reconciliation = await reconcileRewardsInTransaction(txn, now);
    const { facts, activeUnlocks, otherWeekChallengeKeys } = await readRewardInputs(txn, now);
    const weeklyChallenges = await listWeeklyChallenges(txn, toIsoWeekKey(now));
    const { progress } = evaluateRewards(facts, { weeklyChallenges, otherWeekChallengeKeys });

    const overview = buildRewardOverview({
      facts,
      progress,
      activeUnlocks,
      weeklyChallenges,
      inventoryItems: await listInventoryItems(txn),
      recentUnlocks: await listRecentUnlocks(txn, RECENT_REWARDS_LIMIT),
      equippedTitleId: await getEquippedTitleId(txn),
    });
    return { overview, reconciliation };
  });
}

/** Equips an owned title (or the default). */
export function equipTitle(titleId) {
  return runExclusiveWrite(async (txn) => {
    if (!TITLES_BY_ID[titleId]) throw new RewardError('UNKNOWN_TITLE', `Unknown title "${titleId}"`);
    if (titleId !== DEFAULT_TITLE_ID) {
      if (!(await isTitleOwned(txn, titleId))) throw new RewardError('TITLE_NOT_OWNED', 'You haven’t earned that title yet');
    }
    await setEquippedTitleId(txn, titleId === DEFAULT_TITLE_ID ? null : titleId);
  });
}
