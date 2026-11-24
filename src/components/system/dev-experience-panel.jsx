import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { GlowPanel } from '@/components/common/glow-panel';
import { SystemButton } from '@/components/common/system-button';
import { Spacing } from '@/constants/theme';
import { usePlayerStore } from '@/store/player-store';

let devRewardCounter = 0;
function createDevRewardId() {
  devRewardCounter += 1;
  return `dev:${Date.now()}:${devRewardCounter}`;
}

/**
 * Development-only controls for exercising the progression engine before the quest engine
 * exists: small and huge rewards, attribute-only XP, and re-sending a reward to see the
 * duplicate guard. Renders nothing in production builds.
 */
export function DevExperiencePanel({ entranceIndex }) {
  const awardXp = usePlayerStore((state) => state.awardXp);
  const lastRewardRef = useRef(null);
  const [lastResult, setLastResult] = useState(null);

  if (!__DEV__) return null;

  async function sendReward(reward) {
    lastRewardRef.current = reward;
    try {
      const outcome = await awardXp(reward);
      setLastResult(outcome.status === 'applied' ? `Applied ${reward.id}` : `Duplicate ignored: ${reward.id}`);
    } catch (error) {
      setLastResult(`Rejected: ${error.message}`);
    }
  }

  return (
    <GlowPanel entranceIndex={entranceIndex} style={styles.panel}>
      <AppText variant="label" color="warning">
        Dev · Progression
      </AppText>
      <View style={styles.buttons}>
        <SystemButton
          label="+60 XP"
          accessibilityHint="Grants 60 XP split between Strength and Agility"
          onPress={() =>
            sendReward({ id: createDevRewardId(), source: 'dev', xp: 60, attributeWeights: { strength: 2, agility: 1 } })
          }
        />
        <SystemButton
          label="+5,000 XP"
          accessibilityHint="Grants enough XP for several level-ups at once"
          onPress={() =>
            sendReward({ id: createDevRewardId(), source: 'dev', xp: 5000, attributeWeights: { discipline: 1, intelligence: 1 } })
          }
        />
      </View>
      <View style={styles.buttons}>
        <SystemButton
          label="+CHA 80"
          accessibilityHint="Grants 80 Charisma XP only"
          onPress={() => sendReward({ id: createDevRewardId(), source: 'dev', attributeXp: { charisma: 80 } })}
        />
        <SystemButton
          label="Resend last"
          accessibilityHint="Sends the previous reward again with the same id to test duplicate prevention"
          onPress={() => lastRewardRef.current && sendReward(lastRewardRef.current)}
        />
      </View>
      {lastResult ? (
        <AppText variant="caption" color="textMuted" numberOfLines={2}>
          {lastResult}
        </AppText>
      ) : null}
    </GlowPanel>
  );
}

const styles = StyleSheet.create({
  panel: { gap: Spacing.md },
  buttons: { flexDirection: 'row', gap: Spacing.sm },
});
