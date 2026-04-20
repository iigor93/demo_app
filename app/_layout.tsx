import GlobalErrorBanner from '@/components/GlobalErrorBanner';
import { loadCoordinates } from '@/services/coordinates-store';
import * as SystemUI from 'expo-system-ui';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { InteractionManager } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  useEffect(() => {
    SystemUI.setBackgroundColorAsync('#111111').catch(() => undefined);

    const task = InteractionManager.runAfterInteractions(() => {
      loadCoordinates().catch(() => undefined);
    });

    return () => {
      task.cancel();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" translucent backgroundColor="transparent" />
      <Stack
        screenOptions={{
          contentStyle: {
            backgroundColor: '#111111',
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <GlobalErrorBanner />
    </SafeAreaProvider>
  );
}
