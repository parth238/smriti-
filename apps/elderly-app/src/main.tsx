import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { registerSW } from "virtual:pwa-register";

import { App } from "./App";
import { LanguageProvider } from "./context/LanguageContext";
import { OfflineSyncProvider } from "./context/OfflineSyncContext";
import { CompanionVoiceProvider } from "./voice/CompanionVoice";
import { startReminderScheduler } from "./lib/reminderScheduler";
import "./index.css";

registerSW({ immediate: true });

startReminderScheduler();

if ("serviceWorker" in navigator && "SyncManager" in window) {
  void navigator.serviceWorker.ready.then((registration) => {
    const syncReg = registration as ServiceWorkerRegistration & {
      sync?: { register: (tag: string) => Promise<void> };
    };
    void syncReg.sync?.register("smriti-outbox-flush");
  });
}

const root = document.getElementById("root");
if (!root) {
  throw new Error("Root element is missing");
}

createRoot(root).render(
  <StrictMode>
    <LanguageProvider>
      <CompanionVoiceProvider>
        <OfflineSyncProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </OfflineSyncProvider>
      </CompanionVoiceProvider>
    </LanguageProvider>
  </StrictMode>,
);
