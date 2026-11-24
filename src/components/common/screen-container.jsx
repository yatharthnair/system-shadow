import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, ComponentTokens, Gradients, Spacing } from '@/constants/theme';
import { useTabBarClearance } from '@/hooks/use-tab-bar-clearance';

/**
 * Scrollable screen body for tab screens: dark gradient background, top safe-area
 * padding (notch / Dynamic Island) and bottom clearance for the floating tab bar.
 */
export function ScreenContainer({ children }) {
  const { top } = useSafeAreaInsets();
  const bottomClearance = useTabBarClearance();

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingTop: top + Spacing.lg, paddingBottom: bottomClearance },
      ]}
      showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
    backgroundImage: Gradients.screen,
  },
  content: {
    paddingHorizontal: ComponentTokens.screen.horizontalPadding,
    gap: ComponentTokens.screen.sectionGap,
  },
});
