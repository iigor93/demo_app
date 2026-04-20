import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const PRIMARY_RED = '#ED3237';

export default function NewsDetail() {
  const insets = useSafeAreaInsets();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { name, description, image } = useLocalSearchParams<{
    id?: string;
    name?: string;
    description?: string;
    image?: string;
    updated_at?: string;
  }>();

  const hasImage = Boolean(image);

  const handleBackPress = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/(tabs)/explore');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: false,
          contentStyle: {
            backgroundColor: '#111111',
          },
        }}
      />
      <StatusBar style="light" translucent backgroundColor="transparent" />

      <View style={styles.container}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom + 24, 32) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.hero, !hasImage && styles.heroWithoutImage]}>
            {hasImage ? (
              <Image
                source={{ uri: image }}
                style={styles.heroImage}
                contentFit="cover"
              />
            ) : (
              <View style={styles.heroFallback} />
            )}

            <Pressable
              style={styles.backButton}
              onPress={handleBackPress}
              hitSlop={12}
            >
              <Ionicons name="chevron-back" size={30} color="#FFFFFF" />
            </Pressable>
          </View>

          <Text style={styles.title}>{name || 'Новость'}</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Условия</Text>
            <View style={styles.textCard}>
              <Text style={styles.description}>
                {description || 'Описание новости пока недоступно.'}
              </Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionButtonPressed,
            ]}
            onPress={() => setIsModalVisible(true)}
          >
            <Text style={styles.actionButtonText}>Открыть окно</Text>
          </Pressable>
        </ScrollView>
      </View>

      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setIsModalVisible(false)}
          />

          <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom + 16, 24) }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Это модальное окно</Text>
            <Text style={styles.modalText}>
              Оно открывается из нижней части экрана и закрывается по кнопке
              или по тапу вне окна.
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.modalButton,
                pressed && styles.actionButtonPressed,
              ]}
              onPress={() => setIsModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Закрыть</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
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
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  hero: {
    position: 'relative',
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#1A1A1A',
    marginBottom: 24,
  },
  heroWithoutImage: {
    aspectRatio: undefined,
    height: 88,
    marginBottom: 20,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroFallback: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '800',
    marginBottom: 28,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: '#6F6F6F',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '500',
  },
  textCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
  },
  description: {
    color: '#F2F2F2',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  actionButton: {
    marginTop: 24,
    marginBottom: 8,
    backgroundColor: PRIMARY_RED,
    borderRadius: 18,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  actionButtonPressed: {
    opacity: 0.88,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalSheet: {
    minHeight: '46%',
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 72,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#5E5E5E',
    marginBottom: 24,
  },
  modalTitle: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    marginBottom: 16,
  },
  modalText: {
    color: '#F2F2F2',
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 28,
  },
  modalButton: {
    backgroundColor: PRIMARY_RED,
    borderRadius: 18,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
  },
});
