import { Image } from 'expo-image';
import { useEffect, useRef } from 'react';
import { Dimensions, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, View } from 'react-native';
import { Banner } from '@/services/api';

interface Props {
  banners: Banner[];
  height: number;
}

const SLIDE_INTERVAL = 5000;

export default function BannerCarousel({ banners, height }: Props) {
  const screenWidth = Dimensions.get('window').width;
  const scrollViewRef = useRef<ScrollView | null>(null);
  const currentIndexRef = useRef(0);

  useEffect(() => {
    if (banners.length <= 1) return;

    currentIndexRef.current = 0;
    scrollViewRef.current?.scrollTo({ x: 0, animated: false });

    const interval = setInterval(() => {
      const next = (currentIndexRef.current + 1) % banners.length;
      scrollViewRef.current?.scrollTo({
        x: screenWidth * next,
        animated: true,
      });
      currentIndexRef.current = next;
    }, SLIDE_INTERVAL);

    return () => {
      clearInterval(interval);
    };
  }, [banners, screenWidth]);

  const handleMomentumScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    currentIndexRef.current = Math.round(offsetX / screenWidth);
  };

  if (banners.length === 0) {
    return <View style={[styles.container, { height }]} />;
  }

  return (
    <View style={[styles.container, { height }]}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
      >
        {banners.map((banner) => (
          <Image
            key={banner.id}
            source={{ uri: banner.image }}
            style={[styles.slide, { width: screenWidth }]}
            contentFit="cover"
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  slide: {
    height: '100%',
  },
});
