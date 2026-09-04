import { API_BASE, getCaregiverToken } from "../auth/session";
import type { MemoryRow } from "../data/demo";
import {
  failureFromResponse,
  expiredSessionFailure,
  noPatientFailure,
  offlineFailure,
  type ApiFailure,
  type CaregiverDataFailure,
} from "./errors";
import { loadLinkedPatients } from "./patients";

export type MemoriesBundle =
  | {
    source: "live";
    label: string;
    rows: MemoryRow[];
    patientId: string;
  }
  | {
    source: "error";
    error: CaregiverDataFailure;
    rows: [];
  };

type ApiMemory = {
  id: string;
  title: { en?: string; as?: string };
  category: string;
  media_url: string;
  location: string | null;
  description?: string | null;
  created_at?: string;
  people_tagged?: string[] | null;
  year?: number | null;
};

function authHeaders(): HeadersInit {
  const token = getCaregiverToken();
  return token
    ? { Authorization: `Bearer ${token}`, Accept: "application/json" }
    : { Accept: "application/json" };
}

export async function loadMemories(): Promise<MemoriesBundle> {
  const patientResult = await loadLinkedPatients();
  if (!patientResult.ok) {
    return { source: "error", error: patientResult.error, rows: [] };
  }
  const patient = patientResult.selected;
  if (!patient) {
    return { source: "error", error: noPatientFailure(), rows: [] };
  }

  try {
    const response = await fetch(`${API_BASE}/memory-items?user_id=${patient.user_id}`, {
      headers: authHeaders(),
    });
    if (!response.ok) {
      return {
        source: "error",
        error: await failureFromResponse(response, "Could not load memories."),
        rows: [],
      };
    }
    const rows = (await response.json()) as ApiMemory[];
    return {
      source: "live",
      label:
        rows.length === 0
          ? "Live · no family photos uploaded yet"
          : `Live · ${rows.length} memory items`,
      patientId: patient.user_id,
      rows: rows.map((row) => ({
        id: row.id,
        title: row.title.en || row.title.as || "Memory",
        region: row.location || "Location not set",
        kind: row.category === "cultural" ? "cultural" : "family",
        description: row.description,
        createdAt: row.created_at,
        peopleTagged: row.people_tagged,
        year: row.year,
        mediaUrl: row.media_url,
      })),
    };
  } catch {
    return {
      source: "error",
      error: offlineFailure("The caregiver API could not be reached."),
      rows: [],
    };
  }
}

export type MemoryMutationResult =
  | { ok: true }
  | { ok: false; error: ApiFailure };

export async function uploadMemory(input: {
  userId: string;
  file: File;
  titleEn: string;
  titleAs?: string;
  location?: string;
  year?: number;
  peopleTagged?: string;
}): Promise<MemoryMutationResult> {
  const token = getCaregiverToken();
  if (!token) {
    return {
      ok: false,
      error: expiredSessionFailure(),
    };
  }
  if (!navigator.onLine) {
    return { ok: false, error: offlineFailure("A memory cannot be uploaded while offline.") };
  }

  const form = new FormData();
  form.append("user_id", input.userId);
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

  try {
    const response = await fetch(`${API_BASE}/memory-items`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    if (!response.ok) {
      return {
        ok: false,
        error: await failureFromResponse(response, "The memory could not be uploaded."),
      };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: offlineFailure("The caregiver API could not be reached.") };
  }
}
