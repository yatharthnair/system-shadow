import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { QuestHistoryList } from '@/components/quests/quest-history-list';
import { QuestEmptyState } from '@/components/quests/quest-empty-state';
import { Colors } from '@/constants/theme';
import { useQuestStore } from '@/store/quest-store';

export default function QuestHistoryScreen() {
  const history = useQuestStore((state) => state.history);
  const loadHistory = useQuestStore((state) => state.loadHistory);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  if (history.status === 'error') {
    return <QuestEmptyState title="Couldn’t load the quest log" message={history.error?.message ?? ''} />;
  }
  if (history.status !== 'ready' && history.entries.length === 0) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.highlight} />
      </View>
    );
  }
  return <QuestHistoryList entries={history.entries} totals={history.totals} />;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
});
