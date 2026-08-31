import { Chrome } from "../components/Chrome";
import { CompanionSit } from "../components/companion/CompanionSit";
import { LargeButton } from "../components/LargeButton";
import { useI18n } from "../context/LanguageContext";
import { lastSaveNote } from "../hooks/useGameSession";
import { lastGamePath } from "../store/sessionPrefs";
import { Link } from "react-router-dom";

import { useCompanionVoice, useSpeakOnMount } from "../voice/CompanionVoice";

function adaptiveNote(tx: (k: "adaptiveLevel" | "adaptiveEasier" | "adaptiveHarder") => string): string {
  const accuracy = Number(window.sessionStorage.getItem("smriti.lastAccuracy") ?? "0");
  const difficulty = window.sessionStorage.getItem("smriti.lastDifficulty");
  if (!difficulty) {
    return "";
  }
  const trend = accuracy >= 75 ? tx("adaptiveHarder") : accuracy < 50 ? tx("adaptiveEasier") : "";
  return `${tx("adaptiveLevel")} ${difficulty}${trend ? ` · ${trend}` : ""}`;
}

export function GameResult() {
  const { tx } = useI18n();
  const { isSpeaking } = useCompanionVoice();
  useSpeakOnMount("youDidWell", 600);
  const again = lastGamePath();
  const save = lastSaveNote();
  const saveNote =
    save === "queued" ? tx("resultHint") : save === "saved" ? tx("resultSaved") : tx("resultHint");
  const adaptive = adaptiveNote(tx);

  return (
    <main>
      <Chrome backTo="/games" />
      <div className="gamosa-line mb-6" />
      <div className="flex justify-center">
        <CompanionSit speaking={isSpeaking} />
      </div>
      <h1 className="mt-2 font-display text-h1">{tx("youDidWell")}</h1>
      <p className="mt-4 text-body text-mist-blue">{saveNote}</p>
      {adaptive ? <p className="mt-2 text-body text-mist-blue">{adaptive}</p> : null}
      <div className="mt-8 space-y-4">
        <Link to={again} className="block">
          <LargeButton tone="secondary">{tx("playAgain")}</LargeButton>
        </Link>
        <Link to="/games" className="block">
          <LargeButton>{tx("chooseActivity")}</LargeButton>
        </Link>
      </div>
    </main>
  );
}
