import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import type { CoordinatePoint } from '@/services/api';
import { loadCoordinates, useCoordinates } from '@/services/coordinates-store';
import { logInfo } from '@/services/logs';

const DEFAULT_REGION: Region = {
  latitude: 55.751244,
  longitude: 37.618423,
  latitudeDelta: 25,
  longitudeDelta: 25,
};

function buildRegion(points: CoordinatePoint[]): Region {
  if (points.length === 0) {
    return DEFAULT_REGION;
  }

  const latitudes = points.map((point) => point.lat);
  const longitudes = points.map((point) => point.lon);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLon = Math.min(...longitudes);
  const maxLon = Math.max(...longitudes);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLon + maxLon) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * 1.7, 0.08),
    longitudeDelta: Math.max((maxLon - minLon) * 1.7, 0.08),
  };
}

export default function MapScreen() {
  const { points, isLoading, hasLoaded } = useCoordinates();
  const mapRef = useRef<MapView | null>(null);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);

  const selectedPoint = points.find((point) => point.id === selectedPointId) ?? null;

  useEffect(() => {
    logInfo('Экран карты открыт');
  }, []);

  useEffect(() => {
    if (!hasLoaded || points.length === 0 || !mapRef.current) {
      return;
    }

    mapRef.current.animateToRegion(buildRegion(points), 600);
  }, [hasLoaded, points]);

  useEffect(() => {
    if (selectedPointId && !points.some((point) => point.id === selectedPointId)) {
      setSelectedPointId(null);
    }
  }, [points, selectedPointId]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={buildRegion(points)}
        onPress={() => setSelectedPointId(null)}
      >
        {points.map((point) => (
          <Marker
            key={point.id}
            coordinate={{
              latitude: point.lat,
              longitude: point.lon,
            }}
            pinColor={selectedPointId === point.id ? '#c2410c' : '#0f766e'}
            onPress={() => {
              setSelectedPointId(point.id);
              logInfo('Пользователь выбрал точку на карте', {
                id: point.id,
                name: point.name,
              });
            }}
          />
        ))}
      </MapView>

      {isLoading && !hasLoaded ? (
        <View style={styles.infoPanel} pointerEvents="none">
          <ActivityIndicator size="large" color="#0f766e" />
          <Text style={styles.infoText}>Загружаем точки на карте...</Text>
        </View>
      ) : null}

      {!isLoading && hasLoaded && points.length === 0 ? (
        <View style={styles.infoPanel} pointerEvents="none">
          <Text style={styles.emptyTitle}>Точек пока нет</Text>
          <Text style={styles.emptyText}>Когда бэкенд вернет координаты, они появятся здесь.</Text>
        </View>
      ) : null}

      {selectedPoint ? (
        <View style={styles.detailsWrap} pointerEvents="box-none">
          <Pressable style={styles.detailsCard} onPress={() => undefined}>
            <Text style={styles.detailsTitle}>{selectedPoint.name}</Text>
            <Text style={styles.detailsDescription}>{selectedPoint.description}</Text>
          </Pressable>
        </View>
      ) : null}

      <Pressable
        style={[styles.refreshButton, isLoading && styles.refreshButtonDisabled]}
        onPress={() => loadCoordinates(true).catch(() => undefined)}
        disabled={isLoading}
      >
        <Text style={styles.refreshButtonText}>{isLoading ? 'Обновляем...' : 'Обновить точки'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#d7e3ea',
  },
  map: {
    flex: 1,
  },
  infoPanel: {
    position: 'absolute',
    top: 24,
    left: 16,
    right: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    alignItems: 'center',
    shadowColor: '#06222a',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  infoText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
    color: '#16323a',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#16323a',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4c6268',
    textAlign: 'center',
  },
  detailsWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 88,
  },
  detailsCard: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(12, 33, 39, 0.94)',
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f3fbfb',
    marginBottom: 6,
  },
  detailsDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#d7ebea',
  },
  refreshButton: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    backgroundColor: '#0f766e',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  refreshButtonDisabled: {
    opacity: 0.7,
  },
  refreshButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
});
