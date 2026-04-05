import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { clearLogs, useLogs } from '@/services/logs';

function formatTimestamp(timestamp: string) {
  return new Date(timestamp).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default function LogsScreen() {
  const logs = useLogs();
  const hasLogs = logs.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Логи приложения</Text>
        <Pressable
          style={[styles.clearButton, !hasLogs && styles.clearButtonDisabled]}
          onPress={clearLogs}
          disabled={!hasLogs}
        >
          <Text style={styles.clearButtonText}>Очистить</Text>
        </Pressable>
      </View>

      {!hasLogs ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Пока пусто</Text>
          <Text style={styles.emptyText}>
            Здесь появятся действия пользователя, сетевые запросы, ответы и ошибки.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {logs.map((log) => (
            <View
              key={log.id}
              style={[
                styles.card,
                log.level === 'error' ? styles.cardError : styles.cardInfo,
              ]}
            >
              <View style={styles.cardHeader}>
                <Text
                  style={[
                    styles.level,
                    log.level === 'error' ? styles.levelError : styles.levelInfo,
                  ]}
                >
                  {log.level === 'error' ? 'ERROR' : 'INFO'}
                </Text>
                <Text style={styles.timestamp}>{formatTimestamp(log.timestamp)}</Text>
              </View>
              <Text style={styles.logTitle}>{log.title}</Text>
              {!!log.details && <Text style={styles.details}>{log.details}</Text>}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f8',
  },
  header: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#18212b',
  },
  clearButton: {
    backgroundColor: '#18212b',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  clearButtonDisabled: {
    opacity: 0.4,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#18212b',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#5f6b76',
    textAlign: 'center',
  },
  content: {
    padding: 16,
    gap: 12,
  },
  card: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  cardInfo: {
    backgroundColor: '#ffffff',
    borderColor: '#d5dde5',
  },
  cardError: {
    backgroundColor: '#fff4f4',
    borderColor: '#f1b3b3',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  level: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  levelInfo: {
    color: '#176087',
  },
  levelError: {
    color: '#b42318',
  },
  timestamp: {
    flexShrink: 1,
    fontSize: 12,
    color: '#66717c',
    textAlign: 'right',
  },
  logTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#18212b',
    marginBottom: 8,
  },
  details: {
    fontSize: 13,
    lineHeight: 19,
    color: '#38424c',
    fontFamily: 'monospace',
  },
});
