import { API_BASE } from "./auth";

export type SyncStatusReminder = {
  id: string;
  type: string;
  title: Record<string, string>;
  scheduled_time: string;
  recurrence_rule: string | null;
  is_active: boolean;
  updated_at: string;
  last_acknowledged_at: string | null;
};

export type SyncStatusMemory = {
  id: string;
  media_url: string;
  title: Record<string, string>;
  category: string;
  created_at: string;
};

export type SyncStatusResponse = {
  since: string | null;
  next_since: string;
  reminders: SyncStatusReminder[];
  memories: SyncStatusMemory[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function parseReminder(value: unknown): SyncStatusReminder | null {
  if (!isRecord(value)) {
    return null;
  }
  if (
    !isString(value.id) ||
    !isString(value.type) ||
    !isRecord(value.title) ||
    !isString(value.scheduled_time) ||
    !isString(value.updated_at) ||
    typeof value.is_active !== "boolean"
  ) {
    return null;
  }
  return {
    id: value.id,
    type: value.type,
    title: value.title as Record<string, string>,
    scheduled_time: value.scheduled_time,
    recurrence_rule: typeof value.recurrence_rule === "string" ? value.recurrence_rule : null,
    is_active: value.is_active,
    updated_at: value.updated_at,
    last_acknowledged_at:
      value.last_acknowledged_at === null || typeof value.last_acknowledged_at === "string"
        ? (value.last_acknowledged_at as string | null)
        : null,
  };
}

function parseMemory(value: unknown): SyncStatusMemory | null {
  if (!isRecord(value)) {
    return null;
  }
  if (
    !isString(value.id) ||
    !isString(value.media_url) ||
    !isRecord(value.title) ||
    !isString(value.category) ||
    !isString(value.created_at)
  ) {
    return null;
  }
  return {
    id: value.id,
    media_url: value.media_url,
    title: value.title as Record<string, string>,
    category: value.category,
    created_at: value.created_at,
  };
}

export function parseSyncStatusResponse(body: unknown): SyncStatusResponse {
  if (!isRecord(body)) {
    throw new Error("Sync status response must be an object");
  }
  if (!isString(body.next_since)) {
    throw new Error("Sync status response missing next_since");
  }
  if (Number.isNaN(Date.parse(body.next_since))) {
    throw new Error("Sync status next_since is not a valid timestamp");
  }
  if (!Array.isArray(body.reminders) || !Array.isArray(body.memories)) {
    throw new Error("Sync status response must include reminders and memories arrays");
  }
  const reminders: SyncStatusReminder[] = [];
  for (const item of body.reminders) {
    const parsed = parseReminder(item);
    if (!parsed) {
      throw new Error("Invalid reminder in sync status response");
    }
    reminders.push(parsed);
  }
  const memories: SyncStatusMemory[] = [];
  for (const item of body.memories) {
    const parsed = parseMemory(item);
    if (!parsed) {
      throw new Error("Invalid memory in sync status response");
    }
    memories.push(parsed);
  }
  const since =
    body.since === null || body.since === undefined
      ? null
      : typeof body.since === "string"
        ? body.since
        : null;
  return {
    since,
    next_since: body.next_since,
    reminders,
    memories,
  };
}

export async function fetchSyncStatus(
  token: string,
  userId: string,
  since: string,
): Promise<SyncStatusResponse> {
  const params = new URLSearchParams({
    user_id: userId,
    since,
  });
  const response = await fetch(`${API_BASE}/sync/status?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`Sync status request failed with status ${response.status}`);
  }
  const body: unknown = await response.json();
  return parseSyncStatusResponse(body);
}
