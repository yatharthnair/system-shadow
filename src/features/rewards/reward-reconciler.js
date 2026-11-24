import { generateWeeklyChallenges } from '@/features/challenges/weekly-challenges';
import { ATTRIBUTE_KEYS } from '@/features/progression/attributes';
import { buildProgressionSnapshot, DEFAULT_PROGRESSION_RULES } from '@/features/progression/progression-engine';
import { readProgressionState } from '@/features/progression/progression-repository';
import {
  applyXpRewardInTransaction,
  reverseXpTransactionInTransaction,
} from '@/features/progression/progression-service';
import { createXpReward } from '@/features/progression/xp-reward';
import { toIsoWeekKey } from '@/features/quests/quest-periods';

import { buildActivityFacts } from './activity-facts';
import {
  countCustomQuestsCreated,
  countUnlocksForSource,
  getEquippedTitleId,
  insertInventoryItem,
  insertUnlock,
  insertWeeklyChallenges,
  listActiveCompletionsForRewards,
  listActiveQuestCategories,
  listActiveUnlocks,
  listWeeklyChallenges,
  revokeUnlock,
  setEquippedTitleId,
} from './reward-repository';
import { diffRewards, evaluateRewards } from './reward-evaluation';

/**
 * Reward XP can itself raise the player's level, which can earn level-based rewards, so
 * reconciliation repeats until nothing changes. Each pass only grants or only reduces in one
 * direction per source, so it converges quickly; the cap guards against a catalog bug.
 */
const MAX_RECONCILE_PASSES = 12;

/** Generates and stores this week's challenges the first time the week is seen. */
export async function ensureWeeklyChallenges(txn, now) {
  const weekKey = toIsoWeekKey(now);
  const existing = await listWeeklyChallenges(txn, weekKey);
  if (existing.length > 0) return existing;

  const categories = await listActiveQuestCategories(txn);
  await insertWeeklyChallenges(txn, weekKey, generateWeeklyChallenges(weekKey, categories), now.toISOString());
  return listWeeklyChallenges(txn, weekKey);
}

/** Reads everything needed to judge rewards at `now`, inside the open transaction. */
export async function readRewardInputs(txn, now, rules = DEFAULT_PROGRESSION_RULES) {
  const [completions, customQuestsCreated, progressionState, activeUnlocks, weeklyChallenges] = [
    await listActiveCompletionsForRewards(txn),
    await countCustomQuestsCreated(txn),
    await readProgressionState(txn, ATTRIBUTE_KEYS),
    await listActiveUnlocks(txn),
    await listWeeklyChallenges(txn, toIsoWeekKey(now)),
  ];
  const progression = buildProgressionSnapshot(progressionState, rules);
  const facts = buildActivityFacts({ completions, customQuestsCreated, progression, now });
  const otherWeekChallengeKeys = activeUnlocks
    .filter((unlock) => unlock.kind === 'challenge' && !unlock.sourceKey.startsWith(`challenge:${facts.week.weekKey}:`))
    .map((unlock) => unlock.sourceKey);

  return { facts, progressionState, activeUnlocks, weeklyChallenges, otherWeekChallengeKeys };
}

async function revokeReward(txn, unlock, now, rules, progressionEvents) {
  if (unlock.xpTransactionId) {
    const reversal = await reverseXpTransactionInTransaction(txn, unlock.xpTransactionId, rules);
    progressionEvents.push(...reversal.events);
  }
  await revokeUnlock(txn, unlock.id, now.toISOString());
}

async function grantReward(txn, reward, now, rules, progressionEvents) {
  const attempt = (await countUnlocksForSource(txn, reward.sourceKey)) + 1;
  const unlockId = `${reward.sourceKey}#${attempt}`;
  const unlockedAt = now.toISOString();

  // The unlock row references its XP transaction, so award first (same transaction: atomic).
  let xpTransactionId = null;
  if (reward.xp > 0) {
    const xpReward = createXpReward({ id: `reward:${unlockId}`, source: reward.kind, xp: reward.xp });
    const outcome = await applyXpRewardInTransaction(txn, xpReward, rules);
    if (outcome.status !== 'applied') throw new Error(`Reward XP ${xpReward.id} was already applied`);
    xpTransactionId = xpReward.id;
    progressionEvents.push(...outcome.events);
  }

  await insertUnlock(txn, {
    id: unlockId,
    sourceKey: reward.sourceKey,
    kind: reward.kind,
    title: reward.title,
    description: reward.description,
    xpReward: reward.xp,
    xpTransactionId,
    titleReward: reward.titleId,
    unlockedAt,
  });
  for (const [index, itemKey] of reward.itemKeys.entries()) {
    await insertInventoryItem(txn, { id: `${unlockId}:${index}:${itemKey}`, unlockId, itemKey, acquiredAt: unlockedAt });
  }
  return unlockId;
}

/** Unequips the player's title if no active unlock grants it any more. */
async function ensureEquippedTitleIsOwned(txn) {
  const equippedTitleId = await getEquippedTitleId(txn);
  if (!equippedTitleId) return;
  const ownedTitles = new Set((await listActiveUnlocks(txn)).map((unlock) => unlock.titleReward).filter(Boolean));
  if (!ownedTitles.has(equippedTitleId)) await setEquippedTitleId(txn, null);
}

/**
 * Brings stored unlocks in line with what the player's activity has earned: grants newly earned
 * rewards (XP exactly once, items, titles) and revokes rewards no longer earned (e.g. after a quest
 * undo), reversing their XP. Run inside the same exclusive transaction as the activity change.
 *
 * @returns {Promise<{ events: Array<{ type: 'reward-unlocked' | 'reward-revoked', reward: object }>,
 *   progressionEvents: object[], state: object }>}
 */
export async function reconcileRewardsInTransaction(txn, now, rules = DEFAULT_PROGRESSION_RULES) {
  await ensureWeeklyChallenges(txn, now);
  const events = [];
  const progressionEvents = [];

  for (let pass = 0; pass < MAX_RECONCILE_PASSES; pass += 1) {
    const { facts, activeUnlocks, weeklyChallenges, otherWeekChallengeKeys } = await readRewardInputs(txn, now, rules);
    const { earned } = evaluateRewards(facts, { weeklyChallenges, otherWeekChallengeKeys });
    const { toGrant, toRevoke } = diffRewards(earned, activeUnlocks, facts.week.weekKey);

    if (toGrant.length === 0 && toRevoke.length === 0) {
      if (events.some((event) => event.type === 'reward-revoked')) await ensureEquippedTitleIsOwned(txn);
      const state = await readProgressionState(txn, ATTRIBUTE_KEYS);
      return { events, progressionEvents, state };
    }

    for (const unlock of toRevoke) {
      await revokeReward(txn, unlock, now, rules, progressionEvents);
      events.push({ type: 'reward-revoked', reward: unlock });
    }
    for (const reward of toGrant) {
      const unlockId = await grantReward(txn, reward, now, rules, progressionEvents);
      events.push({ type: 'reward-unlocked', reward: { ...reward, unlockId } });
    }
  }

  throw new Error('Reward reconciliation did not converge');
}
