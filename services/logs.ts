import { useSyncExternalStore } from 'react';

export type LogLevel = 'info' | 'error';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  title: string;
  details?: string;
}

const MAX_LOG_ENTRIES = 200;

let entries: LogEntry[] = [];

const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function stringifyPayload(payload: unknown): string | undefined {
  if (payload == null) {
    return undefined;
  }

  if (typeof payload === 'string') {
    return payload;
  }

  try {
    return JSON.stringify(payload, null, 2);
  } catch {
    return String(payload);
  }
}

export function addLog(level: LogLevel, title: string, payload?: unknown) {
  const nextEntry: LogEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    level,
    title,
    details: stringifyPayload(payload),
  };

  entries = [nextEntry, ...entries].slice(0, MAX_LOG_ENTRIES);
  emitChange();
}

export function logInfo(title: string, payload?: unknown) {
  addLog('info', title, payload);
}

export function logError(title: string, payload?: unknown) {
  addLog('error', title, payload);
}

export function clearLogs() {
  entries = [];
  emitChange();
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return entries;
}

export function useLogs() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
