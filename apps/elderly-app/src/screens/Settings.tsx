import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Chrome } from "../components/Chrome";
import { LargeButton } from "../components/LargeButton";
import { useI18n } from "../context/LanguageContext";
import { clearAuthSession } from "../lib/authStorage";
import { useCompanionVoice } from "../voice/CompanionVoice";

export function Settings() {
  const { tx, language, setLanguage, textSize, setTextSize } = useI18n();
  const { voiceEnabled, setVoiceEnabled, speechAvailable, listenAvailable } = useCompanionVoice();
  const [confirm, setConfirm] = useState(false);
  const navigate = useNavigate();

  return (
    <main>
      <Chrome backTo="/" />
      <h1 className="font-display text-h1">{tx("settings")}</h1>
      <section className="mt-8">
        <p className="mb-3 text-body">{tx("language")}</p>
        <div className="grid grid-cols-2 gap-tap">
          <LargeButton
            tone={language === "en" ? "primary" : "quiet"}
            onClick={() => setLanguage("en")}
          >
            {tx("english")}
          </LargeButton>
          <LargeButton
            tone={language === "as" ? "primary" : "quiet"}
            onClick={() => setLanguage("as")}
          >
            {tx("assamese")}
          </LargeButton>
        </div>
      </section>
      <section className="mt-8">
        <p className="mb-3 text-body">{tx("textSize")}</p>
        <div className="grid grid-cols-2 gap-tap">
          <LargeButton
            tone={textSize === "comfortable" ? "secondary" : "quiet"}
            onClick={() => setTextSize("comfortable")}
          >
            {tx("textSizeComfortable")}
          </LargeButton>
          <LargeButton
            tone={textSize === "large" ? "secondary" : "quiet"}
            onClick={() => setTextSize("large")}
          >
            {tx("textSizeLarge")}
          </LargeButton>
        </div>
      </section>
      <section className="mt-8">
        <p className="mb-3 text-body">{tx("voiceCompanion")}</p>
        {!speechAvailable ? (
          <p className="text-body text-mist-blue">{tx("voiceUnavailable")}</p>
        ) : (
          <div className="grid grid-cols-2 gap-tap">
            <LargeButton
              tone={voiceEnabled ? "secondary" : "quiet"}
              onClick={() => setVoiceEnabled(true)}
            >
              {tx("voiceOn")}
            </LargeButton>
            <LargeButton
              tone={!voiceEnabled ? "secondary" : "quiet"}
              onClick={() => setVoiceEnabled(false)}
            >
              {tx("voiceOff")}
            </LargeButton>
          </div>
        )}
        {speechAvailable && !listenAvailable ? (
          <p className="mt-3 text-body text-mist-blue">{tx("micUnavailable")}</p>
        ) : null}
      </section>
      <section className="mt-10">
        {confirm ? (
          <div className="space-y-4">
            <p className="text-body-lg">{tx("signOutConfirm")}</p>
            <LargeButton
              onClick={() => {
                clearAuthSession();
                window.sessionStorage.removeItem("smriti.splash");
                navigate("/login", { replace: true });
              }}
            >
              {tx("signOut")}
            </LargeButton>
            <LargeButton tone="quiet" onClick={() => setConfirm(false)}>
              {tx("cancel")}
            </LargeButton>
          </div>
        ) : (
          <LargeButton tone="quiet" onClick={() => setConfirm(true)}>
            {tx("signOut")}
          </LargeButton>
        )}
      </section>
    </main>
  );
}
