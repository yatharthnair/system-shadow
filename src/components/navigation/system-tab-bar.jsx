import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BorderWidth, Colors, ComponentTokens, Glow, Gradients } from '@/constants/theme';

import { TabBarButton } from './tab-bar-button';

const { height, horizontalInset, bottomGap, radius } = ComponentTokens.tabBar;

/**
 * Floating, glowing bottom navigation. Pass to `<Tabs tabBar={...} />`.
 * Reads each screen's `title`, `tabBarLabel`, `tabBarIcon`, `tabBarAccessibilityLabel`
 * and `tabBarButtonTestID` options, so adding a tab only requires a new `<Tabs.Screen>`.
 */
export function SystemTabBar({ state, descriptors, navigation }) {
  const { bottom } = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={[styles.positioner, { paddingBottom: Math.max(bottom, bottomGap) }]}>
      <View style={styles.bar} accessibilityRole="tablist">
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const label =
            typeof options.tabBarLabel === 'string' ? options.tabBarLabel : (options.title ?? route.name);

          function handlePress() {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          }

          function handleLongPress() {
            navigation.emit({ type: 'tabLongPress', target: route.key });
          }

          return (
            <TabBarButton
              key={route.key}
              label={label}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
              renderIcon={options.tabBarIcon}
              isFocused={isFocused}
              onPress={handlePress}
              onLongPress={handleLongPress}
              testID={options.tabBarButtonTestID}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  positioner: {
    position: 'absolute',
    left: horizontalInset,
    right: horizontalInset,
    bottom: 0,
  },
  bar: {
    height,
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: radius,
    borderWidth: BorderWidth.thin,
    borderColor: Colors.borderGlow,
    backgroundColor: Colors.surface,
    backgroundImage: Gradients.panel,
    boxShadow: `${Glow.soft}, 0 12px 32px 0 rgba(0, 0, 0, 0.6)`,
  },
});
