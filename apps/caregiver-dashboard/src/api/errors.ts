export type ApiFailureKind = "authentication" | "offline" | "api";

export type ApiFailure = {
  kind: ApiFailureKind;
  message: string;
  status?: number;
};

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
    return {
      kind: "authentication",
      status: response.status,
      message: "Your caregiver session expired. Sign in again.",
    };
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
