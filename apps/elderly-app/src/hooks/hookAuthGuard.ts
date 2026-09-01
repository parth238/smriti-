import type { AuthScopedSnapshot } from "../lib/authLoadScope";
import { currentAuthLoadGeneration } from "../lib/authLoadGeneration";

export function shouldApplyAuthScopedResult(
  snapshot: AuthScopedSnapshot,
  userId: string | null,
  token: string | null,
  generation = currentAuthLoadGeneration(),
): boolean {
  return snapshot.generation === generation && snapshot.userId === userId && snapshot.token === token;
}
