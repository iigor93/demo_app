import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Dimensions, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import BannerCarousel from '@/components/BannerCarousel';
import { Banner, NewsItem, fetchBanners, fetchNews } from '@/services/api';
import { logError, logInfo } from '@/services/logs';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const BANNER_HEIGHT = SCREEN_HEIGHT / 3;

export default function Screen1() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    logInfo('Начата загрузка данных главного экрана');

    const [bannersData, newsData] = await Promise.allSettled([fetchBanners(), fetchNews()]);

    if (bannersData.status === 'fulfilled') {
      setBanners(bannersData.value);
      logInfo('Баннеры загружены', { count: bannersData.value.length });
    } else {
      setBanners([]);
      logError('Не удалось загрузить баннеры', {
        message: bannersData.reason instanceof Error ? bannersData.reason.message : String(bannersData.reason),
      });
    }

    if (newsData.status === 'fulfilled') {
      setNews(newsData.value);
      logInfo('Новости загружены', { count: newsData.value.length });
    } else {
      setNews([]);
      logError('Не удалось загрузить новости', {
        message: newsData.reason instanceof Error ? newsData.reason.message : String(newsData.reason),
      });
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    logInfo('Пользователь запустил обновление списка');
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    logInfo('Обновление списка завершено');
  }, [loadData]);

  return (
    <View style={styles.container}>
      <View style={styles.bannerContainer}>
        <BannerCarousel banners={banners} height={BANNER_HEIGHT} />
      </View>
      <ScrollView
        style={styles.newsScroll}
        contentContainerStyle={styles.newsContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            progressViewOffset={BANNER_HEIGHT}
          />
        }
      >
        {news.map((item, index) => (
          <View key={item.id}>
            <Pressable
              style={styles.newsItem}
              onPress={() => {
                logInfo('Пользователь открыл новость', {
                  id: item.id,
                  name: item.name,
                });

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
              <Text style={styles.newsName}>{item.name}</Text>
              <Text style={styles.newsDescription} numberOfLines={2}>
                {item.description}
              </Text>
            </Pressable>
            {index < news.length - 1 && <View style={styles.separator} />}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bannerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  newsScroll: {
    flex: 1,
  },
  newsContent: {
    paddingTop: BANNER_HEIGHT,
  },
  newsItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  newsName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  newsDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: '#444',
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 16,
  },
});
