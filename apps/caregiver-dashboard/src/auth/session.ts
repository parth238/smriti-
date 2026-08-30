const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

const ACCESS_KEY = "smriti.caregiver.access";
const FLAG_KEY = "smriti.caregiver";
const PATIENT_KEY = "smriti.caregiver.patient";

export function isCaregiverSignedIn(): boolean {
  return window.sessionStorage.getItem(FLAG_KEY) === "1";
}

export function getCaregiverToken(): string | null {
  return window.sessionStorage.getItem(ACCESS_KEY);
}

export function getSelectedPatientId(): string | null {
  return window.sessionStorage.getItem(PATIENT_KEY);
}

export function setSelectedPatientId(id: string): void {
  window.sessionStorage.setItem(PATIENT_KEY, id);
}

export function signInCaregiver(accessToken?: string): void {
  window.sessionStorage.setItem(FLAG_KEY, "1");
  if (accessToken) {
    window.sessionStorage.setItem(ACCESS_KEY, accessToken);
  }
}

export function signOutCaregiver(): void {
  window.sessionStorage.removeItem(FLAG_KEY);
  window.sessionStorage.removeItem(ACCESS_KEY);
  window.sessionStorage.removeItem(PATIENT_KEY);
}

export { API_BASE };
