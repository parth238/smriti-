import { API_BASE } from "./auth";

export type ApiMemoryItem = {
  id: string;
  user_id: string;
  media_url: string;
  media_type: string;
  category: string;
  title: Record<string, string>;
  description: string | null;
  people_tagged: string[] | null;
  year: number | null;
  location: string | null;
  prompt_text: Record<string, string> | null;
  created_at: string;
};

function readToken(): string | null {
  return window.sessionStorage.getItem("smriti.access") ?? window.localStorage.getItem("smriti.access");
}

function readUserId(): string | null {
  return window.localStorage.getItem("smriti.userId");
}

export function apiFileOrigin(): string {
  return API_BASE.replace(/\/api\/v1\/?$/, "");
}

export function resolveMediaUrl(mediaUrl: string): string {
  if (mediaUrl.startsWith("http://") || mediaUrl.startsWith("https://")) {
    return mediaUrl;
  }
  const origin = apiFileOrigin();
  return `${origin}${mediaUrl.startsWith("/") ? mediaUrl : `/${mediaUrl}`}`;
}

export async function loadFamilyMemories(): Promise<ApiMemoryItem[]> {
  const token = readToken();
  const userId = readUserId();
  if (!token || !userId || !navigator.onLine) {
    return [];
  }
  try {
    const response = await fetch(
      `${API_BASE}/memory-items?user_id=${userId}&category=family`,
      { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } },
    );
    if (!response.ok) {
      return [];
    }
    return (await response.json()) as ApiMemoryItem[];
  } catch {
    return [];
  }
}
