import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  GlobalBannerState,
  dismissGlobalBanner,
  useGlobalBanner,
} from '@/services/global-banner';

const AUTO_HIDE_DELAY_MS = 5000;
const HIDDEN_TRANSLATE_Y = -220;
const DISMISS_SWIPE_THRESHOLD = -40;

export default function GlobalErrorBanner() {
  const insets = useSafeAreaInsets();
  const activeBanner = useGlobalBanner();
  const [renderedBanner, setRenderedBanner] = useState<GlobalBannerState | null>(null);
  const renderedBannerRef = useRef<GlobalBannerState | null>(null);
  const translateY = useRef(new Animated.Value(HIDDEN_TRANSLATE_Y)).current;
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const animateOut = useCallback(
    (bannerId?: string) => {
      clearHideTimer();
      Animated.timing(translateY, {
        toValue: HIDDEN_TRANSLATE_Y,
        duration: 180,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) {
          return;
        }

        setRenderedBanner((currentBanner) => {
          if (!currentBanner || (bannerId && currentBanner.id !== bannerId)) {
            return currentBanner;
          }

          return null;
        });

        dismissGlobalBanner(bannerId);
      });
    },
    [clearHideTimer, translateY]
  );

  useEffect(() => {
    renderedBannerRef.current = renderedBanner;
  }, [renderedBanner]);

  useEffect(() => {
    if (!activeBanner) {
      if (renderedBannerRef.current) {
        animateOut(renderedBannerRef.current.id);
      }

      return;
    }

    setRenderedBanner(activeBanner);
    clearHideTimer();
    translateY.stopAnimation();
    translateY.setValue(HIDDEN_TRANSLATE_Y);
    Animated.spring(translateY, {
      toValue: 0,
      damping: 20,
      stiffness: 220,
      mass: 0.9,
      useNativeDriver: true,
    }).start();

    hideTimerRef.current = setTimeout(() => {
      animateOut(activeBanner.id);
    }, AUTO_HIDE_DELAY_MS);

    return clearHideTimer;
  }, [activeBanner, animateOut, clearHideTimer, translateY]);

  useEffect(
    () => () => {
      clearHideTimer();
    },
    [clearHideTimer]
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dy) > 6 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
        onPanResponderMove: (_, gestureState) => {
          if (gestureState.dy < 0) {
            translateY.setValue(gestureState.dy);
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          if (!renderedBanner) {
            return;
          }

          if (gestureState.dy <= DISMISS_SWIPE_THRESHOLD) {
            animateOut(renderedBanner.id);
            return;
          }

          Animated.spring(translateY, {
            toValue: 0,
            damping: 20,
            stiffness: 220,
            mass: 0.9,
            useNativeDriver: true,
          }).start();
        },
        onPanResponderTerminate: () => {
          Animated.spring(translateY, {
            toValue: 0,
            damping: 20,
            stiffness: 220,
            mass: 0.9,
            useNativeDriver: true,
          }).start();
        },
      }),
    [animateOut, renderedBanner, translateY]
  );

  if (!renderedBanner) {
    return null;
  }

  return (
    <View pointerEvents="box-none" style={styles.root}>
      <Animated.View
        pointerEvents="box-none"
        style={[
          styles.container,
          {
            paddingTop: insets.top + 8,
            transform: [{ translateY }],
          },
        ]}
      >
        <Pressable
          accessibilityRole="alert"
          style={styles.banner}
          onPress={() => animateOut(renderedBanner.id)}
          {...panResponder.panHandlers}
        >
          <Text style={styles.title}>{renderedBanner.message}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
  container: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  banner: {
    width: '100%',
    maxWidth: 560,
    backgroundColor: '#d62828',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 14,
  },
  title: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
