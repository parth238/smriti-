import {
  API_BASE,
  getCaregiverToken,
  getSelectedPatientId,
  setSelectedPatientId,
} from "../auth/session";

export type LinkedPatient = {
  user_id: string;
  full_name: string;
  preferred_language: string;
  is_primary: boolean;
};

function authHeaders(): HeadersInit {
  const token = getCaregiverToken();
  return token
    ? { Authorization: `Bearer ${token}`, Accept: "application/json" }
    : { Accept: "application/json" };
}

export async function loadLinkedPatients(): Promise<LinkedPatient[]> {
  const token = getCaregiverToken();
  if (!token || !navigator.onLine) {
    return [];
  }
  try {
    const response = await fetch(`${API_BASE}/me/patients`, { headers: authHeaders() });
    if (!response.ok) {
      return [];
    }
    return (await response.json()) as LinkedPatient[];
  } catch {
    return [];
  }
}

export async function ensureSelectedPatient(): Promise<LinkedPatient | null> {
  const rows = await loadLinkedPatients();
  if (rows.length === 0) {
    return null;
  }
  const selected = getSelectedPatientId();
  const match = rows.find((row) => row.user_id === selected);
  if (match) {
    return match;
  }
  const primary = rows.find((row) => row.is_primary) ?? rows[0];
  setSelectedPatientId(primary.user_id);
  return primary;
}

export const PATIENT_CHANGE_EVENT = "smriti-patient-change";

export function selectPatient(userId: string): void {
  setSelectedPatientId(userId);
  window.dispatchEvent(new CustomEvent(PATIENT_CHANGE_EVENT));
}
