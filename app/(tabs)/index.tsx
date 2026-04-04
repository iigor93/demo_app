import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Dimensions, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import BannerCarousel from '@/components/BannerCarousel';
import { Banner, NewsItem, fetchBanners, fetchNews } from '@/services/api';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const BANNER_HEIGHT = SCREEN_HEIGHT / 3;

export default function Screen1() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const [bannersData, newsData] = await Promise.allSettled([
      fetchBanners(),
      fetchNews(),
    ]);
    setBanners(bannersData.status === 'fulfilled' ? bannersData.value : []);
    setNews(newsData.status === 'fulfilled' ? newsData.value : []);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
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
              onPress={() =>
                router.push({
                  pathname: '/news/[id]',
                  params: {
                    id: item.id,
                    name: item.name,
                    description: item.description,
                    image: item.image ?? '',
                    updated_at: item.updated_at,
                  },
                })
              }
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
