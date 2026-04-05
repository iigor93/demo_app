import GlobalErrorBanner from '@/components/GlobalErrorBanner';
import { loadCoordinates } from '@/services/coordinates-store';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  useEffect(() => {
    loadCoordinates().catch(() => undefined);
  }, []);

  return (
    <SafeAreaProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="news/[id]" options={{ title: 'Новость' }} />
      </Stack>
      <GlobalErrorBanner />
    </SafeAreaProvider>
  );
}
