import { GameSprite } from "./GameSprite";
import type { MotifId } from "../games/memory";
import { GAME_ASSETS, MEMORY_ICONS, spriteIndex } from "../data/gameAssets";

export type LegacyMotifId = "tea" | "bird" | "lamp" | "cloth" | "river";
export type MotifKind = MotifId | LegacyMotifId | "flower";

type MotifProps = {
  id: MotifKind;
  className?: string;
};

export function Motif({ id, className = "h-16 w-16" }: MotifProps) {
  if ((MEMORY_ICONS as readonly string[]).includes(id)) {
    return (
      <GameSprite
        src={GAME_ASSETS.memorySheet}
        index={spriteIndex(MEMORY_ICONS, id as MotifId)}
        count={MEMORY_ICONS.length}
        className={className}
      />
    );
  }
  if (id === "tea") {
    return (
      <svg viewBox="0 0 80 80" className={className} aria-hidden="true">
        <ellipse cx="36" cy="66" rx="24" ry="7" fill="#4B6E58" opacity="0.28" />
        <path d="M16 32h40v22a18 18 0 0 1-40 0z" fill="#A8342A" />
        <path d="M20 32c3-12 30-12 34 0" fill="#7C93A3" />
        <path d="M22 34h28" stroke="#FBF9F4" strokeWidth="2" opacity="0.35" />
        <path
          d="M56 38h12a9 9 0 0 1 0 18H54"
          fill="none"
          stroke="#1E2A2F"
          strokeWidth="3.4"
          strokeLinecap="round"
        />
        <path className="steam" d="M28 18c2 6 8 6 8 12" fill="none" stroke="#7C93A3" strokeWidth="2.4" />
        <path className="steam steam-late" d="M40 14c3 7 8 6 7 13" fill="none" stroke="#7C93A3" strokeWidth="2.4" />
      </svg>
    );
  }
  if (id === "bird") {
    return (
      <svg viewBox="0 0 80 80" className={className} aria-hidden="true">
        <path
          d="M10 46c16-6 26-20 32-32 14 12 28 20 38 16-10 12-24 22-42 26-14 3-24-2-28-10z"
          fill="#A8342A"
        />
        <path d="M28 28c10 4 22 4 30-2" fill="none" stroke="#E0A542" strokeWidth="3" />
        <circle cx="36" cy="28" r="4" fill="#FBF9F4" />
        <circle cx="37.4" cy="28" r="1.6" fill="#1E2A2F" />
        <path d="M6 44l14 6" stroke="#E0A542" strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "lamp") {
    return (
      <svg viewBox="0 0 80 80" className={className} aria-hidden="true">
        <ellipse cx="40" cy="40" rx="18" ry="18" fill="#E0A542" opacity="0.22" />
        <path d="M40 10c14 14 16 24 14 36H26c-2-12 0-22 14-36z" fill="#E0A542" />
        <path d="M34 22c4-2 8-2 12 0" stroke="#FBF9F4" strokeWidth="2" opacity="0.55" />
        <rect x="36" y="46" width="8" height="16" rx="1.5" fill="#1E2A2F" />
        <ellipse cx="40" cy="66" rx="18" ry="6" fill="#4B6E58" />
      </svg>
    );
  }
  if (id === "cloth") {
    return (
      <svg viewBox="0 0 80 80" className={className} aria-hidden="true">
        <rect x="8" y="16" width="64" height="48" rx="4" fill="#FBF9F4" stroke="#A8342A" strokeWidth="4" />
        <path d="M8 24h64M8 56h64" stroke="#A8342A" strokeWidth="7" />
        <path d="M16 36h12M52 36h12M16 44h8M56 44h8" stroke="#A8342A" strokeWidth="4" />
      </svg>
    );
  }
  if (id === "river") {
    return (
      <svg viewBox="0 0 80 80" className={className} aria-hidden="true">
        <path d="M4 22c16-10 28 8 40-2s24 10 36-2v48c-12 10-24-6-36 4s-24-8-40 2z" fill="#7C93A3" opacity="0.35" />
        <path
          d="M4 32c16 12 20-12 36 0s20-12 36 0"
          fill="none"
          stroke="#7C93A3"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M4 46c16 12 20-12 36 0s20-12 36 0"
          fill="none"
          stroke="#4B6E58"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M4 60c16 12 20-12 36 0s20-12 36 0"
          fill="none"
          stroke="#7C93A3"
          strokeWidth="4"
          opacity="0.55"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 80 80" className={`bloom-flower ${className}`} aria-hidden="true">
      <ellipse cx="40" cy="70" rx="16" ry="5" fill="#4B6E58" opacity="0.3" />
      <path d="M40 44v24" stroke="#4B6E58" strokeWidth="4" />
      <circle cx="40" cy="24" r="10" fill="#E0A542" />
      <circle cx="24" cy="34" r="10" fill="#A8342A" />
      <circle cx="56" cy="34" r="10" fill="#A8342A" />
      <circle cx="28" cy="18" r="9" fill="#A8342A" />
      <circle cx="52" cy="18" r="9" fill="#A8342A" />
      <circle cx="40" cy="30" r="8" fill="#E0A542" />
    </svg>
  );
}

type StepId = "stepWake" | "stepMedicine" | "stepMeal" | "stepCall" | "stepBed";

export function TeaStep({ id, className = "h-12 w-12" }: { id: StepId; className?: string }) {
  const index = ["stepWake", "stepMedicine", "stepMeal", "stepCall", "stepBed"].indexOf(id);
  return (
    <GameSprite
      src={GAME_ASSETS.sequencingSheet}
      index={Math.max(0, index)}
      count={5}
      className={className}
    />
  );
}
