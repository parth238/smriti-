import { readAccessToken, readUserId } from "./authStorage";

export class SessionChangedError extends Error {
  constructor() {
    super("session_changed");
    this.name = "SessionChangedError";
  }
}

export function sessionsMatch(expectedUserId: string, expectedToken: string): boolean {
  return readUserId() === expectedUserId && readAccessToken() === expectedToken;
}

export function assertActiveSession(expectedUserId: string, expectedToken: string): void {
  if (!sessionsMatch(expectedUserId, expectedToken)) {
    throw new SessionChangedError();
  }
}
