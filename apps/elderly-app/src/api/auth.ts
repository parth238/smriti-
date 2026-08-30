export const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

export type ElderlyLoginOk = {
  ok: true;
  accessToken?: string;
  offline: boolean;
};

export type ElderlyLoginFail = {
  ok: false;
  reason: "pin" | "rejected";
};

export type ElderlyLoginResult = ElderlyLoginOk | ElderlyLoginFail;

function readAccessToken(data: unknown): string | undefined {
  if (typeof data !== "object" || data === null) {
    return undefined;
  }
  if (!("access_token" in data)) {
    return undefined;
  }
  const token = data.access_token;
  return typeof token === "string" ? token : undefined;
}

export async function elderlyLogin(phone: string, pin: string): Promise<ElderlyLoginResult> {
  if (pin.length !== 4) {
    return { ok: false, reason: "pin" };
  }
  try {
    const response = await fetch(`${API_BASE}/auth/user/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: phone.trim() || undefined, pin }),
    });
    if (!response.ok) {
      return { ok: false, reason: "rejected" };
    }
    const data: unknown = await response.json();
    return { ok: true, accessToken: readAccessToken(data), offline: false };
  } catch {
    return { ok: true, offline: true };
  }
}
