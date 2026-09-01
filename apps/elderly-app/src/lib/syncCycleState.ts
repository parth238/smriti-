const activeCycles = new Map<string, Promise<{ flushed: number }>>();

export function getActiveSyncCycle(userId: string): Promise<{ flushed: number }> | undefined {
  return activeCycles.get(userId);
}

export function setActiveSyncCycle(userId: string, cycle: Promise<{ flushed: number }>): void {
  activeCycles.set(userId, cycle);
}

export function clearActiveSyncCycle(userId: string, cycle: Promise<{ flushed: number }>): void {
  if (activeCycles.get(userId) === cycle) {
    activeCycles.delete(userId);
  }
}

export function resetSyncCycleForTests(): void {
  activeCycles.clear();
}

export function invalidateActiveSyncCycles(): void {
  activeCycles.clear();
}
