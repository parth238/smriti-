type GameSpriteProps = {
  src: string;
  index: number;
  count: number;
  className?: string;
};

/** Crops one frame from a horizontal sprite strip. */
export function GameSprite({ src, index, count, className = "h-16 w-16" }: GameSpriteProps) {
  const xPos = count <= 1 ? 0 : (index / (count - 1)) * 100;

  return (
    <span
      className={`inline-block shrink-0 bg-no-repeat ${className}`}
      style={{
        backgroundImage: `url(${src})`,
        backgroundSize: `${count * 100}% 100%`,
        backgroundPosition: `${xPos}% 0`,
      }}
      aria-hidden="true"
    />
  );
}
