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

async function get<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
}

export const fetchBanners = () => get<Banner[]>('/api/v1/banners');
export const fetchNews = () => get<NewsItem[]>('/api/v1/news');
