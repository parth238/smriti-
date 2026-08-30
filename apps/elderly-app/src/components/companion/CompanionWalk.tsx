type WalkProps = {
  moving?: boolean;
};

export function CompanionWalk({ moving = true }: WalkProps) {
  const walkClass = moving ? "companion-walk" : "";
  const bobClass = moving ? "companion-bob" : "";

  return (
    <div className={`${walkClass} w-28`} aria-hidden="true">
      <div className={bobClass}>
        <svg viewBox="0 0 140 200" className="h-44 w-28">
          <ellipse cx="72" cy="190" rx="38" ry="8" fill="#7C93A3" opacity="0.28" />
          <path
            d="M48 108c4 22 2 38-2 54"
            stroke="#1E2A2F"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M86 110c8 20 14 36 22 50"
            stroke="#1E2A2F"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
          />
          <path d="M38 164h22" stroke="#1E2A2F" strokeWidth="7" strokeLinecap="round" />
          <path d="M100 162h22" stroke="#1E2A2F" strokeWidth="7" strokeLinecap="round" />
          <path d="M46 72c-10 16-12 36-4 52h48c10-16 8-36-4-52z" fill="#4B6E58" />
          <path d="M40 96h58" stroke="#FBF9F4" strokeWidth="10" strokeLinecap="round" />
          <path d="M40 96h58" stroke="#A8342A" strokeWidth="5" strokeLinecap="round" />
          <circle cx="70" cy="50" r="22" fill="#E8C9A8" />
          <path d="M50 46c10-20 32-20 40 2" fill="#F4EEE4" />
          <circle cx="86" cy="38" r="10" fill="#F7F3EC" />
          <circle cx="62" cy="52" r="2" fill="#1E2A2F" />
          <circle cx="78" cy="52" r="2" fill="#1E2A2F" />
          <path
            d="M62 62c6 4 12 4 16 0"
            stroke="#1E2A2F"
            strokeWidth="1.8"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M26 88c20-14 38-6 50 8"
            stroke="#FBF9F4"
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M26 88c20-14 38-6 50 8"
            stroke="#A8342A"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M98 86c10 12 8 24-2 34"
            stroke="#1E2A2F"
            strokeWidth="7"
            fill="none"
            strokeLinecap="round"
          />
          <path d="M22 80v54" stroke="#1E2A2F" strokeWidth="5" strokeLinecap="round" />
          <circle cx="22" cy="78" r="4.2" fill="#4B6E58" />
        </svg>
      </div>
    </div>
  );
}
