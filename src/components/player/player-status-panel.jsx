import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { GlowPanel } from '@/components/common/glow-panel';
import { ProgressBar } from '@/components/common/progress-bar';
import { Spacing } from '@/constants/theme';
import { selectProgression } from '@/store/player-selectors';
import { usePlayerStore } from '@/store/player-store';
import { formatNumber, padNumber } from '@/utils/format';

import { RankBadge } from './rank-badge';

/** The player's identity, level, rank and XP — the centerpiece of the Dashboard and Player screens. */
export function PlayerStatusPanel({ entranceIndex }) {
  const name = usePlayerStore((state) => state.name);
  const title = usePlayerStore((state) => state.title);
  const progression = usePlayerStore(selectProgression);

  return (
    <GlowPanel highlighted entranceIndex={entranceIndex} style={styles.panel}>
      <View style={styles.identityRow}>
        <View style={styles.identity}>
          <AppText variant="label" color="textMuted">
            Player
          </AppText>
          <AppText variant="title">{name}</AppText>
          <AppText variant="body" color="textSecondary">
            {title}
          </AppText>
        </View>
        <RankBadge rank={progression.rank} />
      </View>

      <View style={styles.levelRow}>
        <AppText variant="label" color="highlight" style={styles.levelPrefix}>
          Lv.
        </AppText>
        <AppText variant="hero" accessibilityLabel={`Level ${progression.level}`}>
          {padNumber(progression.level)}
        </AppText>
      </View>

      <View style={styles.experience}>
        <ProgressBar progress={progression.progress} accessibilityLabel="Experience to next level" />
        <View style={styles.caption}>
          <AppText variant="label" color="textMuted">
            Experience
          </AppText>
          <AppText variant="stat" color="textSecondary" style={styles.captionValue}>
            {progression.isMaxLevel
              ? 'MAX'
              : `${formatNumber(progression.xpIntoLevel)} / ${formatNumber(progression.xpForNextLevel)}`}
          </AppText>
        </View>
        {progression.nextRank ? (
          <AppText variant="caption" color="textMuted">
            Rank {progression.nextRank.id} at Lv. {progression.nextRank.minimumLevel} ·{' '}
            {progression.nextRank.levelsRemaining} level{progression.nextRank.levelsRemaining === 1 ? '' : 's'} to go
          </AppText>
        ) : null}
      </View>
    </GlowPanel>
  );
}

const styles = StyleSheet.create({
  panel: { gap: Spacing.lg },
  identityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  identity: { gap: Spacing.xxs, flexShrink: 1 },
  levelRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.xs },
  levelPrefix: { fontSize: 16 },
  experience: { gap: Spacing.sm },
  caption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  captionValue: { fontSize: 14 },
});
