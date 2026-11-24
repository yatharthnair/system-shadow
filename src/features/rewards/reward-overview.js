import { ACHIEVEMENT_GROUPS, ACHIEVEMENTS, getAchievementSourceKey } from '@/features/achievements/achievements-catalog';
import { BOSS_MILESTONES, getBossMilestoneXp } from '@/features/bosses/bosses-catalog';
import { getChallengeSourceKey } from '@/features/challenges/weekly-challenges';
import { addLocalDays, startOfIsoWeek } from '@/features/quests/quest-periods';

import { ITEM_RARITIES, ITEMS_BY_KEY } from './items-catalog';
import { getLevelMilestoneSourceKey, LEVEL_MILESTONES } from './level-milestones';
import { REWARD_TIERS } from './reward-tiers';
import { DEFAULT_TITLE_ID, TITLES } from './titles-catalog';

/**
 * Shapes reward data for the UI. Pure.
 */
export function buildRewardOverview({ facts, progress, activeUnlocks, weeklyChallenges, inventoryItems, recentUnlocks, equippedTitleId }) {
  const unlockBySource = new Map(activeUnlocks.map((unlock) => [unlock.sourceKey, unlock]));
  const weekEndsAt = addLocalDays(startOfIsoWeek(facts.now), 7);

  const challenges = weeklyChallenges.map((challenge) => {
    const sourceKey = getChallengeSourceKey(challenge.weekKey, challenge.challengeId);
    return {
      ...challenge,
      sourceKey,
      progress: progress.get(sourceKey),
      unlock: unlockBySource.get(sourceKey) ?? null,
      endsAt: weekEndsAt,
    };
  });

  const bosses = facts.bossCampaign.bosses.map((boss) => ({
    ...boss,
    milestones: BOSS_MILESTONES.map((milestone) => ({
      milestone,
      xp: getBossMilestoneXp(boss, milestone),
      unlock: unlockBySource.get(`boss:${boss.id}:${milestone}`) ?? null,
    })),
  }));

  const achievements = ACHIEVEMENTS.map((achievement) => {
    const unlock = unlockBySource.get(getAchievementSourceKey(achievement.id)) ?? null;
    const isHidden = achievement.secret && !unlock;
    return {
      id: achievement.id,
      group: achievement.group,
      tier: achievement.tier,
      title: isHidden ? '???' : achievement.title,
      description: isHidden ? 'Secret achievement. Keep playing to discover it.' : achievement.description,
      xp: REWARD_TIERS[achievement.tier].xp,
      titleId: achievement.titleId ?? null,
      isSecret: Boolean(achievement.secret),
      progress: progress.get(getAchievementSourceKey(achievement.id)),
      unlockedAt: unlock?.unlockedAt ?? null,
    };
  });

  const ownedTitleIds = new Set(activeUnlocks.map((unlock) => unlock.titleReward).filter(Boolean));
  ownedTitleIds.add(DEFAULT_TITLE_ID);
  const activeTitleId = equippedTitleId && ownedTitleIds.has(equippedTitleId) ? equippedTitleId : DEFAULT_TITLE_ID;
  const titles = TITLES.map((title) => ({
    ...title,
    isOwned: ownedTitleIds.has(title.id),
    isEquipped: title.id === activeTitleId,
  }));

  const stacks = new Map();
  for (const item of inventoryItems) {
    const definition = ITEMS_BY_KEY[item.itemKey];
    if (!definition) continue;
    const stack = stacks.get(item.itemKey) ?? { ...definition, quantity: 0, firstAcquiredAt: item.acquiredAt };
    stack.quantity += 1;
    stacks.set(item.itemKey, stack);
  }
  const inventory = [...stacks.values()].sort(
    (a, b) => ITEM_RARITIES.indexOf(b.rarity) - ITEM_RARITIES.indexOf(a.rarity) || a.firstAcquiredAt.localeCompare(b.firstAcquiredAt),
  );

  const levelMilestones = LEVEL_MILESTONES.map((milestone) => ({
    ...milestone,
    item: milestone.itemKey ? ITEMS_BY_KEY[milestone.itemKey] : null,
    unlock: unlockBySource.get(getLevelMilestoneSourceKey(milestone.level)) ?? null,
  }));

  return {
    weekKey: facts.week.weekKey,
    challenges,
    bosses,
    activeBoss: bosses.find((boss) => boss.status === 'active') ?? null,
    bossesDefeated: facts.bossCampaign.defeatedCount,
    achievements,
    achievementGroups: ACHIEVEMENT_GROUPS,
    achievementSummary: {
      unlocked: achievements.filter((achievement) => achievement.unlockedAt).length,
      total: achievements.length,
    },
    titles,
    equippedTitleId: activeTitleId,
    inventory,
    levelMilestones,
    nextLevelMilestone: levelMilestones.find((milestone) => !milestone.unlock) ?? null,
    recentRewards: recentUnlocks,
    streak: { current: facts.currentStreak, longest: facts.longestStreak },
  };
}
