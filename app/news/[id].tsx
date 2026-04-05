import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { logInfo } from '@/services/logs';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const IMAGE_HEIGHT = SCREEN_HEIGHT / 4;

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function NewsDetail() {
  const { id, name, description, image, updated_at } = useLocalSearchParams<{
    id: string;
    name: string;
    description: string;
    image: string;
    updated_at: string;
  }>();

  useEffect(() => {
    logInfo('Экран новости открыт', {
      id,
      name,
      updated_at,
    });
  }, [id, name, updated_at]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {!!image && (
        <Image
          source={{ uri: image }}
          style={[styles.image, { height: IMAGE_HEIGHT }]}
          contentFit="cover"
        />
      )}
      <View style={styles.body}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.description}>{description}</Text>
        <Text style={styles.date}>{formatDate(updated_at)}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  image: {
    width: '100%',
  },
  body: {
    padding: 16,
    flexGrow: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
    marginBottom: 24,
  },
  date: {
    fontSize: 13,
    color: '#888',
    marginTop: 'auto',
  },
});
