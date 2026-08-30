export const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

export type ElderlyLoginOk = {
  ok: true;
  accessToken: string;
  userId?: string;
  offline: boolean;
};

export type ElderlyLoginFail = {
  ok: false;
  reason: "pin" | "rejected" | "offline_unpaired";
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

async function readUserIdFromMe(token: string): Promise<string | undefined> {
  try {
    const response = await fetch(`${API_BASE}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      return undefined;
    }
    const data: unknown = await response.json();
    if (typeof data === "object" && data !== null && "id" in data && typeof data.id === "string") {
      return data.id;
    }
  } catch {
    return undefined;
  }
  return undefined;
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
    const accessToken = readAccessToken(data);
    if (!accessToken) {
      return { ok: false, reason: "rejected" };
    }
    const userId = await readUserIdFromMe(accessToken);
    return { ok: true, accessToken, userId, offline: false };
  } catch {
    // Offline: only succeed if a previous online pairing exists for this device.
    const pairedFlag = window.localStorage.getItem("smriti.paired");
    const storedUser = window.localStorage.getItem("smriti.userId");
    const storedToken = window.localStorage.getItem("smriti.access");
    if (pairedFlag === "1" && storedUser && storedToken) {
      return { ok: true, accessToken: storedToken, userId: storedUser, offline: true };
    }
    return { ok: false, reason: "offline_unpaired" };
  }
}
