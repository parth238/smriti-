type WalkProps = {
  moving?: boolean;
};

export function CompanionWalk({ moving = true }: WalkProps) {
  const walkClass = moving ? "companion-walk" : "";
  const bobClass = moving ? "companion-bob" : "";
  const legClass = moving ? "companion-legs" : "";

  return (
    <div className={`${walkClass} w-32 companion-sway`} aria-hidden="true">
      <div className={bobClass}>
        <svg viewBox="0 0 160 220" className="h-48 w-32">
          <ellipse cx="78" cy="208" rx="42" ry="9" fill="#7C93A3" opacity="0.3" />
          <g className={legClass}>
            <path
              className="companion-leg-l"
              d="M58 128c-2 28-6 48-10 64"
              stroke="#1E2A2F"
              strokeWidth="9"
              fill="none"
              strokeLinecap="round"
            />
            <path
              className="companion-leg-r"
              d="M98 130c4 26 10 46 18 62"
              stroke="#1E2A2F"
              strokeWidth="9"
              fill="none"
              strokeLinecap="round"
            />
            <path className="companion-foot-l" d="M42 190h24" stroke="#1E2A2F" strokeWidth="8" strokeLinecap="round" />
            <path className="companion-foot-r" d="M108 188h24" stroke="#1E2A2F" strokeWidth="8" strokeLinecap="round" />
          </g>
          <path d="M52 78c-8 18-10 38-2 54h56c10-16 8-36-4-54z" fill="#4B6E58" />
          <path d="M46 98h64" stroke="#FBF9F4" strokeWidth="11" strokeLinecap="round" />
          <path d="M46 98h64" stroke="#A8342A" strokeWidth="5.5" strokeLinecap="round" />
          <path d="M50 108c8 24 52 26 68 4" fill="#A8342A" opacity="0.85" />
          <circle cx="80" cy="52" r="24" fill="#E8C9A8" />
          <path d="M58 48c10-22 36-22 44 2" fill="#F4EEE4" />
          <ellipse cx="98" cy="40" rx="12" ry="10" fill="#F7F3EC" />
          <circle cx="70" cy="54" r="2.2" fill="#1E2A2F" />
          <circle cx="88" cy="54" r="2.2" fill="#1E2A2F" />
          <path
            d="M70 66c7 4 14 4 20 0"
            stroke="#1E2A2F"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M24 92c22-16 40-8 54 10"
            stroke="#FBF9F4"
            strokeWidth="13"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M24 92c22-16 40-8 54 10"
            stroke="#A8342A"
            strokeWidth="6.5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M104 88c12 14 10 28-2 40"
            stroke="#1E2A2F"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
          />
          <path d="M18 84v58" stroke="#1E2A2F" strokeWidth="6" strokeLinecap="round" />
          <circle cx="18" cy="82" r="5" fill="#4B6E58" />
          <path d="M14 78c6-4 10-4 14 0" stroke="#E0A542" strokeWidth="2" fill="none" />
        </svg>
      </div>
    </div>
  );
}
