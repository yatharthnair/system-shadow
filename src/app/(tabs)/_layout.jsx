import { Tabs } from 'expo-router';
import { Crosshair, ScrollText, Swords, Trophy, UserRound } from 'lucide-react-native';

import { SystemTabBar } from '@/components/navigation/system-tab-bar';
import { Colors } from '@/constants/theme';

const ICON_STROKE_WIDTH = 1.75;

/** Adapts a Lucide icon to React Navigation's `tabBarIcon` signature. */
function tabIcon(Icon) {
  return function TabIcon({ color, size }) {
    return <Icon color={color} size={size} strokeWidth={ICON_STROKE_WIDTH} />;
  };
}

function renderTabBar(props) {
  return <SystemTabBar {...props} />;
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={renderTabBar}
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        sceneStyle: { backgroundColor: Colors.background },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Status', tabBarIcon: tabIcon(Crosshair) }} />
      <Tabs.Screen name="quests" options={{ title: 'Quests', tabBarIcon: tabIcon(ScrollText) }} />
      <Tabs.Screen name="player" options={{ title: 'Player', tabBarIcon: tabIcon(UserRound) }} />
      <Tabs.Screen name="challenges" options={{ title: 'Trials', tabBarIcon: tabIcon(Swords) }} />
      <Tabs.Screen name="achievements" options={{ title: 'Feats', tabBarIcon: tabIcon(Trophy) }} />
    </Tabs>
  );
}
