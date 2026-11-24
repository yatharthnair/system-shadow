import { Flame } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AchievementTile } from '@/components/achievements/achievement-tile';
import { AppText } from '@/components/common/app-text';
import { GlowPanel } from '@/components/common/glow-panel';
import { ProgressRing } from '@/components/common/progress-ring';
import { ScreenContainer } from '@/components/common/screen-container';
import { ScreenHeader } from '@/components/common/screen-header';
import { SectionLabel } from '@/components/common/section-label';
import { SegmentedControl } from '@/components/common/segmented-control';
import { Colors, Spacing } from '@/constants/theme';
import { useRewardStore } from '@/store/reward-store';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'unlocked', label: 'Unlocked' },
  { value: 'locked', label: 'Locked' },
];

function AchievementSummary({ summary, streak }) {
  return (
    <GlowPanel highlighted entranceIndex={0} style={styles.summary}>
      <ProgressRing progress={summary.unlocked / summary.total} size={88} accessibilityLabel={`${summary.unlocked} of ${summary.total} achievements`}>
        <AppText variant="title">{summary.unlocked}</AppText>
        <AppText variant="caption" color="textMuted">
          / {summary.total}
        </AppText>
      </ProgressRing>
      <View style={styles.summaryText}>
        <AppText variant="label" color="textMuted">
          Achievements
        </AppText>
        <AppText variant="heading">Unlocked automatically as you play.</AppText>
        <View style={styles.streak}>
          <Flame size={16} color={Colors.warning} />
          <AppText variant="caption" color="textSecondary">
            Streak {streak.current} day{streak.current === 1 ? '' : 's'} · best {streak.longest}
          </AppText>
        </View>
      </View>
    </GlowPanel>
  );
}

export default function AchievementsScreen() {
  const overview = useRewardStore((state) => state.overview);
  const [filter, setFilter] = useState('all');

  if (!overview) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.highlight} />
      </View>
    );
  }

  const visible = overview.achievements.filter(
    (achievement) => filter === 'all' || (filter === 'unlocked') === Boolean(achievement.unlockedAt),
  );

  return (
    <ScreenContainer>
      <ScreenHeader systemCode="Module · 05" title="Feats" />
      <AchievementSummary summary={overview.achievementSummary} streak={overview.streak} />
      <SegmentedControl options={FILTERS} value={filter} onChange={setFilter} accessibilityLabel="Achievement filter" />
      {overview.achievementGroups.map((group) => {
        const achievements = visible.filter((achievement) => achievement.group === group.key);
        if (achievements.length === 0) return null;
        const unlocked = achievements.filter((achievement) => achievement.unlockedAt).length;
        return (
          <View key={group.key} style={styles.group}>
            <SectionLabel>{`${group.label}  ${unlocked}/${achievements.length}`}</SectionLabel>
            <View style={styles.grid}>
              {achievements.map((achievement) => (
                <AchievementTile key={achievement.id} achievement={achievement} />
              ))}
            </View>
          </View>
        );
      })}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  summary: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  summaryText: { flex: 1, gap: Spacing.xs },
  streak: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  group: { gap: Spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
