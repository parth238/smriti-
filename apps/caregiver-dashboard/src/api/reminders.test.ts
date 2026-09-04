import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { caregiverLogin } from "./auth";
import { loadLinkedPatients } from "./patients";
import { createReminder, loadReminders } from "./reminders";

const ACCESS_KEY = "smriti.caregiver.access";
const PATIENT_KEY = "smriti.caregiver.patient";

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const patient = {
  user_id: "4ab1e9d8-e390-44a6-9de9-fbd88120a9dc",
  full_name: "Grandmother Demo",
  preferred_language: "as",
  is_primary: true,
};

const waterReminder = {
  id: "797d9ca6-8bd2-41fb-ab87-8771976f554f",
  type: "water",
  title: { en: "A glass of water", as: "এটা গিলাচ পানী" },
  scheduled_time: "2099-09-04T09:00:00Z",
  last_acknowledged_at: null,
  is_active: true,
};

describe("caregiver live-data failures", () => {
  let storage: Storage;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    storage = memoryStorage();
    storage.setItem(ACCESS_KEY, "caregiver-token");
    fetchMock = vi.fn();
    vi.stubGlobal("window", { sessionStorage: storage });
    vi.stubGlobal("navigator", { onLine: true });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reports an expired caregiver token instead of an empty link list", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        { error: { code: "AUTHENTICATION_ERROR", message: "Token is invalid or expired" } },
        401,
      ),
    );

    const result = await loadLinkedPatients();

    expect(result).toEqual({
      ok: false,
      error: {
        kind: "authentication",
        status: 401,
        message: "Your caregiver session expired. Sign in again.",
      },
    });
  });

  it("replaces a stale selected patient with the linked primary patient", async () => {
    storage.setItem(PATIENT_KEY, "patient-from-an-old-database");
    fetchMock.mockResolvedValueOnce(jsonResponse([patient]));

    const result = await loadLinkedPatients();

    expect(result).toEqual({ ok: true, rows: [patient], selected: patient });
    expect(storage.getItem(PATIENT_KEY)).toBe(patient.user_id);
  });

  it("does not substitute demo reminders for a 401", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse([patient]))
      .mockResolvedValueOnce(
        jsonResponse(
          { error: { code: "AUTHENTICATION_ERROR", message: "Token is invalid or expired" } },
          401,
        ),
      );

    const result = await loadReminders();

    expect(result.source).toBe("error");
    expect(result.rows).toEqual([]);
    expect(result.label).toBe("Your caregiver session expired. Sign in again.");
  });

  it("maps the valid water API timestamp instead of showing the defensive fallback", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse([patient]))
      .mockResolvedValueOnce(jsonResponse([waterReminder]));

    const result = await loadReminders();

    expect(result.source).toBe("live");
    expect(result.rows[0]).toMatchObject({
      title: "A glass of water",
      scheduledTime: waterReminder.scheduled_time,
      status: "upcoming",
    });
    expect(result.rows[0].time).not.toBe("Schedule unavailable");
  });

  it("creates a reminder for the verified patient and preserves the API payload", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(waterReminder, 201));

    const result = await createReminder({
      userId: patient.user_id,
      titleEn: "A glass of water",
      type: "water",
      scheduledTime: waterReminder.scheduled_time,
    });

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(request.body))).toMatchObject({
      user_id: patient.user_id,
      title: { en: "A glass of water", as: "A glass of water" },
      scheduled_time: waterReminder.scheduled_time,
    });
  });

  it("returns the exact create authentication failure instead of false", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        { error: { code: "AUTHENTICATION_ERROR", message: "Token is invalid or expired" } },
        401,
      ),
    );

    const result = await createReminder({
      userId: patient.user_id,
      titleEn: "Future reminder",
      type: "custom",
      scheduledTime: "2099-09-05T09:00:00Z",
    });

    expect(result).toEqual({
      ok: false,
      error: {
        kind: "authentication",
        status: 401,
        message: "Your caregiver session expired. Sign in again.",
      },
    });
  });

  it("does not send a create request without a caregiver token", async () => {
    storage.removeItem(ACCESS_KEY);

    const result = await createReminder({
      userId: patient.user_id,
      titleEn: "Future reminder",
      type: "custom",
      scheduledTime: "2099-09-05T09:00:00Z",
    });

    expect(result.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not authenticate into demo mode when the API is unreachable", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    const result = await caregiverLogin("caregiver@example.test", "valid-test-password");

    expect(result).toEqual({ ok: false, message: "The caregiver API could not be reached." });
  });
});
