import { ACHIEVEMENTS, getAchievementSourceKey } from '@/features/achievements/achievements-catalog';
import { BOSS_MILESTONES, BOSSES, getBossMilestoneXp } from '@/features/bosses/bosses-catalog';
import { getChallengeProgress, getChallengeSourceKey } from '@/features/challenges/weekly-challenges';

import { getLevelMilestoneSourceKey, LEVEL_MILESTONES } from './level-milestones';
import { REWARD_TIERS } from './reward-tiers';

/**
 * Decides which rewards the player has earned. Pure: facts in, rewards out.
 *
 * A reward: { sourceKey, kind, title, description, xp, itemKeys, titleId, tier?, refId }
 *   - sourceKey identifies the reward source (at most one active unlock per source).
 *
 * @param {object} facts from buildActivityFacts
 * @param {object} context
 * @param {Array<object>} context.weeklyChallenges this week's stored challenges
 * @param {Array<string>} context.otherWeekChallengeKeys active challenge unlock keys from other weeks (settled history)
 * @returns {{ earned: Map<string, object>, progress: Map<string, { current: number, target: number }> }}
 */
export function evaluateRewards(facts, { weeklyChallenges, otherWeekChallengeKeys }) {
  const earned = new Map();
  const progress = new Map();
  const earn = (reward) => earned.set(reward.sourceKey, reward);

  // Weekly challenges (current week only; past weeks are settled history).
  let currentWeekCompleted = 0;
  for (const challenge of weeklyChallenges) {
    const sourceKey = getChallengeSourceKey(challenge.weekKey, challenge.challengeId);
    const challengeProgress = getChallengeProgress(challenge, facts.week);
    progress.set(sourceKey, challengeProgress);
    if (challengeProgress.current >= challengeProgress.target) {
      currentWeekCompleted += 1;
      earn({
        sourceKey,
        kind: 'challenge',
        refId: challenge.challengeId,
        title: challenge.title,
        description: challenge.description,
        xp: challenge.xpReward,
        itemKeys: challenge.itemKey ? [challenge.itemKey] : [],
        titleId: null,
      });
    }
  }

  // Boss milestones.
  for (const boss of facts.bossCampaign.bosses) {
    for (const milestone of BOSS_MILESTONES) {
      const sourceKey = `boss:${boss.id}:${milestone}`;
      progress.set(sourceKey, { current: Math.min(boss.damage, (boss.hp * milestone) / 100), target: (boss.hp * milestone) / 100 });
      if (!boss.milestonesReached.includes(milestone)) continue;
      const isDefeat = milestone === 100;
      const bossDefinition = BOSSES.find((candidate) => candidate.id === boss.id);
      earn({
        sourceKey,
        kind: 'boss_milestone',
        refId: boss.id,
        milestone,
        title: isDefeat ? `${boss.name} defeated` : `${boss.name} — ${milestone}%`,
        description: isDefeat ? boss.epithet : `${milestone}% of its HP destroyed.`,
        xp: getBossMilestoneXp(bossDefinition, milestone),
        itemKeys: isDefeat ? [`trophy-${boss.id}`] : milestone === 50 ? [`shard-${boss.id}`] : [],
        titleId: isDefeat ? (bossDefinition.titleId ?? null) : null,
      });
    }
  }

  // Level milestones.
  for (const milestone of LEVEL_MILESTONES) {
    const sourceKey = getLevelMilestoneSourceKey(milestone.level);
    progress.set(sourceKey, { current: Math.min(facts.level, milestone.level), target: milestone.level });
    if (facts.level >= milestone.level) {
      earn({
        sourceKey,
        kind: 'level_milestone',
        refId: String(milestone.level),
        title: `Level ${milestone.level} reward`,
        description: `Reached level ${milestone.level}.`,
        xp: milestone.xp,
        itemKeys: milestone.itemKey ? [milestone.itemKey] : [],
        titleId: null,
      });
    }
  }

  // Achievements (may depend on challenge results above).
  const sweptWeeks = countSweptWeeks(otherWeekChallengeKeys) + (weeklyChallenges.length > 0 && currentWeekCompleted === weeklyChallenges.length ? 1 : 0);
  const achievementFacts = {
    ...facts,
    challengesCompleted: otherWeekChallengeKeys.length + currentWeekCompleted,
    sweptWeeks,
  };
  for (const achievement of ACHIEVEMENTS) {
    const sourceKey = getAchievementSourceKey(achievement.id);
    const achievementProgress = achievement.progress(achievementFacts);
    progress.set(sourceKey, achievementProgress);
    if (achievementProgress.current >= achievementProgress.target) {
      earn({
        sourceKey,
        kind: 'achievement',
        refId: achievement.id,
        tier: achievement.tier,
        title: achievement.title,
        description: achievement.description,
        xp: REWARD_TIERS[achievement.tier].xp,
        itemKeys: achievement.itemKey ? [achievement.itemKey] : [],
        titleId: achievement.titleId ?? null,
      });
    }
  }

  return { earned, progress };
}

/** Weeks (from settled history) in which all three challenges were completed. */
function countSweptWeeks(challengeKeys) {
  const completedPerWeek = new Map();
  for (const key of challengeKeys) {
    const weekKey = key.split(':')[1];
    completedPerWeek.set(weekKey, (completedPerWeek.get(weekKey) ?? 0) + 1);
  }
  return [...completedPerWeek.values()].filter((completed) => completed >= 3).length;
}

/**
 * The difference between what's earned and what's currently unlocked.
 * Challenge unlocks from other weeks are out of scope (settled) and never revoked.
 */
export function diffRewards(earned, activeUnlocks, currentWeekKey) {
  const activeBySource = new Map(activeUnlocks.map((unlock) => [unlock.sourceKey, unlock]));
  const isInScope = (sourceKey) =>
    !sourceKey.startsWith('challenge:') || sourceKey.startsWith(`challenge:${currentWeekKey}:`);

  return {
    toGrant: [...earned.values()].filter((reward) => !activeBySource.has(reward.sourceKey)),
    toRevoke: activeUnlocks.filter((unlock) => isInScope(unlock.sourceKey) && !earned.has(unlock.sourceKey)),
  };
}
