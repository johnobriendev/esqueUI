const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;

export interface UnsplashPhoto {
  id: string;
  regular: string;
  small: string;
  downloadLocation: string;
  photographerName: string;
  photographerUrl: string;
}

function parsePhoto(p: any): UnsplashPhoto {
  return {
    id: p.id,
    regular: p.urls?.regular,
    small: p.urls?.small,
    downloadLocation: p.links?.download_location ?? '',
    photographerName: p.user?.name ?? '',
    photographerUrl: p.user?.links?.html ?? '',
  };
}

export function triggerDownload(downloadLocation: string) {
  if (!downloadLocation || !UNSPLASH_ACCESS_KEY) return;
  fetch(`${downloadLocation}?client_id=${UNSPLASH_ACCESS_KEY}`).catch(() => {});
}

export async function fetchRandomNaturePhoto(): Promise<UnsplashPhoto | null> {
  if (!UNSPLASH_ACCESS_KEY) return null;

  try {
    const res = await fetch(
      'https://api.unsplash.com/photos/random?query=nature&orientation=landscape',
      { headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return parsePhoto(data);
  } catch {
    return null;
  }
}

export async function fetchNaturePhotos(count = 6): Promise<UnsplashPhoto[]> {
  if (!UNSPLASH_ACCESS_KEY) return [];

  try {
    const res = await fetch(
      `https://api.unsplash.com/photos/random?query=nature&orientation=landscape&count=${count}`,
      { headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.map(parsePhoto);
  } catch {
    return [];
  }
}
