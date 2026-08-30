import { API_BASE } from "../auth/session";

export type CaregiverLoginResult =
  | { ok: true; offline: boolean; accessToken?: string }
  | { ok: false };

function readAccessToken(data: unknown): string | undefined {
  if (typeof data !== "object" || data === null || !("access_token" in data)) {
    return undefined;
  }
  return typeof data.access_token === "string" ? data.access_token : undefined;
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
    const accessToken = readAccessToken(data);
    if (!accessToken) {
      return { ok: false };
    }
    return { ok: true, offline: false, accessToken };
  } catch {
    // Dashboard may open with labeled demo data when the API is unreachable.
    return { ok: true, offline: true };
  }
}
