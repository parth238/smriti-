import { Link } from "react-router-dom";

import { Chrome } from "../components/Chrome";
import { GameSprite } from "../components/GameSprite";
import { Instruction } from "../components/game/Instruction";
import { useI18n } from "../context/LanguageContext";
import type { MessageKey } from "../i18n";
import { GAME_ASSETS, MEMORY_ICONS } from "../data/gameAssets";

const games: {
  to: string;
  key: MessageKey;
  hint: MessageKey;
  sheet: string;
  index: number;
  count: number;
}[] = [
  {
    to: "/games/memory-match",
    key: "memoryMatch",
    hint: "memoryHint",
    sheet: GAME_ASSETS.memorySheet,
    index: 3,
    count: MEMORY_ICONS.length,
  },
  {
    to: "/games/attention-reaction",
    key: "attention",
    hint: "attentionHint",
    sheet: GAME_ASSETS.attentionSheet,
    index: 1,
    count: 5,
  },
  {
    to: "/games/sequencing",
    key: "sequencing",
    hint: "sequenceHint",
    sheet: GAME_ASSETS.sequencingSheet,
    index: 0,
    count: 5,
  },
  {
    to: "/games/picture-naming",
    key: "pictureNaming",
    hint: "namingHint",
    sheet: GAME_ASSETS.namingSheet,
    index: 2,
    count: 6,
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
            <GameSprite
              src={game.sheet}
              index={game.index}
              count={game.count}
              className="h-[4.5rem] w-[4.5rem] shrink-0"
            />
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
