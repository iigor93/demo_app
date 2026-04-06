import { fetch as expoFetch } from 'expo/fetch';
import { Platform } from 'react-native';
import { showTechnicalProblemsBanner } from '@/services/global-banner';
import { logError } from '@/services/logs';

const BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL ?? '').replace(/\/$/, '');
const REQUEST_TIMEOUT_MS = 15000;
const RETRY_DELAY_MS = 750;
const MAX_NETWORK_ATTEMPTS = 2;

const activeRequests = new Map<
  string,
  {
    path: string;
    url: string;
    startedAt: number;
    attempt: number;
    totalAttempts: number;
  }
>();

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

function trimText(value: string, maxLength = 4000) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}\n...truncated ${value.length - maxLength} chars`;
}

function toSerializableHeaders(headers: Headers) {
  return Object.fromEntries(headers.entries());
}

function buildErrorDetails(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause,
    };
  }

  return {
    message: String(error),
  };
}

function buildRequestId(path: string) {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${path.replace(/[^\w]/g, '_')}`;
}

function getRequestMeta(url: string) {
  try {
    const parsedUrl = new URL(url);

    return {
      origin: parsedUrl.origin,
      host: parsedUrl.host,
      hostname: parsedUrl.hostname,
      protocol: parsedUrl.protocol,
      port: parsedUrl.port || null,
    };
  } catch {
    return {
      origin: null,
      host: null,
      hostname: null,
      protocol: null,
      port: null,
    };
  }
}

function getConcurrentRequestsSnapshot(requestId: string) {
  return Array.from(activeRequests.entries())
    .filter(([id]) => id !== requestId)
    .map(([id, request]) => ({
      requestId: id,
      path: request.path,
      url: request.url,
      startedAt: new Date(request.startedAt).toISOString(),
      ageMs: Date.now() - request.startedAt,
      attempt: request.attempt,
      totalAttempts: request.totalAttempts,
    }));
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetryNetworkError(error: unknown, didTimeout: boolean) {
  if (didTimeout) {
    return true;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    error.name === 'AbortError' ||
    message.includes('network request failed') ||
    message.includes('timeout') ||
    message.includes('timed out')
  );
}

function inferNetworkFailure(params: {
  error: unknown;
  durationMs: number;
  url: string;
  concurrentRequests: ReturnType<typeof getConcurrentRequestsSnapshot>;
  attemptsMade: number;
  didTimeout: boolean;
}) {
  const { error, durationMs, url, concurrentRequests, attemptsMade, didTimeout } = params;
  const details = buildErrorDetails(error);
  const message = typeof details.message === 'string' ? details.message.toLowerCase() : '';
  const requestMeta = getRequestMeta(url);
  const probableCauses: string[] = [];
  const observations: string[] = [];
  let mostLikelyCause = 'network_stack_or_route_instability_before_backend';
  let mostLikelyCauseRu = 'Похоже на нестабильность сетевого стека приложения или маршрута до сервера до попадания в backend.';

  if (message.includes('network request failed')) {
    probableCauses.push('connection_failed_before_http_response');
    observations.push('The request failed before any HTTP status code was received.');
  }

  if (didTimeout || durationMs >= REQUEST_TIMEOUT_MS) {
    probableCauses.push('timeout_or_connection_stall');
    observations.push('The failure happened after a long wait, which looks like a timeout or a stalled TCP/TLS connection.');
    mostLikelyCause = 'timeout_or_stalled_https_connection_before_backend';
    mostLikelyCauseRu = 'Похоже на таймаут или зависшее HTTPS-соединение до backend.';
  } else if (durationMs < 2000) {
    probableCauses.push('dns_ssl_or_immediate_connect_failure');
    observations.push('The request failed quickly, which is common for DNS, TLS, or immediate connect failures.');
    mostLikelyCause = 'fast_connect_failure_dns_or_tls';
    mostLikelyCauseRu = 'Похоже на быстрый сбой DNS-резолва или TLS-рукопожатия.';
  }

  if (requestMeta.protocol === 'https:') {
    probableCauses.push('ssl_tls_handshake_problem');
    observations.push('HTTPS is in use, so certificate chain, TLS handshake, or SNI issues are possible.');
  }

  probableCauses.push('dns_resolution_problem');
  probableCauses.push('server_unreachable_from_device_network');
  probableCauses.push('reverse_proxy_or_firewall_dropped_connection');

  if (concurrentRequests.length > 0) {
    probableCauses.push('selective_failure_while_other_requests_were_in_flight');
    observations.push('Other requests were running at the same time, so the problem may be intermittent or endpoint-specific.');
  }

  if (attemptsMade > 1) {
    probableCauses.push('transient_mobile_network_or_socket_reuse_issue');
    observations.push('The app retried the request, which is a useful signal for intermittent mobile connection or socket reuse problems.');
  }

  return {
    probableCauses: Array.from(new Set(probableCauses)),
    observations,
    mostLikelyCause,
    mostLikelyCauseRu,
    summaryRu: `${mostLikelyCauseRu} HTTP-ответ от сервера получен не был.`,
  };
}

function createLoggedError(message: string) {
  const error = new Error(message) as Error & { alreadyLogged?: boolean };
  error.alreadyLogged = true;
  return error;
}

async function get<T>(path: string): Promise<T> {
  if (!BASE_URL) {
    const error = new Error('EXPO_PUBLIC_API_BASE_URL is empty or undefined');

    logError('API request could not start', {
      reason: 'Missing EXPO_PUBLIC_API_BASE_URL',
      path,
      baseUrl: BASE_URL,
      ...buildErrorDetails(error),
    });
    showTechnicalProblemsBanner();

    throw error;
  }

  const url = `${BASE_URL}${path}`;
  const requestId = buildRequestId(path);
  const overallStartedAt = Date.now();
  const overallStartedAtIso = new Date(overallStartedAt).toISOString();
  const requestMeta = getRequestMeta(url);
  const attemptDurationsMs: number[] = [];

  for (let attempt = 1; attempt <= MAX_NETWORK_ATTEMPTS; attempt += 1) {
    const attemptStartedAt = Date.now();
    const attemptStartedAtIso = new Date(attemptStartedAt).toISOString();
    const abortController = new AbortController();
    let didTimeout = false;
    const timeoutId = setTimeout(() => {
      didTimeout = true;
      abortController.abort();
    }, REQUEST_TIMEOUT_MS);

    activeRequests.set(requestId, {
      path,
      url,
      startedAt: attemptStartedAt,
      attempt,
      totalAttempts: MAX_NETWORK_ATTEMPTS,
    });

    try {
      const response = await expoFetch(url, {
        method: 'GET',
        signal: abortController.signal,
        headers: {
          Accept: 'application/json',
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      });
      const responseText = await response.text();
      let parsedResponse: unknown = null;

      if (responseText) {
        try {
          parsedResponse = JSON.parse(responseText);
        } catch {
          parsedResponse = responseText;
        }
      }

      if (!response.ok) {
        const error = createLoggedError(`Request failed with status ${response.status}`);

        logError('HTTP request failed', {
          kind: 'http_error',
          requestId,
          method: 'GET',
          path,
          url,
          baseUrl: BASE_URL,
          startedAt: overallStartedAtIso,
          lastAttemptStartedAt: attemptStartedAtIso,
          durationMs: Date.now() - overallStartedAt,
          attempt,
          attemptsMade: attempt,
          maxAttempts: MAX_NETWORK_ATTEMPTS,
          attemptDurationsMs,
          timeoutMs: REQUEST_TIMEOUT_MS,
          platform: Platform.OS,
          ...requestMeta,
          concurrentRequests: getConcurrentRequestsSnapshot(requestId),
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          headers: toSerializableHeaders(response.headers),
          responseBodyText: responseText ? trimText(responseText) : null,
          responseBodyParsed: parsedResponse,
          ...buildErrorDetails(error),
        });
        showTechnicalProblemsBanner();

        throw error;
      }

      return parsedResponse as T;
    } catch (error) {
      const attemptDurationMs = Date.now() - attemptStartedAt;
      attemptDurationsMs.push(attemptDurationMs);

      if (error instanceof Error && 'alreadyLogged' in error && error.alreadyLogged) {
        throw error;
      }

      const retryable = shouldRetryNetworkError(error, didTimeout);
      const canRetry = retryable && attempt < MAX_NETWORK_ATTEMPTS;

      if (canRetry) {
        await delay(RETRY_DELAY_MS * attempt);
        continue;
      }

      const durationMs = Date.now() - overallStartedAt;
      const concurrentRequests = getConcurrentRequestsSnapshot(requestId);
      const inferredFailure = inferNetworkFailure({
        error,
        durationMs,
        url,
        concurrentRequests,
        attemptsMade: attempt,
        didTimeout,
      });

      logError('Network request crashed before successful response', {
        kind: 'network_or_runtime_error',
        requestId,
        method: 'GET',
        path,
        url,
        baseUrl: BASE_URL,
        startedAt: overallStartedAtIso,
        lastAttemptStartedAt: attemptStartedAtIso,
        durationMs,
        attempt,
        attemptsMade: attempt,
        maxAttempts: MAX_NETWORK_ATTEMPTS,
        attemptDurationsMs,
        timeoutMs: REQUEST_TIMEOUT_MS,
        didTimeout,
        retryApplied: attempt > 1,
        platform: Platform.OS,
        ...requestMeta,
        concurrentRequests,
        ...inferredFailure,
        ...buildErrorDetails(error),
      });
      showTechnicalProblemsBanner();

      throw error;
    } finally {
      clearTimeout(timeoutId);
      activeRequests.delete(requestId);
    }
  }

  throw new Error(`Unexpected request flow for ${path}`);
}

export const fetchBanners = () => get<Banner[]>('/api/v1/banners');
export const fetchNews = () => get<NewsItem[]>('/api/v1/news');

export async function fetchCoordinates(): Promise<CoordinatePoint[]> {
  const response = await get<unknown>('/api/v1/coordinates');

  if (!Array.isArray(response)) {
    const error = new Error('Coordinates response is not an array');

    logError('Coordinates response has invalid shape', {
      path: '/api/v1/coordinates',
      expected: 'array',
      actualType: response === null ? 'null' : typeof response,
      responseSample: response,
      ...buildErrorDetails(error),
    });

    throw error;
  }

  const invalidItems: Array<{ index: number; item: unknown }> = [];
  const points = response
    .map((item, index) => normalizeCoordinatePoint(item, index))
    .filter((item, index): item is CoordinatePoint => {
      if (item !== null) {
        return true;
      }

      invalidItems.push({
        index,
        item: response[index],
      });

      return false;
    });

  if (invalidItems.length > 0) {
    logError('Coordinates response contains invalid items', {
      path: '/api/v1/coordinates',
      totalItems: response.length,
      invalidItemsCount: invalidItems.length,
      invalidItems: invalidItems.slice(0, 20),
    });
  }

  return points;
}
