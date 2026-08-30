import { Link } from "react-router-dom";

import { Chrome } from "../components/Chrome";
import { Instruction } from "../components/game/Instruction";
import { Motif, type MotifKind } from "../components/Motif";
import { useI18n } from "../context/LanguageContext";
import type { MessageKey } from "../i18n";

const games: {
  to: string;
  key: MessageKey;
  hint: MessageKey;
  motif: MotifKind;
}[] = [
  {
    to: "/games/memory-match",
    key: "memoryMatch",
    hint: "memoryHint",
    motif: "cloth",
  },
  {
    to: "/games/attention-reaction",
    key: "attention",
    hint: "attentionHint",
    motif: "flower",
  },
  {
    to: "/games/sequencing",
    key: "sequencing",
    hint: "sequenceHint",
    motif: "tea",
  },
  {
    to: "/games/picture-naming",
    key: "pictureNaming",
    hint: "namingHint",
    motif: "bird",
  },
];

export function GameSelect() {
  const { tx } = useI18n();
  return (
    <main>
      <Chrome backTo="/" />
      <Instruction>{tx("chooseActivity")}</Instruction>
      <div className="space-y-3">
        {games.map((game) => (
          <Link
            key={game.to}
            to={game.to}
            className="pressable table-tile flex min-h-[112px] items-center gap-4 px-4"
          >
            <Motif id={game.motif} className="h-[4.5rem] w-[4.5rem] shrink-0" />
            <span>
              <span className="block text-button-label">{tx(game.key)}</span>
              <span className="mt-1 block text-body text-mist-blue">{tx(game.hint)}</span>
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
