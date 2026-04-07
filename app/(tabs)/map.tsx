import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import type { CoordinatePoint } from "@/services/api";
import { loadCoordinates, useCoordinates } from "@/services/coordinates-store";

const DEFAULT_REGION = {
  latitude: 55.751244,
  longitude: 37.618423,
  zoom: 4,
};

function buildMapHtml(points: CoordinatePoint[]) {
  const serializedPoints = encodeURIComponent(JSON.stringify(points));
  const serializedDefaultRegion = encodeURIComponent(
    JSON.stringify(DEFAULT_REGION),
  );

  return `<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
    />
    <link
      rel="stylesheet"
      href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
      crossorigin=""
    />
    <style>
      html, body, #map {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
      }

      body {
        background: #d7e3ea;
      }

      .leaflet-container {
        font-family: sans-serif;
        background: #d7e3ea;
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script
      src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
      integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
      crossorigin=""
    ></script>
    <script>
      const points = JSON.parse(decodeURIComponent('${serializedPoints}'));
      const defaultRegion = JSON.parse(decodeURIComponent('${serializedDefaultRegion}'));
      const map = L.map('map', {
        zoomControl: false,
        attributionControl: false,
      });
      L.control.attribution({ prefix: false }).addTo(map);
      map.attributionControl.addAttribution(
        '&copy; <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener noreferrer">OpenMapTiles</a> Data from &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>'
      );

      // Quick style switch options:
      // light_all
      // light_nolabels
      // voyager
      // voyager_nolabels
      // dark_all
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 20,
      }).addTo(map);

      const bounds = [];

      points.forEach((point) => {
        const marker = L.marker([point.lat, point.lon]).addTo(map);
        bounds.push([point.lat, point.lon]);
        marker.on('click', () => {
          window.ReactNativeWebView.postMessage(
            JSON.stringify({ type: 'selectPoint', pointId: point.id })
          );
        });
      });

      map.on('click', () => {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'clearSelection' }));
      });

      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [32, 32] });
      } else {
        map.setView([defaultRegion.latitude, defaultRegion.longitude], defaultRegion.zoom);
      }
    </script>
  </body>
</html>`;
}

function buildWebViewKey(points: CoordinatePoint[]) {
  if (points.length === 0) {
    return "empty-map";
  }

  return points
    .map((point) => `${point.id}:${point.lat}:${point.lon}`)
    .join("|");
}

function isPointMessage(
  payload: unknown,
): payload is
  | { type: "selectPoint"; pointId: string }
  | { type: "clearSelection" } {
  if (!payload || typeof payload !== "object" || !("type" in payload)) {
    return false;
  }

  if (payload.type === "clearSelection") {
    return true;
  }

  return (
    payload.type === "selectPoint" &&
    "pointId" in payload &&
    typeof payload.pointId === "string"
  );
}

export default function MapScreen() {
  const { points, isLoading, hasLoaded } = useCoordinates();
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  const selectedPoint =
    points.find((point) => point.id === selectedPointId) ?? null;
  const mapHtml = buildMapHtml(points);
  const webViewKey = buildWebViewKey(points);

  useEffect(() => {
    setIsMapReady(false);
  }, [webViewKey]);

  useEffect(() => {
    if (
      selectedPointId &&
      !points.some((point) => point.id === selectedPointId)
    ) {
      setSelectedPointId(null);
    }
  }, [points, selectedPointId]);

  function handleMapMessage(event: WebViewMessageEvent) {
    try {
      const payload: unknown = JSON.parse(event.nativeEvent.data);

      if (!isPointMessage(payload)) {
        return;
      }

      if (payload.type === "clearSelection") {
        setSelectedPointId(null);
        return;
      }

      setSelectedPointId(payload.pointId);
    } catch {
      setSelectedPointId(null);
    }
  }

  return (
    <View style={styles.container}>
      <WebView
        key={webViewKey}
        style={styles.map}
        originWhitelist={["*"]}
        source={{ html: mapHtml }}
        onMessage={handleMapMessage}
        onLoadEnd={() => setIsMapReady(true)}
        javaScriptEnabled
        domStorageEnabled
      />

      {(isLoading && !hasLoaded) || !isMapReady ? (
        <View style={styles.infoPanel} pointerEvents="none">
          <ActivityIndicator size="large" color="#0f766e" />
          <Text style={styles.infoText}>Загружаем точки на карте...</Text>
        </View>
      ) : null}

      {!isLoading && hasLoaded && points.length === 0 ? (
        <View style={styles.infoPanel} pointerEvents="none">
          <Text style={styles.emptyTitle}>Точек пока нет</Text>
          <Text style={styles.emptyText}>
            Когда бэкенд вернет координаты, они появятся здесь.
          </Text>
        </View>
      ) : null}

      {selectedPoint ? (
        <View style={styles.detailsWrap} pointerEvents="box-none">
          <Pressable style={styles.detailsCard} onPress={() => undefined}>
            <Text style={styles.detailsTitle}>{selectedPoint.name}</Text>
            <Text style={styles.detailsDescription}>
              {selectedPoint.description}
            </Text>
          </Pressable>
        </View>
      ) : null}

      <Pressable
        style={[
          styles.refreshButton,
          isLoading && styles.refreshButtonDisabled,
        ]}
        onPress={() => loadCoordinates(true).catch(() => undefined)}
        disabled={isLoading}
      >
        <Text style={styles.refreshButtonText}>
          {isLoading ? "Обновляем..." : "Обновить точки"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#d7e3ea",
  },
  map: {
    flex: 1,
    backgroundColor: "#d7e3ea",
  },
  infoPanel: {
    position: "absolute",
    top: 24,
    left: 16,
    right: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    alignItems: "center",
    shadowColor: "#06222a",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  infoText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "600",
    color: "#16323a",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#16323a",
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#4c6268",
    textAlign: "center",
  },
  detailsWrap: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 88,
  },
  detailsCard: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "rgba(12, 33, 39, 0.94)",
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#f3fbfb",
    marginBottom: 6,
  },
  detailsDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: "#d7ebea",
  },
  refreshButton: {
    position: "absolute",
    right: 16,
    bottom: 24,
    backgroundColor: "#0f766e",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
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
    fontWeight: "700",
    color: "#ffffff",
  },
});
