import { Bell, Database, UserRound } from 'lucide-react-native';
import { ScrollView, StyleSheet } from 'react-native';

import { LockedModulePanel } from '@/components/system/locked-module-panel';
import { Colors, ComponentTokens, Spacing } from '@/constants/theme';

export default function SettingsScreen() {
  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic">
      <LockedModulePanel
        Icon={UserRound}
        title="Profile"
        description="Change your player name."
      />
      <LockedModulePanel
        Icon={Bell}
        title="Reminders"
        description="Daily quest notifications."
      />
      <LockedModulePanel
        Icon={Database}
        title="Data"
        description="Export or reset your progress."
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: {
    padding: ComponentTokens.screen.horizontalPadding,
    gap: ComponentTokens.screen.sectionGap,
    paddingBottom: Spacing.xxxl,
  },
});
