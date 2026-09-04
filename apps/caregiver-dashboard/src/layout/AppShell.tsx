import { useState } from "react";
import type { ReactNode } from "react";

import { useCaregiverNotifications } from "../hooks/useCaregiverNotifications";
import { Sidebar } from "./Sidebar";

export function AppShell({ children }: { children: ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);

  useCaregiverNotifications(true);

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col mx-auto w-full max-w-7xl">
        <header className="flex items-center gap-3 border-b border-mist-blue/20 bg-rice-white px-4 py-3 md:hidden">
          <button
            type="button"
            className="rounded-lg bg-deep-hill px-3 py-2 text-rice-white"
            aria-label="Open menu"
            onClick={() => setNavOpen(true)}
          >
            ☰
          </button>

          <p className="font-semibold text-deep-hill">
            Smriti Caregiver
          </p>
        </header>

        <main className="page-fade min-w-0 flex-1 px-4 py-5 sm:px-8 sm:py-7">
          {children}
        </main>
      </div>

      {navOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          aria-label="Close menu"
          onClick={() => setNavOpen(false)}
        />
      ) : null}
    </div>
  );
}