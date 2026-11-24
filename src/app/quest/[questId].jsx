import { useLocalSearchParams } from 'expo-router';

import { QuestEditor } from '@/components/quests/quest-editor';
import { QuestEmptyState } from '@/components/quests/quest-empty-state';
import { useQuestStore } from '@/store/quest-store';

export default function EditQuestScreen() {
  const { questId } = useLocalSearchParams();
  const quest = useQuestStore((state) => state.quests.find((candidate) => candidate.id === questId));

  if (!quest) {
    return <QuestEmptyState title="Quest not found" message="It may have been archived." />;
  }
  // `key` resets the form if the route is reused for a different quest.
  return <QuestEditor key={quest.id} quest={quest} />;
}
