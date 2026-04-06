import GlobalErrorBanner from '@/components/GlobalErrorBanner';
import { loadCoordinates } from '@/services/coordinates-store';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { InteractionManager } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  useEffect(() => {
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
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="news/[id]" options={{ title: 'Новость' }} />
      </Stack>
      <GlobalErrorBanner />
    </SafeAreaProvider>
  );
}
