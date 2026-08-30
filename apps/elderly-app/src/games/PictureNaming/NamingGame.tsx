import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Chrome } from "../../components/Chrome";
import { Instruction } from "../../components/game/Instruction";
import { LargeButton } from "../../components/LargeButton";
import { Motif } from "../../components/Motif";
import { useI18n } from "../../context/LanguageContext";
import { useGameSession } from "../../hooks/useGameSession";
import { NAMING_ITEMS, type NameKey } from "./items";

export function NamingGame() {
  const { tx } = useI18n();
  const navigate = useNavigate();
  const { markStarted, recordResult, elapsedSec } = useGameSession();
  const [index, setIndex] = useState(0);
  const [nudge, setNudge] = useState("");
  const errors = useRef(0);
  const current = NAMING_ITEMS[index];

  useEffect(() => {
    markStarted("/games/picture-naming");
  }, [markStarted]);

  if (!current) {
    return null;
  }

  function choose(key: NameKey) {
    if (key !== current.yes) {
      setNudge(tx("tryAgainGentle"));
      errors.current += 1;
      return;
    }
    if (index + 1 >= NAMING_ITEMS.length) {
      const total = NAMING_ITEMS.length;
      const accuracy = Math.max(
        0,
        Math.min(100, Math.round((total / Math.max(total, total + errors.current)) * 100)),
      );
      void recordResult({
        gameType: "picture_naming",
        gamePath: "/games/picture-naming",
        difficulty: 3,
        accuracy,
        reactionTimeMs: Math.round((elapsedSec() * 1000) / total),
        errors: errors.current,
        sessionDurationSec: elapsedSec(),
      }).then(() => {
        navigate("/games/picture-naming/result", { replace: true });
      });
      return;
    }
    setNudge("");
    setIndex((value) => value + 1);
  }

  const choices = index % 2 === 0 ? [current.yes, current.no] : [current.no, current.yes];

  return (
    <main>
      <Chrome backTo="/games" />
      <Instruction>{nudge || tx("namingHint")}</Instruction>
      <div className="photo-plate mb-8">
        <Motif id={current.show} className="h-32 w-32" />
      </div>
      <div className="space-y-4">
        {choices.map((choice) => (
          <LargeButton key={choice} tone="quiet" onClick={() => choose(choice)}>
            {tx(choice)}
          </LargeButton>
        ))}
      </div>
    </main>
  );
}
