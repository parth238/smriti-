import { readAccessToken, readUserId } from "./authStorage";
import { currentAuthLoadGeneration, isAuthLoadCurrent } from "./authLoadGeneration";

export type AuthScopedSnapshot = {
  userId: string | null;
  token: string | null;
  generation: number;
};

export function captureAuthScopedSnapshot(): AuthScopedSnapshot {
  return {
    userId: readUserId(),
    token: readAccessToken(),
    generation: currentAuthLoadGeneration(),
  };
}

export function isAuthScopedSnapshotCurrent(snapshot: AuthScopedSnapshot): boolean {
  return (
    isAuthLoadCurrent(snapshot.generation) &&
    readUserId() === snapshot.userId &&
    readAccessToken() === snapshot.token
  );
}

export {
  bumpAuthLoadGeneration,
  currentAuthLoadGeneration,
  isAuthLoadCurrent,
  resetAuthLoadGenerationForTests,
} from "./authLoadGeneration";
