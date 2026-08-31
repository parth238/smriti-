import { useState } from "react";
import { Link } from "react-router-dom";

import { Chrome } from "../components/Chrome";
import { GameSprite } from "../components/GameSprite";
import { Instruction } from "../components/game/Instruction";
import { useI18n } from "../context/LanguageContext";
import type { MessageKey } from "../i18n";
import { GAME_ASSETS, MEMORY_ICONS } from "../data/gameAssets";

const PAGE_SIZE = 4;

const games: {
  to: string;
  key: MessageKey;
  hint: MessageKey;
  sheet: string;
  index: number;
  count: number;
}[] = [
  { to: "/games/memory-match", key: "memoryMatch", hint: "memoryHint", sheet: GAME_ASSETS.memorySheet, index: 3, count: MEMORY_ICONS.length },
  { to: "/games/attention-reaction", key: "attention", hint: "attentionHint", sheet: GAME_ASSETS.attentionSheet, index: 1, count: 5 },
  { to: "/games/sequencing", key: "sequencing", hint: "sequenceHint", sheet: GAME_ASSETS.sequencingSheet, index: 0, count: 5 },
  { to: "/games/picture-naming", key: "pictureNaming", hint: "namingHint", sheet: GAME_ASSETS.namingSheet, index: 2, count: 6 },
  { to: "/games/arithmetic", key: "simpleArithmetic", hint: "arithmeticHint", sheet: GAME_ASSETS.namingSheet, index: 4, count: 6 },
  { to: "/games/path-maze", key: "pathMaze", hint: "pathMazeHint", sheet: GAME_ASSETS.memorySheet, index: 4, count: MEMORY_ICONS.length },
  { to: "/games/face-recall", key: "faceRecall", hint: "faceRecallHint", sheet: GAME_ASSETS.grandmother, index: 0, count: 1 },
];

export function GameSelect() {
  const { tx } = useI18n();
  const [page, setPage] = useState(0);
  const pageCount = Math.ceil(games.length / PAGE_SIZE);
  const slice = games.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const title: MessageKey = page === 0 ? "chooseActivity" : "moreActivities";

  return (
    <main>
      <Chrome backTo="/" />
      <Instruction>{tx(title)}</Instruction>
      <div className="space-y-3">
        {slice.map((game) => (
          <Link key={game.to} to={game.to} className="pressable table-tile flex min-h-[112px] items-center gap-4 px-4">
            {game.count === 1 ? (
              <img src={game.sheet} alt="" className="h-[4.5rem] w-[4.5rem] shrink-0 rounded-xl object-cover" />
            ) : (
              <GameSprite src={game.sheet} index={game.index} count={game.count} className="h-[4.5rem] w-[4.5rem] shrink-0" />
            )}
            <span>
              <span className="block text-button-label">{tx(game.key)}</span>
              <span className="mt-1 block text-body text-mist-blue">{tx(game.hint)}</span>
            </span>
          </Link>
        ))}
      </div>
      {pageCount > 1 ? (
        <div className="mt-6 flex gap-3">
          {page > 0 ? (
            <button type="button" className="pressable flex-1 min-h-[56px] text-button-label" onClick={() => setPage((v) => v - 1)}>
              {tx("back")}
            </button>
          ) : null}
          {page + 1 < pageCount ? (
            <button type="button" className="pressable flex-1 min-h-[56px] text-button-label" onClick={() => setPage((v) => v + 1)}>
              {tx("moreActivities")}
            </button>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}
