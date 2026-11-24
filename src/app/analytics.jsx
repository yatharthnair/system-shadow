import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import {
  AttributesSection,
  CategorySection,
  CompletionRateSection,
  FitnessSection,
  NutritionSection,
  SocialSection,
  StreakSection,
  XpSection,
} from '@/components/analytics/analytics-sections';
import { StatTile } from '@/components/charts/stat-tile';
import { SegmentedControl } from '@/components/common/segmented-control';
import { QuestEmptyState } from '@/components/quests/quest-empty-state';
import { Colors, ComponentTokens, Spacing } from '@/constants/theme';
import { ANALYTICS_RANGES } from '@/features/analytics/analytics-engine';
import { useAnalyticsStore } from '@/store/analytics-store';
import { formatNumber } from '@/utils/format';

const RANGE_OPTIONS = ANALYTICS_RANGES.map((days) => ({ value: String(days), label: `${days} days` }));

export default function AnalyticsScreen() {
  const analytics = useAnalyticsStore((state) => state.analytics);
  const rangeDays = useAnalyticsStore((state) => state.rangeDays);
  const status = useAnalyticsStore((state) => state.status);
  const error = useAnalyticsStore((state) => state.error);
  const load = useAnalyticsStore((state) => state.load);
  const setRange = useAnalyticsStore((state) => state.setRange);

  // Reload whenever the screen is shown, so it reflects the latest activity.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (status === 'error') return <QuestEmptyState title="Couldn’t load analytics" message={error?.message ?? ''} />;
  if (!analytics) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.highlight} />
      </View>
    );
  }

  const hasActivity = analytics.xp.total > 0 || analytics.totalCompletions > 0;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
      <SegmentedControl
        options={RANGE_OPTIONS}
        value={String(rangeDays)}
        onChange={(value) => setRange(Number(value))}
        accessibilityLabel="Time range"
      />

      <View style={styles.tiles}>
        <StatTile
          label="XP earned"
          value={formatNumber(analytics.xp.total)}
          delta={analytics.xp.changeRatio}
          deltaLabel={`vs prior ${rangeDays}d`}
        />
        <StatTile
          label="Daily rate"
          value={analytics.completionRates.dailyAverage == null ? '—' : `${Math.round(analytics.completionRates.dailyAverage * 100)}%`}
        />
        <StatTile label="Streak" value={`${analytics.streaks.current}d`} />
      </View>

      {!hasActivity ? (
        <QuestEmptyState title="No activity in this range" message="Clear quests and your progress will be charted here." />
      ) : null}

      <XpSection xp={analytics.xp} rangeDays={rangeDays} />
      <CompletionRateSection completionRates={analytics.completionRates} />
      <FitnessSection fitness={analytics.fitness} rangeDays={rangeDays} />
      <NutritionSection nutrition={analytics.nutrition} rangeDays={rangeDays} />
      <SocialSection social={analytics.social} />
      <AttributesSection attributes={analytics.attributes} />
      <CategorySection categories={analytics.categories} totalCompletions={analytics.totalCompletions} />
      <StreakSection streaks={analytics.streaks} rangeDays={rangeDays} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  root: { flex: 1, backgroundColor: Colors.background },
  content: { padding: ComponentTokens.screen.horizontalPadding, gap: Spacing.lg, paddingBottom: Spacing.xxxl * 2 },
  tiles: { flexDirection: 'row', gap: Spacing.sm },
});
