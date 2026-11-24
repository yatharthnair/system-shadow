import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { GlowPanel } from '@/components/common/glow-panel';
import { Spacing } from '@/constants/theme';
import { selectProgression } from '@/store/player-selectors';
import { usePlayerStore } from '@/store/player-store';
import { formatNumber } from '@/utils/format';

function Stat({ label, value }) {
  return (
    <View style={styles.stat} accessible accessibilityLabel={`${label}: ${value}`}>
      <AppText variant="label" color="textMuted">
        {label}
      </AppText>
      <AppText variant="stat">{value}</AppText>
    </View>
  );
}

/** Rank standing and lifetime totals. */
export function RankProgressPanel({ entranceIndex }) {
  const progression = usePlayerStore(selectProgression);
  const { nextRank } = progression;

  return (
    <GlowPanel entranceIndex={entranceIndex} style={styles.panel}>
      <Stat label="Rank" value={progression.rank} />
      <Stat label="Next rank" value={nextRank ? `${nextRank.id} · Lv. ${nextRank.minimumLevel}` : 'Peak'} />
      <Stat label="Lifetime XP" value={formatNumber(progression.totalXp)} />
    </GlowPanel>
  );
}

const styles = StyleSheet.create({
  panel: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md },
  stat: { gap: Spacing.xs },
});
