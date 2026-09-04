import { API_BASE } from "../auth/session";

export type CaregiverLoginResult =
  | { ok: true; accessToken: string }
  | { ok: false; message: string };

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
    return { ok: false, message: "Enter a valid phone or email and password." };
  }
  try {
    const response = await fetch(`${API_BASE}/auth/caregiver/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone_or_email: phoneOrEmail.trim(), password }),
    });
    if (!response.ok) {
      return { ok: false, message: "Phone, email, or password is not correct." };
    }
    const data: unknown = await response.json();
    const accessToken = readAccessToken(data);
    if (!accessToken) {
      return { ok: false, message: "The API did not return a valid caregiver session." };
    }
    return { ok: true, accessToken };
  } catch {
    return { ok: false, message: "The caregiver API could not be reached." };
  }
}
