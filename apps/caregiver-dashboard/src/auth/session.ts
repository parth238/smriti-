const key = "smriti.caregiver";

export function isCaregiverSignedIn(): boolean {
  return window.sessionStorage.getItem(key) === "1";
}

export function signInCaregiver(): void {
  window.sessionStorage.setItem(key, "1");
}

export function signOutCaregiver(): void {
  window.sessionStorage.removeItem(key);
}
