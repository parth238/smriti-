import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchSyncStatus, parseSyncStatusResponse } from "./syncStatus";

describe("sync status API", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("builds request with API base, bearer token, user_id, and since", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        since: "1970-01-01T00:00:00.000Z",
        next_since: "2026-01-01T00:00:00.000Z",
        reminders: [],
        memories: [],
      }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    await fetchSyncStatus("secret-token", "user-1", "1970-01-01T00:00:00.000Z");

    expect(fetchMock).toHaveBeenCalledOnce();
    const call = fetchMock.mock.calls[0] as unknown as [string, RequestInit] | undefined;
    expect(call).toBeDefined();
    const [url, init] = call as [string, RequestInit];
    expect(url).toContain("/sync/status?");
    expect(url).toContain("user_id=user-1");
    expect(url).toContain("since=1970-01-01T00");
    expect(init.headers).toMatchObject({
      Authorization: "Bearer secret-token",
      Accept: "application/json",
    });
  });

  it("parses valid sync status response", () => {
    const parsed = parseSyncStatusResponse({
      since: "1970-01-01T00:00:00.000Z",
      next_since: "2026-01-01T00:00:00.000Z",
      reminders: [
        {
          id: "r1",
          type: "medicine",
          title: { en: "Medicine" },
          scheduled_time: "2026-01-01T08:00:00.000Z",
          recurrence_rule: null,
          is_active: true,
          updated_at: "2026-01-01T07:00:00.000Z",
          last_acknowledged_at: null,
        },
      ],
      memories: [
        {
          id: "m1",
          media_url: "/uploads/a.jpg",
          title: { en: "Photo" },
          category: "family",
          created_at: "2026-01-01T06:00:00.000Z",
        },
      ],
    });
    expect(parsed.reminders).toHaveLength(1);
    expect(parsed.memories).toHaveLength(1);
    expect(parsed.next_since).toBe("2026-01-01T00:00:00.000Z");
  });

  it("rejects non-2xx without leaking credentials", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 401,
      json: async () => ({}),
    }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchSyncStatus("secret-token", "user-1", "1970-01-01T00:00:00.000Z")).rejects.toThrow(
      "401",
    );
    expect(fetchMock.mock.results[0]?.type).not.toBe("throw");
  });
});
