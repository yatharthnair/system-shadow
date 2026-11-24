import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { GlowPanel } from '@/components/common/glow-panel';
import { BorderWidth, Colors, Glow, Radius, Spacing } from '@/constants/theme';
import { RANKS } from '@/features/progression/progression-config';
import { selectProgression } from '@/store/player-selectors';
import { usePlayerStore } from '@/store/player-store';

/** All hunter ranks with their level requirements; reached ranks light up, current one glows. */
export function RankLadder({ entranceIndex }) {
  const { rank: currentRank, level } = usePlayerStore(selectProgression);
  const currentIndex = RANKS.findIndex((rank) => rank.id === currentRank);

  return (
    <GlowPanel entranceIndex={entranceIndex} style={styles.panel}>
      <View style={styles.row}>
        {RANKS.map((rank, index) => {
          const isReached = index <= currentIndex;
          const isCurrent = index === currentIndex;
          return (
            <View key={rank.id} style={styles.step} accessible accessibilityLabel={`Rank ${rank.id}, level ${rank.minimumLevel}${isCurrent ? ', current' : ''}`}>
              <View style={[styles.cell, isReached && styles.cellReached, isCurrent && styles.cellCurrent]}>
                <AppText variant="heading" color={isCurrent ? 'highlightLight' : isReached ? 'textPrimary' : 'textMuted'} style={styles.rank} adjustsFontSizeToFit numberOfLines={1}>
                  {rank.id}
                </AppText>
              </View>
              <AppText variant="caption" color="textMuted" style={styles.level}>
                {rank.minimumLevel}
              </AppText>
            </View>
          );
        })}
      </View>
      <AppText variant="caption" color="textMuted">
        Level {level} · rank is set by your level.
      </AppText>
    </GlowPanel>
  );
}

const styles = StyleSheet.create({
  panel: { gap: Spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.xxs },
  step: { flex: 1, alignItems: 'center', gap: Spacing.xxs },
  cell: {
    width: '100%',
    aspectRatio: 1,
    maxWidth: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.xs,
    borderWidth: BorderWidth.thin,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceRaised,
  },
  cellReached: { borderColor: Colors.borderStrong, backgroundColor: Colors.surfacePressed },
  cellCurrent: { borderColor: Colors.highlight, backgroundColor: Colors.highlightSoft, boxShadow: Glow.soft },
  rank: { fontSize: 13, lineHeight: 16 },
  level: { fontSize: 10, fontVariant: ['tabular-nums'] },
});
