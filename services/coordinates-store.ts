import { useSyncExternalStore } from 'react';
import { fetchCoordinates } from '@/services/api';
import type { CoordinatePoint } from '@/services/api';

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

  loadPromise = (async () => {
    try {
      const points = await fetchCoordinates();
      setState({
        points,
        isLoading: false,
        hasLoaded: true,
      });
    } catch (error) {
      setState({
        points: [],
        isLoading: false,
        hasLoaded: false,
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
