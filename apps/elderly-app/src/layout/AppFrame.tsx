import { useLocation } from "react-router-dom";
import type { ReactNode } from "react";

import { HillScene } from "../components/HillScene";

export function AppFrame({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  if (pathname === "/splash") {
    return (
      <div className="splash-root">
        <HillScene className="splash-sky" />
        {children}
      </div>
    );
  }
  return (
    <div className="cloth-bg">
      <div className="page-enter mx-auto min-h-screen max-w-md px-5 py-6">{children}</div>
    </div>
  );
}
