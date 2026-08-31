import { GAME_ASSETS } from "../../data/gameAssets";

type WalkProps = {
  moving?: boolean;
};

export function CompanionWalk({ moving = true }: WalkProps) {
  const walkClass = moving ? "companion-walk" : "";

  return (
    <div className={`${walkClass} relative w-32 companion-sway`} aria-hidden="true">
      <img
        src={GAME_ASSETS.grandmother}
        alt=""
        className="relative z-[1] mx-auto h-48 w-auto max-w-[8rem] object-contain drop-shadow-[0_10px_14px_rgba(30,42,47,0.14)]"
      />
      <svg
        viewBox="0 0 40 120"
        className="absolute bottom-2 left-0 z-[2] h-28 w-8"
        aria-hidden="true"
      >
        <path d="M20 8v88" stroke="#1E2A2F" strokeWidth="5" strokeLinecap="round" />
        <path d="M12 6c6-4 12-4 18 0" stroke="#E0A542" strokeWidth="2.5" fill="none" />
        <ellipse cx="20" cy="100" rx="8" ry="3" fill="#1E2A2F" opacity="0.2" />
      </svg>
    </div>
  );
}
