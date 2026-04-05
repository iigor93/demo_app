import { useSyncExternalStore } from 'react';

export interface GlobalBannerState {
  id: string;
  message: string;
}

const listeners = new Set<() => void>();

let currentBanner: GlobalBannerState | null = null;

function emitChange() {
  listeners.forEach((listener) => listener());
}

export function showGlobalBanner(message: string) {
  currentBanner = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    message,
  };
  emitChange();
}

export function showTechnicalProblemsBanner() {
  showGlobalBanner('Технические проблемы, уже решаем');
}

export function dismissGlobalBanner(id?: string) {
  if (!currentBanner) {
    return;
  }

  if (id && currentBanner.id !== id) {
    return;
  }

  currentBanner = null;
  emitChange();
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return currentBanner;
}

export function useGlobalBanner() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
