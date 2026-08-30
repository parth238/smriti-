import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Chrome } from "../../components/Chrome";
import { Instruction } from "../../components/game/Instruction";
import { LargeButton } from "../../components/LargeButton";
import { Motif } from "../../components/Motif";
import { useI18n } from "../../context/LanguageContext";
import { rememberGame } from "../../store/demoStore";
import { NAMING_ITEMS, type NameKey } from "./items";

export function NamingGame() {
  const { tx } = useI18n();
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [nudge, setNudge] = useState("");
  const current = NAMING_ITEMS[index];

  useEffect(() => {
    rememberGame("/games/picture-naming");
  }, []);

  if (!current) {
    return null;
  }

  function choose(key: NameKey) {
    if (key !== current.yes) {
      setNudge(tx("tryAgainGentle"));
      return;
    }
    if (index + 1 >= NAMING_ITEMS.length) {
      navigate("/games/picture-naming/result", { replace: true });
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
