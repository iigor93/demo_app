import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NewsItem, fetchNews } from '@/services/api';

const SKELETON_ITEMS_COUNT = 5;

export default function Screen2() {
  const insets = useSafeAreaInsets();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNews = useCallback(async () => {
    try {
      const newsData = await fetchNews();
      setNews(newsData);
    } catch {
      setNews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNews();
    setRefreshing(false);
  }, [loadNews]);

  const handleBackPress = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="light" translucent backgroundColor="transparent" />

      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={handleBackPress}
            hitSlop={12}
          >
            <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.headerTitle}>Новости</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom + 20, 32) },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FFFFFF"
              progressViewOffset={8}
            />
          }
        >
          {loading ? (
            Array.from({ length: SKELETON_ITEMS_COUNT }).map((_, index) => (
              <View key={index} style={styles.skeletonCard} />
            ))
          ) : news.length > 0 ? (
            news.map((item) => {
              const formattedDate = formatNewsDate(item.updated_at);

              return (
                <Pressable
                  key={item.id}
                  style={({ pressed }) => [
                    styles.card,
                    pressed && styles.cardPressed,
                  ]}
                  onPress={() => {
                    router.push({
                      pathname: '/news/[id]',
                      params: {
                        id: item.id,
                        name: item.name,
                        description: item.description,
                        image: item.image ?? '',
                        updated_at: item.updated_at,
                      },
                    });
                  }}
                >
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={styles.cardDescription} numberOfLines={4}>
                    {item.description}
                  </Text>
                  <Text style={styles.cardDate}>{formattedDate}</Text>
                </Pressable>
              );
            })
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Новостей пока нет</Text>
              <Text style={styles.emptyDescription}>
                Потяни экран вниз, чтобы попробовать загрузить данные снова.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function formatNewsDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#111111',
  },
  container: {
    flex: 1,
    backgroundColor: '#111111',
  },
  header: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 8,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
    marginHorizontal: 8,
  },
  headerSpacer: {
    width: 32,
    height: 32,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: 16,
    paddingHorizontal: 16,
    gap: 8,
  },
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    minHeight: 92,
  },
  cardPressed: {
    opacity: 0.86,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  cardDescription: {
    color: '#DCDCDC',
    fontSize: 14,
    lineHeight: 16,
  },
  cardDate: {
    alignSelf: 'flex-end',
    marginTop: 8,
    color: '#7E7E7E',
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '400',
  },
  skeletonCard: {
    height: 116,
    borderRadius: 16,
    backgroundColor: '#1A1A1A',
    opacity: 0.7,
  },
  emptyCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyDescription: {
    color: '#DCDCDC',
    fontSize: 14,
    lineHeight: 18,
  },
});
