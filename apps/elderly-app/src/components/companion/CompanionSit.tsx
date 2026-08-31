import { GAME_ASSETS } from "../../data/gameAssets";

type CompanionSitProps = {
  variant?: "grandmother" | "grandfather";
  speaking?: boolean;
};

export function CompanionSit({ variant = "grandmother", speaking = false }: CompanionSitProps) {
  const src = variant === "grandfather" ? GAME_ASSETS.grandfather : GAME_ASSETS.grandmother;
  const speakClass = speaking ? "companion-speaking" : "";

  return (
    <div className={`companion-enter w-36 companion-sit-breathe ${speakClass}`} aria-hidden="true">
      <img
        src={src}
        alt=""
        className="mx-auto h-52 w-auto max-w-[9rem] object-contain drop-shadow-[0_8px_12px_rgba(30,42,47,0.12)]"
      />
    </div>
  );
}
