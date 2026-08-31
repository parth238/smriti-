import { clampDifficulty } from "../../lib/adaptive";

export type ArithmeticProblem = {
  left: number;
  right: number;
  op: "+" | "-";
  answer: number;
  choices: number[];
};

export function arithmeticMaxOperand(difficulty: number): number {
  const level = clampDifficulty(difficulty);
  if (level <= 1) return 5;
  if (level === 2) return 9;
  if (level === 3) return 12;
  if (level === 4) return 15;
  return 20;
}

function uniqueChoices(answer: number, count: number): number[] {
  const set = new Set<number>([answer]);
  while (set.size < count) {
    const delta = Math.floor(Math.random() * 5) + 1;
    set.add(answer + (Math.random() > 0.5 ? delta : -delta));
  }
  return Array.from(set).sort(() => Math.random() - 0.5);
}

export function buildArithmeticProblem(difficulty: number): ArithmeticProblem {
  const max = arithmeticMaxOperand(difficulty);
  const a = Math.floor(Math.random() * max) + 1;
  const b = Math.floor(Math.random() * max) + 1;
  const subtract = Math.random() > 0.5;
  const left = subtract ? Math.max(a, b) : a;
  const right = subtract ? Math.min(a, b) : b;
  const answer = subtract ? left - right : left + right;
  return {
    left,
    right,
    op: subtract ? "-" : "+",
    answer,
    choices: uniqueChoices(answer, 4),
  };
}

export function formatProblem(problem: ArithmeticProblem): string {
  return `${problem.left} ${problem.op} ${problem.right}`;
}
