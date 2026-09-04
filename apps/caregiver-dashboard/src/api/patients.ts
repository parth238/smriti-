import {
  API_BASE,
  getCaregiverToken,
  getSelectedPatientId,
  setSelectedPatientId,
} from "../auth/session";
import {
  failureFromResponse,
  expiredSessionFailure,
  offlineFailure,
  type ApiFailure,
} from "./errors";

export type LinkedPatient = {
  user_id: string;
  full_name: string;
  preferred_language: string;
  is_primary: boolean;
};

export type LinkedPatientsResult =
  | { ok: true; rows: LinkedPatient[]; selected: LinkedPatient | null }
  | { ok: false; error: ApiFailure };

function authHeaders(): HeadersInit {
  const token = getCaregiverToken();
  return token
    ? { Authorization: `Bearer ${token}`, Accept: "application/json" }
    : { Accept: "application/json" };
}

function selectCurrentPatient(rows: LinkedPatient[]): LinkedPatient | null {
  if (rows.length === 0) {
    return null;
  }
  const selectedId = getSelectedPatientId();
  const selected = rows.find((row) => row.user_id === selectedId);
  const current = selected ?? rows.find((row) => row.is_primary) ?? rows[0];
  setSelectedPatientId(current.user_id);
  return current;
}

export async function loadLinkedPatients(): Promise<LinkedPatientsResult> {
  const token = getCaregiverToken();
  if (!token) {
    return {
      ok: false,
      error: expiredSessionFailure(),
    };
  }
  if (!navigator.onLine) {
    return {
      ok: false,
      error: offlineFailure("The API is unavailable while this device is offline."),
    };
  }
  try {
    const response = await fetch(`${API_BASE}/me/patients`, { headers: authHeaders() });
    if (!response.ok) {
      return {
        ok: false,
        error: await failureFromResponse(response, "Could not load linked family members."),
      };
    }
    const rows = (await response.json()) as LinkedPatient[];
    return { ok: true, rows, selected: selectCurrentPatient(rows) };
  } catch {
    return {
      ok: false,
      error: offlineFailure("The caregiver API could not be reached."),
    };
  }
}

export const PATIENT_CHANGE_EVENT = "smriti-patient-change";

export function selectPatient(userId: string): void {
  setSelectedPatientId(userId);
  window.dispatchEvent(new CustomEvent(PATIENT_CHANGE_EVENT));
}
