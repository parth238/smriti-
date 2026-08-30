import type { ReactNode } from "react";

export function Instruction({ children }: { children: ReactNode }) {
  return <p className="instruction">{children}</p>;
}
