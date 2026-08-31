import { GAME_ASSETS } from "../data/gameAssets";

type HillSceneProps = {
  className?: string;
  sun?: boolean;
};

export function HillScene({ className = "" }: HillSceneProps) {
  return (
    <img
      src={GAME_ASSETS.hillLandscape}
      alt=""
      className={`object-cover ${className}`}
      aria-hidden="true"
    />
  );
}
