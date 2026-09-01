let authLoadGeneration = 0;

export function bumpAuthLoadGeneration(): number {
  authLoadGeneration += 1;
  return authLoadGeneration;
}

export function currentAuthLoadGeneration(): number {
  return authLoadGeneration;
}

export function resetAuthLoadGenerationForTests(): void {
  authLoadGeneration = 0;
}

export function isAuthLoadCurrent(generation: number): boolean {
  return generation === authLoadGeneration;
}
