export type MazeCell = { row: number; col: number };

/** Seeded pseudo-random for reproducible demos per grid size. */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

/**
 * Winding path with occasional detours — not a straight snake.
 * Visuospatial: user must follow glowing next step, not memorize a line.
 */
export function generateMazePath(size: number): MazeCell[] {
  const rand = seededRandom(size * 7919 + 104729);
  const path: MazeCell[] = [{ row: 0, col: 0 }];
  let row = 0;
  let col = 0;

  while (row < size - 1 || col < size - 1) {
    const canDown = row + 1 < size;
    const canRight = col + 1 < size;
    if (!canDown) {
      col += 1;
    } else if (!canRight) {
      row += 1;
    } else {
      const distDown = size - 1 - (row + 1) + (size - 1 - col);
      const distRight = size - 1 - row + (size - 1 - (col + 1));
      const biasDown = distDown <= distRight ? 0.65 : 0.35;
      if (rand() < biasDown) {
        row += 1;
      } else {
        col += 1;
      }
    }
    path.push({ row, col });
  }

  return path;
}

export function isOnPath(path: MazeCell[], cell: MazeCell): boolean {
  return path.some((step) => step.row === cell.row && step.col === cell.col);
}

export function nextPathStep(path: MazeCell[], progress: number): MazeCell | null {
  return path[progress] ?? null;
}

/** Cells adjacent to path that are traps (wrong taps). */
export function deadEndCells(path: MazeCell[], size: number): Set<string> {
  const onPath = new Set(path.map((c) => `${c.row}-${c.col}`));
  const dead = new Set<string>();
  for (const step of path) {
    for (const [dr, dc] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const r = step.row + dr;
      const c = step.col + dc;
      if (r < 0 || c < 0 || r >= size || c >= size) {
        continue;
      }
      const key = `${r}-${c}`;
      if (!onPath.has(key)) {
        dead.add(key);
      }
    }
  }
  return dead;
}
