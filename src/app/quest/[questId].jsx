import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { QuestEditor } from '@/components/quests/quest-editor';
import { SystemButton } from '@/components/common/system-button';
import { QuestEmptyState } from '@/components/quests/quest-empty-state';
import { Colors, Spacing } from '@/constants/theme';
import { useQuestStore } from '@/store/quest-store';

export default function EditQuestScreen() {
  const { questId } = useLocalSearchParams();
  const quest = useQuestStore((state) => state.quests.find((candidate) => candidate.id === questId));

  if (!quest) {
    return (
      <View style={styles.missing}>
        <QuestEmptyState title="Quest not found" message="It may have been archived." />
        <View style={styles.actions}>
          <SystemButton label="Close" onPress={() => router.back()} />
        </View>
      </View>
    );
  }
  // `key` resets the form if the route is reused for a different quest.
  return <QuestEditor key={quest.id} quest={quest} />;
}

const styles = StyleSheet.create({
  missing: { flex: 1, justifyContent: 'center', gap: Spacing.lg, padding: Spacing.xl, backgroundColor: Colors.background },
  actions: { flexDirection: 'row' },
});
