import type { ReactNode } from "react";

export function Notice({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border-l-4 border-marigold bg-white px-4 py-3 text-deep-hill">
      {children}
    </p>
  );
}
