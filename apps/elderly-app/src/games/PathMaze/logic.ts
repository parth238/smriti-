export type MazeCell = { row: number; col: number };

/** Deterministic snake path from top-left to bottom-right for demo reliability. */
export function generateMazePath(size: number): MazeCell[] {
  const path: MazeCell[] = [{ row: 0, col: 0 }];
  let row = 0;
  let col = 0;
  while (row < size - 1 || col < size - 1) {
    if (row < size - 1 && (col === size - 1 || row <= col)) {
      row += 1;
    } else {
      col += 1;
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
