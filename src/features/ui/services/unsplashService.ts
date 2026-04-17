import api from '../../../shared/lib/api';

export interface UnsplashPhoto {
  id: string;
  regular: string;
  small: string;
  downloadLocation: string;
  photographerName: string;
  photographerUrl: string;
}

export function triggerDownload(downloadLocation: string) {
  if (!downloadLocation) return;
  api.get('/photos/download', { params: { url: downloadLocation } }).catch(() => {});
}

export async function fetchRandomNaturePhoto(): Promise<UnsplashPhoto | null> {
  try {
    const res = await api.get<UnsplashPhoto>('/photos/random');
    return res.data;
  } catch {
    return null;
  }
}

export async function fetchNaturePhotos(count = 6): Promise<UnsplashPhoto[]> {
  try {
    const res = await api.get<UnsplashPhoto[]>('/photos/random', { params: { count } });
    return res.data;
  } catch {
    return [];
  }
}
