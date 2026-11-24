import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';

import { BootErrorView } from '@/components/system/boot-error-view';
import { SystemNoticeHost } from '@/components/system/system-notice-host';
import { Colors, FontFamily } from '@/constants/theme';
import { configureNotificationHandler } from '@/features/notifications/notification-scheduler';
import { retryAppBootstrap, useAppBootstrap } from '@/hooks/use-app-bootstrap';

SplashScreen.preventAutoHideAsync();
configureNotificationHandler();

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.highlight,
    background: Colors.background,
    card: Colors.background,
    text: Colors.textPrimary,
    border: Colors.border,
  },
};

const stackScreenOptions = {
  contentStyle: { backgroundColor: Colors.background },
  headerStyle: { backgroundColor: Colors.background },
  headerShadowVisible: false,
  headerTintColor: Colors.highlight,
  headerTitleStyle: { fontFamily: FontFamily.displayBold, fontSize: 20, color: Colors.textPrimary },
  headerBackButtonDisplayMode: 'minimal',
};

export default function RootLayout() {
  const { isReady, error } = useAppBootstrap();

  // The native splash screen stays visible until bootstrap settles.
  if (!isReady) return null;

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style="light" />
      {error ? (
        <BootErrorView error={error} onRetry={retryAppBootstrap} />
      ) : (
        <View style={styles.root}>
          <Stack screenOptions={stackScreenOptions}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="settings" options={{ title: 'Settings' }} />
            <Stack.Screen name="quest/new" options={{ presentation: 'modal', headerShown: false }} />
            <Stack.Screen name="quest/[questId]" options={{ presentation: 'modal', headerShown: false }} />
            <Stack.Screen name="quest/history" options={{ title: 'Quest Log' }} />
            <Stack.Screen name="inventory" options={{ title: 'Inventory' }} />
            <Stack.Screen name="analytics" options={{ title: 'Analytics' }} />
            <Stack.Screen
              name="item/[itemKey]"
              options={{
                presentation: 'formSheet',
                headerShown: false,
                sheetAllowedDetents: [0.55],
                sheetGrabberVisible: true,
                contentStyle: { backgroundColor: Colors.backgroundElevated },
              }}
            />
          </Stack>
          <SystemNoticeHost />
        </View>
      )}
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
});
