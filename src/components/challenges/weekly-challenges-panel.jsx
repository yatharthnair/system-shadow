import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { GlowPanel } from '@/components/common/glow-panel';
import { Spacing } from '@/constants/theme';
import { formatTimeUntil } from '@/utils/format';

import { WeeklyChallengeCard } from './weekly-challenge-card';

/** This week's three challenges with completion count and time left. */
export function WeeklyChallengesPanel({ challenges, now, entranceIndex }) {
  const completed = challenges.filter((challenge) => challenge.unlock).length;
  const endsAt = challenges[0]?.endsAt;
  return (
    <GlowPanel highlighted entranceIndex={entranceIndex} style={styles.panel}>
      <View style={styles.header}>
        <AppText variant="label" color="highlight">
          Weekly Challenges · {completed}/{challenges.length}
        </AppText>
        {endsAt ? (
          <AppText variant="caption" color="textMuted">
            Resets in {formatTimeUntil(endsAt, now)}
          </AppText>
        ) : null}
      </View>
      {challenges.map((challenge) => (
        <WeeklyChallengeCard key={challenge.challengeId} challenge={challenge} />
      ))}
      {completed === challenges.length && challenges.length > 0 ? (
        <AppText variant="caption" color="success">
          Every challenge cleared this week.
        </AppText>
      ) : null}
    </GlowPanel>
  );
}

const styles = StyleSheet.create({
  panel: { gap: Spacing.xs },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
});
