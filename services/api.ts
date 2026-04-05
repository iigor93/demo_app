import { showTechnicalProblemsBanner } from '@/services/global-banner';
import { logError, logInfo } from '@/services/logs';

const BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL ?? '').replace(/\/$/, '');

export interface Banner {
  id: number;
  image: string;
}

export interface NewsItem {
  id: number;
  name: string;
  description: string;
  image: string | null;
  updated_at: string;
}

export interface CoordinatePoint {
  id: string;
  lat: number;
  lon: number;
  name: string;
  description: string;
}

function normalizeCoordinatePoint(item: unknown, index: number): CoordinatePoint | null {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const candidate = item as Record<string, unknown>;
  const lat = typeof candidate.lat === 'string' ? Number(candidate.lat) : candidate.lat;
  const lon = typeof candidate.lon === 'string' ? Number(candidate.lon) : candidate.lon;
  const name = candidate.name;
  const description = candidate.description;
  const rawId = candidate.id;

  if (
    typeof lat !== 'number' ||
    Number.isNaN(lat) ||
    typeof lon !== 'number' ||
    Number.isNaN(lon) ||
    typeof name !== 'string' ||
    typeof description !== 'string'
  ) {
    return null;
  }

  return {
    id: typeof rawId === 'string' || typeof rawId === 'number' ? String(rawId) : `coordinate-${index}`,
    lat,
    lon,
    name,
    description,
  };
}

async function get<T>(path: string): Promise<T> {
  const url = `${BASE_URL}${path}`;

  logInfo('Сетевой запрос отправлен', {
    method: 'GET',
    url,
    body: null,
  });

  try {
    const response = await fetch(url);
    const responseText = await response.text();
    let parsedResponse: unknown = null;

    if (responseText) {
      try {
        parsedResponse = JSON.parse(responseText);
      } catch {
        parsedResponse = responseText;
      }
    }

    logInfo('Сетевой ответ получен', {
      path,
      status: response.status,
      ok: response.ok,
      body: parsedResponse,
    });

    if (!response.ok) {
      const error = new Error(`Request failed: ${response.status}`);

      logError('Сетевой запрос завершился ошибкой', {
        path,
        status: response.status,
        body: parsedResponse,
        message: error.message,
      });

      throw error;
    }

    return parsedResponse as T;
  } catch (error) {
    logError('Исключение во время сетевого запроса', {
      path,
      message: error instanceof Error ? error.message : String(error),
    });
    showTechnicalProblemsBanner();

    throw error;
  }
}

export const fetchBanners = () => get<Banner[]>('/api/v1/banners');
export const fetchNews = () => get<NewsItem[]>('/api/v1/news');

export async function fetchCoordinates(): Promise<CoordinatePoint[]> {
  const response = await get<unknown>('/api/v1/coordinates');

  if (!Array.isArray(response)) {
    throw new Error('Coordinates response is not an array');
  }

  return response
    .map((item, index) => normalizeCoordinatePoint(item, index))
    .filter((item): item is CoordinatePoint => item !== null);
}
