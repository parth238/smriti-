import { API_BASE, getCaregiverToken, getSelectedPatientId, setSelectedPatientId } from "../auth/session";
import { MEMORIES, type MemoryRow } from "../data/demo";

export type DataSource = "live" | "demo";

export type MemoriesBundle = {
  source: DataSource;
  label: string;
  rows: MemoryRow[];
};

type ApiMemory = {
  id: string;
  title: { en?: string; as?: string };
  category: string;
  media_url: string;
  location: string | null;
};

function authHeaders(): HeadersInit {
  const token = getCaregiverToken();
  return token
    ? { Authorization: `Bearer ${token}`, Accept: "application/json" }
    : { Accept: "application/json" };
}

async function resolvePatientId(): Promise<string | null> {
  const existing = getSelectedPatientId();
  if (existing) {
    return existing;
  }
  const response = await fetch(`${API_BASE}/me/patients`, { headers: authHeaders() });
  if (!response.ok) {
    return null;
  }
  const rows = (await response.json()) as Array<{ user_id: string; is_primary?: boolean }>;
  const primary = rows.find((row) => row.is_primary) ?? rows[0];
  if (!primary) {
    return null;
  }
  setSelectedPatientId(primary.user_id);
  return primary.user_id;
}

export async function loadMemories(): Promise<MemoriesBundle> {
  const token = getCaregiverToken();
  if (!token || !navigator.onLine) {
    return {
      source: "demo",
      label: "Demo sample · sign in with API for live memories",
      rows: MEMORIES,
    };
  }
  try {
    const userId = await resolvePatientId();
    if (!userId) {
      return {
        source: "demo",
        label: "Demo sample · no linked family member yet",
        rows: MEMORIES,
      };
    }
    const response = await fetch(`${API_BASE}/memory-items?user_id=${userId}`, {
      headers: authHeaders(),
    });
    if (!response.ok) {
      return {
        source: "demo",
        label: "Demo sample · API returned an error",
        rows: MEMORIES,
      };
    }
    const rows = (await response.json()) as ApiMemory[];
    if (rows.length === 0) {
      return {
        source: "live",
        label: "Live · no family photos uploaded yet",
        rows: [],
      };
    }
    return {
      source: "live",
      label: `Live · ${rows.length} memory items`,
      rows: rows.map((row) => ({
        id: row.id,
        title: row.title.en || row.title.as || "Memory",
        region: row.location || "Assam",
        kind: row.category === "cultural" ? "cultural" : "family",
      })),
    };
  } catch {
    return {
      source: "demo",
      label: "Demo sample · API unreachable",
      rows: MEMORIES,
    };
  }
}

export async function uploadMemory(input: {
  file: File;
  titleEn: string;
  titleAs?: string;
  location?: string;
  year?: number;
  peopleTagged?: string;
}): Promise<boolean> {
  const token = getCaregiverToken();
  const userId = await resolvePatientId();
  if (!token || !userId) {
    return false;
  }
  const form = new FormData();
  form.append("user_id", userId);
  form.append("category", "family");
  form.append("title_en", input.titleEn);
  if (input.titleAs) {
    form.append("title_as", input.titleAs);
  }
  if (input.location) {
    form.append("location", input.location);
  }
  if (input.year) {
    form.append("year", String(input.year));
  }
  if (input.peopleTagged) {
    form.append("people_tagged", input.peopleTagged);
  }
  form.append("file", input.file);
  const response = await fetch(`${API_BASE}/memory-items`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  return response.ok;
}
