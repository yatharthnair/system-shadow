import { ITEMS_BY_KEY } from './items-catalog';
import { TITLES_BY_ID } from './titles-catalog';

function describeRewardLoot(reward) {
  return {
    xp: reward.xp,
    items: reward.itemKeys.map((key) => ITEMS_BY_KEY[key]).filter(Boolean),
    title: reward.titleId ? TITLES_BY_ID[reward.titleId] : null,
  };
}

/**
 * Turns reward reconciliation events into system notices:
 * - 'boss-defeated' (cinematic) per boss defeated
 * - 'achievement-unlocked' (cinematic) grouping every achievement unlocked by one action
 * - 'reward-banner' (compact) for challenges, boss milestones and level milestones
 * - 'reward-banner' (muted) listing rewards revoked by an undo
 */
export function buildRewardNotices(events) {
  const notices = [];
  const unlocked = events.filter((event) => event.type === 'reward-unlocked').map((event) => event.reward);
  const revoked = events.filter((event) => event.type === 'reward-revoked').map((event) => event.reward);

  for (const reward of unlocked) {
    if (reward.kind === 'boss_milestone' && reward.milestone === 100) {
      notices.push({ kind: 'boss-defeated', bossId: reward.refId, title: reward.title, subtitle: reward.description, loot: describeRewardLoot(reward) });
    }
  }

  const achievements = unlocked.filter((reward) => reward.kind === 'achievement');
  if (achievements.length > 0) {
    notices.push({
      kind: 'achievement-unlocked',
      achievements: achievements.map((reward) => ({
        id: reward.refId,
        title: reward.title,
        description: reward.description,
        tier: reward.tier,
        loot: describeRewardLoot(reward),
      })),
    });
  }

  const bannerLines = unlocked
    .filter((reward) => reward.kind === 'challenge' || reward.kind === 'level_milestone' || (reward.kind === 'boss_milestone' && reward.milestone !== 100))
    .map((reward) => ({ key: reward.sourceKey, title: reward.title, xp: reward.xp }));
  if (bannerLines.length > 0) {
    notices.push({ kind: 'reward-banner', tone: 'reward', heading: 'System · Rewards', lines: bannerLines });
  }

  if (revoked.length > 0) {
    notices.push({
      kind: 'reward-banner',
      tone: 'muted',
      heading: 'System · Rewards revoked',
      lines: revoked.map((unlock) => ({ key: unlock.sourceKey, title: unlock.title, xp: -unlock.xpReward })),
    });
  }

  return notices;
}
