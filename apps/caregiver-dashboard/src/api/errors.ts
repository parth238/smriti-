export type ApiFailureKind = "authentication" | "offline" | "api";

export type ApiFailure = {
  kind: ApiFailureKind;
  message: string;
  status?: number;
};

export type CaregiverDataFailure =
  | ApiFailure
  | { kind: "no-patient"; message: string };

type ErrorEnvelope = {
  error?: {
    message?: unknown;
  };
};

export async function failureFromResponse(
  response: Response,
  fallbackMessage: string,
): Promise<ApiFailure> {
  let backendMessage: string | undefined;
  try {
    const body = (await response.json()) as ErrorEnvelope;
    if (typeof body.error?.message === "string") {
      backendMessage = body.error.message;
    }
  } catch {
    // The status still provides an honest failure when the body is not JSON.
  }

  if (response.status === 401) {
    return expiredSessionFailure(response.status);
  }
  return {
    kind: "api",
    status: response.status,
    message: backendMessage || fallbackMessage,
  };
}

export function offlineFailure(message: string): ApiFailure {
  return { kind: "offline", message };
}

export function expiredSessionFailure(status?: number): ApiFailure {
  return {
    kind: "authentication",
    status,
    message: "Your caregiver session expired. Sign in again.",
  };
}

export function noPatientFailure(): CaregiverDataFailure {
  return {
    kind: "no-patient",
    message: "No linked family member is available. Add or seed one before continuing.",
  };
}
