import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Chrome } from "../../components/Chrome";
import { Instruction } from "../../components/game/Instruction";
import { ProgressDots } from "../../components/game/ProgressDots";
import { Motif } from "../../components/Motif";
import { useI18n } from "../../context/LanguageContext";
import { rememberGame } from "../../store/demoStore";
import { dealMemoryCards, type MemoryCard } from "../memory";
import { evaluateFlip } from "../memory/flip";

export function MemoryMatch() {
  const { tx } = useI18n();
  const navigate = useNavigate();
  const [cards] = useState<MemoryCard[]>(() => dealMemoryCards());
  const [open, setOpen] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [locked, setLocked] = useState(false);
  const [nudge, setNudge] = useState("");

  useEffect(() => {
    rememberGame("/games/memory-match");
  }, []);

  useEffect(() => {
    if (matched.length !== 4) {
      return undefined;
    }
    setNudge(tx("allPairs"));
    const timer = window.setTimeout(() => {
      navigate("/games/memory-match/result", { replace: true });
    }, 900);
    return () => window.clearTimeout(timer);
  }, [matched.length, navigate, tx]);

  function onTap(card: MemoryCard) {
    if (locked || open.includes(card.uid) || matched.includes(card.motif)) {
      return;
    }
    const next = [...open, card.uid];
    setOpen(next);
    setNudge("");
    const result = evaluateFlip(cards, next);
    if (result.kind === "wait") {
      return;
    }
    if (result.kind === "match") {
      setMatched((current) => [...current, result.motif]);
      setOpen([]);
      setNudge(tx("pairFound"));
      return;
    }
    setLocked(true);
    setNudge(tx("tryAgainGentle"));
    window.setTimeout(() => {
      setOpen([]);
      setLocked(false);
    }, 1000);
  }

  return (
    <main>
      <Chrome backTo="/games" />
      <Instruction>{nudge || tx("memoryHint")}</Instruction>
      <ProgressDots total={4} filled={matched.length} />
      <div className="grid grid-cols-2 gap-3">
        {cards.map((card) => {
          const faceUp = open.includes(card.uid) || matched.includes(card.motif);
          return (
            <button
              key={card.uid}
              type="button"
              className="tile-flip pressable min-h-[132px]"
              aria-label={faceUp ? card.motif : tx("memoryMatch")}
              onClick={() => onTap(card)}
            >
              <span className={`tile-flip-inner ${faceUp ? "is-up" : ""}`}>
                <span className="tile-flip-face tile-back" />
                <span className="tile-flip-face tile-front">
                  <Motif id={card.motif} className="h-16 w-16" />
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </main>
  );
}
