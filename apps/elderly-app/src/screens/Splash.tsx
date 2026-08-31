import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { CompanionWalk } from "../components/companion/CompanionWalk";
import { HillScene } from "../components/HillScene";
import { LargeButton } from "../components/LargeButton";
import { useI18n } from "../context/LanguageContext";
import { useCompanionVoice, useSpeakOnMount } from "../voice/CompanionVoice";

function goNext(navigate: ReturnType<typeof useNavigate>) {
  window.sessionStorage.setItem("smriti.splash", "1");
  const paired = window.sessionStorage.getItem("smriti.paired");
  navigate(paired === "1" ? "/" : "/login", { replace: true });
}

export function Splash() {
  const navigate = useNavigate();
  const { tx } = useI18n();
  const { isSpeaking } = useCompanionVoice();
  useSpeakOnMount("splashWelcome", 900);

  useEffect(() => {
    const timer = window.setTimeout(() => goNext(navigate), 4200);
    return () => window.clearTimeout(timer);
  }, [navigate]);

  return (
    <main className="relative mx-auto flex min-h-screen max-w-md flex-col justify-between overflow-hidden px-6 pb-10 pt-12">
      <HillScene className="splash-sky hill-drift" sun />
      <div className="splash-mist" aria-hidden="true" />
      <div className="companion-track splash-path">
        <CompanionWalk moving speaking={isSpeaking} />
      </div>
      <div className="relative z-10">
        <p className="text-body text-mist-blue">{tx("splashRegion")}</p>
        <h1 className="font-display text-display">{tx("appName")}</h1>
        <p className="mt-3 max-w-[18ch] text-body-lg">{tx("splashWelcome")}</p>
      </div>
      <div className="relative z-10">
        <div className="gamosa-line gamosa-draw mb-6 w-full" />
        <LargeButton onClick={() => goNext(navigate)}>{tx("splashSkip")}</LargeButton>
      </div>
    </main>
  );
}
