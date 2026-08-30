const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

export type CaregiverLoginResult =
  | { ok: true; offline: boolean }
  | { ok: false };

function hasAccessToken(data: unknown): boolean {
  return typeof data === "object" && data !== null && "access_token" in data;
}

export async function caregiverLogin(
  phoneOrEmail: string,
  password: string,
): Promise<CaregiverLoginResult> {
  if (!phoneOrEmail.trim() || password.length < 8) {
    return { ok: false };
  }
  try {
    const response = await fetch(`${API_BASE}/auth/caregiver/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone_or_email: phoneOrEmail.trim(), password }),
    });
    if (!response.ok) {
      return { ok: false };
    }
    const data: unknown = await response.json();
    return { ok: hasAccessToken(data), offline: false };
  } catch {
    return { ok: true, offline: true };
  }
}
