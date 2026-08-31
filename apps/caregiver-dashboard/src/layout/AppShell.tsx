import type { ReactNode } from "react";

import { useCaregiverNotifications } from "../hooks/useCaregiverNotifications";
import { Sidebar } from "./Sidebar";

export function AppShell({ children }: { children: ReactNode }) {
  useCaregiverNotifications(true);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="page-fade min-w-0 flex-1 px-8 py-7">{children}</main>
    </div>
  );
}
