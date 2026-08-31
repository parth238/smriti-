import { describe, expect, it } from "vitest";

import { arithmeticMaxOperand, mazeGridSize } from "../lib/adaptive";
import { generateMazePath, isOnPath } from "./PathMaze/logic";

describe("maze path", () => {
  it("runs corner to corner with adjacent steps", () => {
    const path = generateMazePath(4);
    expect(path[0]).toEqual({ row: 0, col: 0 });
    expect(path[path.length - 1]).toEqual({ row: 3, col: 3 });
    for (let i = 1; i < path.length; i += 1) {
      const prev = path[i - 1];
      const step = path[i];
      expect(Math.abs(step.row - prev.row) + Math.abs(step.col - prev.col)).toBe(1);
    }
  });

  it("scales grid by difficulty", () => {
    expect(mazeGridSize(1)).toBe(3);
    expect(mazeGridSize(5)).toBe(5);
    expect(isOnPath(generateMazePath(3), { row: 0, col: 0 })).toBe(true);
  });
});

describe("arithmetic adaptive", () => {
  it("raises operand cap with difficulty", () => {
    expect(arithmeticMaxOperand(1)).toBeLessThan(arithmeticMaxOperand(5));
  });
});
