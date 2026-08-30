import { Chrome } from "../components/Chrome";
import { CompanionSit } from "../components/companion/CompanionSit";
import { LargeButton } from "../components/LargeButton";
import { useI18n } from "../context/LanguageContext";
import { lastSaveNote } from "../hooks/useGameSession";
import { lastGamePath } from "../store/demoStore";
import { Link } from "react-router-dom";

export function GameResult() {
  const { tx } = useI18n();
  const again = lastGamePath();
  const save = lastSaveNote();
  const saveNote =
    save === "queued" ? tx("resultHint") : save === "saved" ? tx("resultSaved") : tx("resultHint");

  return (
    <main>
      <Chrome backTo="/games" />
      <div className="gamosa-line mb-6" />
      <div className="flex justify-center">
        <CompanionSit />
      </div>
      <h1 className="mt-2 font-display text-h1">{tx("youDidWell")}</h1>
      <p className="mt-4 text-body text-mist-blue">{saveNote}</p>
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
