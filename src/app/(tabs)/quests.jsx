import { router } from 'expo-router';
import { History, Plus } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { IconButton } from '@/components/common/icon-button';
import { ScreenContainer } from '@/components/common/screen-container';
import { ScreenHeader } from '@/components/common/screen-header';
import { QuestEmptyState } from '@/components/quests/quest-empty-state';
import { QuestFilterBar } from '@/components/quests/quest-filter-bar';
import { QuestList } from '@/components/quests/quest-list';
import { QuestSummaryPanel } from '@/components/quests/quest-summary-panel';
import { Spacing } from '@/constants/theme';
import { filterQuestBoard, sortQuestBoard } from '@/features/quests/quest-board';
import { useMinuteClock } from '@/hooks/use-minute-clock';
import { useQuestStore } from '@/store/quest-store';

export default function QuestsScreen() {
  const board = useQuestStore((state) => state.board);
  const filters = useQuestStore((state) => state.filters);
  const now = useMinuteClock();

  const visibleItems = sortQuestBoard(filterQuestBoard(board, filters));
  const isFiltered = filters.group !== 'all' || filters.category != null || filters.hideCompleted;

  return (
    <ScreenContainer>
      <ScreenHeader
        systemCode="Module · 02"
        title="Quests"
        accessory={
          <View style={styles.actions}>
            <IconButton Icon={History} accessibilityLabel="Quest log" onPress={() => router.push('/quest/history')} />
            <IconButton Icon={Plus} accessibilityLabel="New quest" onPress={() => router.push('/quest/new')} />
          </View>
        }
      />
      <QuestSummaryPanel entranceIndex={0} />
      <QuestFilterBar />
      {visibleItems.length > 0 ? (
        <QuestList items={visibleItems} now={now} grouped={filters.group === 'all'} />
      ) : (
        <QuestEmptyState
          title={isFiltered ? 'No quests match' : 'No quests yet'}
          message={isFiltered ? 'Try a different filter.' : 'Tap + to create your first quest.'}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: Spacing.sm },
});
