import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { signInCaregiver } from "../auth/session";
import { loadCaregiverAnalytics } from "./analytics";
import { caregiverLogin } from "./auth";
import { loadMemories } from "./memories";

const ACCESS_KEY = "smriti.caregiver.access";

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

const session = {
  id: "612bc6fa-9a8e-41de-8584-ef8a3e4a1409",
  game_label: "Attention Garden",
  game_type: "attention_reaction",
  played_at: "2026-09-04T09:43:07.128Z",
  accuracy: 100,
  reaction_time_ms: 875,
  completed_or_quit: "completed",
};

const analytics = {
  avg_accuracy: 100,
  avg_reaction_time_ms: 875,
  sessions_count: 1,
  baseline_comparison: { note: "Within the usual range." },
};

const baseline = {
  avg_accuracy: 84,
  avg_reaction_time_ms: 1100,
};

const trend = {
  points: [{ day: "2026-09-04", accuracy: 100, reaction_time_ms: 875 }],
  baseline_accuracy: 84,
  baseline_reaction_time_ms: 1100,
};

function queueLiveAnalytics(fetchMock: ReturnType<typeof vi.fn>): void {
  fetchMock
    .mockResolvedValueOnce(jsonResponse([patient]))
    .mockResolvedValueOnce(jsonResponse([session]))
    .mockResolvedValueOnce(jsonResponse(analytics))
    .mockResolvedValueOnce(jsonResponse(baseline))
    .mockResolvedValueOnce(jsonResponse(trend));
}

describe("caregiver analytics authentication", () => {
  let storage: Storage;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    storage = memoryStorage();
    storage.setItem(ACCESS_KEY, "expired-caregiver-token");
    fetchMock = vi.fn();
    vi.stubGlobal("window", { sessionStorage: storage });
    vi.stubGlobal("navigator", { onLine: true });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("recognizes a 401 from the shared patient lookup as session expiry", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ error: { message: "Token is invalid or expired" } }, 401),
    );

    const result = await loadCaregiverAnalytics();

    expect(result).toEqual({
      source: "error",
      error: {
        kind: "authentication",
        status: 401,
        message: "Your caregiver session expired. Sign in again.",
      },
    });
  });

  it("does not replace a Sessions 401 with demo rows", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse([patient]))
      .mockResolvedValueOnce(jsonResponse({ error: { message: "Service failed" } }, 500))
      .mockResolvedValueOnce(jsonResponse({ error: { message: "Expired" } }, 401))
      .mockResolvedValueOnce(jsonResponse(baseline))
      .mockResolvedValueOnce(jsonResponse(trend));

    const result = await loadCaregiverAnalytics();

    expect(result.source).toBe("error");
    expect(result).not.toHaveProperty("sessions");
    expect(result).not.toHaveProperty("trends");
    if (result.source === "error") {
      expect(result.error.kind).toBe("authentication");
    }
  });

  it("keeps a non-auth API failure distinguishable", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse([patient]))
      .mockResolvedValueOnce(
        jsonResponse({ error: { message: "Game session service unavailable" } }, 503),
      )
      .mockResolvedValueOnce(jsonResponse(analytics))
      .mockResolvedValueOnce(jsonResponse(baseline))
      .mockResolvedValueOnce(jsonResponse(trend));

    const result = await loadCaregiverAnalytics();

    expect(result).toEqual({
      source: "error",
      error: {
        kind: "api",
        status: 503,
        message: "Game session service unavailable",
      },
    });
  });

  it("returns successful live data without demo substitutions", async () => {
    queueLiveAnalytics(fetchMock);

    const result = await loadCaregiverAnalytics();

    expect(result.source).toBe("live");
    if (result.source === "live") {
      expect(result.patient.label).toBe("Grandmother Demo");
      expect(result.sessions).toHaveLength(1);
      expect(result.sessions[0]).toMatchObject({ game: "Attention Garden", completed: true });
      expect(result.trends).toEqual([{ day: "2026-09-04", accuracy: 100, reactionMs: 875 }]);
    }
  });

  it("keeps an empty live trend empty instead of labeling demo points as live", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse([patient]))
      .mockResolvedValueOnce(jsonResponse([session]))
      .mockResolvedValueOnce(jsonResponse(analytics))
      .mockResolvedValueOnce(jsonResponse({ avg_accuracy: null, avg_reaction_time_ms: null }))
      .mockResolvedValueOnce(
        jsonResponse({ points: [], baseline_accuracy: null, baseline_reaction_time_ms: null }),
      );

    const result = await loadCaregiverAnalytics();

    expect(result.source).toBe("live");
    if (result.source === "live") {
      expect(result.trends).toEqual([]);
      expect(result.patient.baselineAccuracy).toBeNull();
      expect(result.patient.baselineReactionMs).toBeNull();
    }
  });

  it("returns the real session list after a fresh login", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ access_token: "fresh-caregiver-token" }));
    const login = await caregiverLogin("caregiver@example.test", "valid-test-password");
    expect(login.ok).toBe(true);
    if (!login.ok) {
      return;
    }
    signInCaregiver(login.accessToken);
    queueLiveAnalytics(fetchMock);

    const result = await loadCaregiverAnalytics();

    expect(storage.getItem(ACCESS_KEY)).toBe("fresh-caregiver-token");
    expect(result.source).toBe("live");
    if (result.source === "live") {
      expect(result.sessions.map((row) => row.id)).toEqual([session.id]);
    }
  });

  it("does not replace a Memories 401 with demo rows", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse([patient]))
      .mockResolvedValueOnce(jsonResponse({ error: { message: "Expired" } }, 401));

    const result = await loadMemories();

    expect(result.source).toBe("error");
    expect(result.rows).toEqual([]);
    if (result.source === "error") {
      expect(result.error.kind).toBe("authentication");
      expect(result.error.message).toBe("Your caregiver session expired. Sign in again.");
    }
  });
});
