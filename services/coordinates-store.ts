import { useSyncExternalStore } from 'react';
import { fetchCoordinates } from '@/services/api';
import type { CoordinatePoint } from '@/services/api';
import { logError, logInfo } from '@/services/logs';

interface CoordinatesState {
  points: CoordinatePoint[];
  isLoading: boolean;
  hasLoaded: boolean;
}

const listeners = new Set<() => void>();

let state: CoordinatesState = {
  points: [],
  isLoading: false,
  hasLoaded: false,
};

let loadPromise: Promise<void> | null = null;

function emitChange() {
  listeners.forEach((listener) => listener());
}

function setState(nextState: Partial<CoordinatesState>) {
  state = {
    ...state,
    ...nextState,
  };
  emitChange();
}

export async function loadCoordinates(force = false) {
  if (loadPromise && !force) {
    return loadPromise;
  }

  if (state.hasLoaded && !force) {
    return;
  }

  setState({ isLoading: true });
  logInfo('Начата загрузка координат для карты');

  loadPromise = (async () => {
    try {
      const points = await fetchCoordinates();
      setState({
        points,
        isLoading: false,
        hasLoaded: true,
      });
      logInfo('Координаты для карты загружены', { count: points.length });
    } catch (error) {
      setState({
        points: [],
        isLoading: false,
        hasLoaded: false,
      });
      logError('Не удалось загрузить координаты для карты', {
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    } finally {
      loadPromise = null;
    }
  })();

  return loadPromise;
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return state;
}

export function useCoordinates() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
