import { Navigate, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";

import { isCaregiverSignedIn } from "./auth/session";
import { AppShell } from "./layout/AppShell";
import { Alerts } from "./pages/Alerts";
import { Analytics } from "./pages/Analytics";
import { Login } from "./pages/Login";
import { StoryMode } from "./pages/StoryMode";
import { Memories } from "./pages/Memories";
import { Overview } from "./pages/Overview";
import { Reminders } from "./pages/Reminders";
import { Sessions } from "./pages/Sessions";
import { Settings } from "./pages/Settings";

function Gate({ children }: { children: ReactNode }) {
  if (!isCaregiverSignedIn()) {
    return <Navigate to="/login" replace />;
  }
  return <AppShell>{children}</AppShell>;
}

export function App() {
  return (
    <Routes>
      <Route path="/story" element={<StoryMode />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <Gate>
            <Overview />
          </Gate>
        }
      />
      <Route
        path="/analytics"
        element={
          <Gate>
            <Analytics />
          </Gate>
        }
      />
      <Route
        path="/sessions"
        element={
          <Gate>
            <Sessions />
          </Gate>
        }
      />
      <Route
        path="/reminders"
        element={
          <Gate>
            <Reminders />
          </Gate>
        }
      />
      <Route
        path="/memories"
        element={
          <Gate>
            <Memories />
          </Gate>
        }
      />
      <Route
        path="/alerts"
        element={
          <Gate>
            <Alerts />
          </Gate>
        }
      />
      <Route
        path="/settings"
        element={
          <Gate>
            <Settings />
          </Gate>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
