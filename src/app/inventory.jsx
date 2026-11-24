import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { SegmentedControl } from '@/components/common/segmented-control';
import { ItemTile } from '@/components/inventory/item-tile';
import { LevelMilestoneTrack } from '@/components/inventory/level-milestone-track';
import { RewardLog } from '@/components/inventory/reward-log';
import { TitleList } from '@/components/inventory/title-list';
import { QuestEmptyState } from '@/components/quests/quest-empty-state';
import { Colors, ComponentTokens, Spacing } from '@/constants/theme';
import { usePlayerStore } from '@/store/player-store';
import { useRewardStore } from '@/store/reward-store';

const TABS = [
  { value: 'items', label: 'Items' },
  { value: 'titles', label: 'Titles' },
  { value: 'milestones', label: 'Milestones' },
  { value: 'log', label: 'Log' },
];

export default function InventoryScreen() {
  const { tab: initialTab } = useLocalSearchParams();
  const [tab, setTab] = useState(TABS.some((option) => option.value === initialTab) ? initialTab : 'items');
  const overview = useRewardStore((state) => state.overview);
  const level = usePlayerStore((state) => state.progression.level);

  if (!overview) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.highlight} />
      </View>
    );
  }

  const ownedTitles = overview.titles.filter((title) => title.isOwned).length;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
      <SegmentedControl options={TABS} value={tab} onChange={setTab} accessibilityLabel="Inventory section" />

      {tab === 'items' ? (
        overview.inventory.length > 0 ? (
          <>
            <AppText variant="caption" color="textMuted">
              {overview.inventory.reduce((sum, item) => sum + item.quantity, 0)} items · tap one to inspect
            </AppText>
            <View style={styles.grid}>
              {overview.inventory.map((item) => (
                <ItemTile key={item.key} item={item} />
              ))}
            </View>
          </>
        ) : (
          <QuestEmptyState
            title="Inventory empty"
            message="Clear weekly challenges, damage bosses and reach level milestones to earn items."
          />
        )
      ) : null}

      {tab === 'titles' ? (
        <>
          <AppText variant="caption" color="textMuted">
            {ownedTitles} of {overview.titles.length} titles earned · equip one to show it on your profile
          </AppText>
          <TitleList titles={overview.titles} />
        </>
      ) : null}

      {tab === 'milestones' ? <LevelMilestoneTrack milestones={overview.levelMilestones} currentLevel={level} /> : null}

      {tab === 'log' ? <RewardLog rewards={overview.recentRewards} /> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  root: { flex: 1, backgroundColor: Colors.background },
  content: { padding: ComponentTokens.screen.horizontalPadding, gap: Spacing.lg, paddingBottom: Spacing.xxxl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
