import { BOSS_MILESTONES, BOSSES, WEAKNESS_DAMAGE_MULTIPLIER } from './bosses-catalog';

export function getDamageForCompletion(boss, completion) {
  const multiplier = boss.weakness && boss.weakness === completion.category ? WEAKNESS_DAMAGE_MULTIPLIER : 1;
  return Math.round(completion.xpAwarded * multiplier);
}

/**
 * Replays active quest completions (oldest first) against the boss ladder.
 * Pure and deterministic: undoing a completion simply changes the replay.
 *
 * @param {Array<{ id: string, completedAt: string, xpAwarded: number, category: string }>} completions sorted oldest first
 * @returns {{ bosses: Array<object>, activeBossId: string | null, defeatedCount: number, isComplete: boolean }}
 */
export function computeBossCampaign(completions, bosses = BOSSES) {
  const damageByBoss = bosses.map(() => 0);
  const defeatedAtByBoss = bosses.map(() => null);
  let bossIndex = 0;

  for (const completion of completions) {
    if (bossIndex >= bosses.length) break;
    let remainingDamage = getDamageForCompletion(bosses[bossIndex], completion);

    // Overflow carries to the next boss (re-scaled by that boss's own weakness).
    while (remainingDamage > 0 && bossIndex < bosses.length) {
      const boss = bosses[bossIndex];
      const hpLeft = boss.hp - damageByBoss[bossIndex];
      const dealt = Math.min(hpLeft, remainingDamage);
      damageByBoss[bossIndex] += dealt;
      remainingDamage -= dealt;

      if (damageByBoss[bossIndex] >= boss.hp) {
        defeatedAtByBoss[bossIndex] = completion.completedAt;
        bossIndex += 1;
        if (remainingDamage > 0 && bossIndex < bosses.length) {
          // Convert leftover damage back to base XP, then apply the next boss's multiplier.
          const leftoverXp = remainingDamage / (boss.weakness === completion.category ? WEAKNESS_DAMAGE_MULTIPLIER : 1);
          remainingDamage = getDamageForCompletion(bosses[bossIndex], { ...completion, xpAwarded: leftoverXp });
        }
      }
    }
  }

  const bossStates = bosses.map((boss, index) => {
    const damage = damageByBoss[index];
    const progress = damage / boss.hp;
    let status = 'locked';
    if (index < bossIndex) status = 'defeated';
    else if (index === bossIndex) status = 'active';
    return {
      ...boss,
      damage,
      hpRemaining: boss.hp - damage,
      progress,
      status,
      defeatedAt: defeatedAtByBoss[index],
      milestonesReached: BOSS_MILESTONES.filter((milestone) => progress * 100 >= milestone),
    };
  });

  return {
    bosses: bossStates,
    activeBossId: bosses[bossIndex]?.id ?? null,
    defeatedCount: bossIndex,
    isComplete: bossIndex >= bosses.length,
  };
}
