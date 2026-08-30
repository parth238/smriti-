import { useId } from "react";

type HillSceneProps = {
  className?: string;
  sun?: boolean;
};

export function HillScene({ className = "", sun = true }: HillSceneProps) {
  const raw = useId().replace(/:/g, "");
  const sky = `sky-${raw}`;
  const river = `river-${raw}`;
  const terrace = `terrace-${raw}`;

  return (
    <svg
      viewBox="0 0 390 844"
      className={className}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={sky} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7C93A3" />
          <stop offset="0.12" stopColor="#FBF9F4" />
          <stop offset="1" stopColor="#FBF9F4" />
        </linearGradient>
        <linearGradient id={river} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7C93A3" stopOpacity="0.35" />
          <stop offset="0.5" stopColor="#FBF9F4" stopOpacity="0.7" />
          <stop offset="1" stopColor="#7C93A3" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id={terrace} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4B6E58" />
          <stop offset="1" stopColor="#1E2A2F" stopOpacity="0.55" />
        </linearGradient>
      </defs>
      <rect width="390" height="844" fill={`url(#${sky})`} />
      {sun ? (
        <>
          <circle cx="308" cy="92" r="58" fill="#E0A542" opacity="0.22" />
          <circle cx="308" cy="92" r="34" fill="#E0A542" />
        </>
      ) : null}
      <path
        d="M-20 210c48-46 92-18 138-48 50-32 78 6 128-22 46-26 86-8 164 28v90H-20z"
        fill="#7C93A3"
        opacity="0.42"
      />
      <path
        d="M-30 268c70-54 120-16 176-44 62-30 96 14 154-10 48-20 90 4 150 36v86H-30z"
        fill="#4B6E58"
        opacity="0.55"
      />
      <path
        d="M-20 330c58-38 118-12 168-36 64-30 102 18 162-6 46-18 80 8 130 32v70H-20z"
        fill={`url(#${terrace})`}
      />
      <path
        d="M-10 348c40 8 80-10 120 2s88 4 130-8 90 12 150 2"
        fill="none"
        stroke="#FBF9F4"
        strokeWidth="3"
        opacity="0.35"
      />
      <path
        d="M-10 368c46 10 86-8 128 4s90 2 134-10 86 14 148 4"
        fill="none"
        stroke="#FBF9F4"
        strokeWidth="2.4"
        opacity="0.28"
      />
      <path
        d="M-40 430c90-40 140 20 210-10 80-34 120 16 250 4v40H-40z"
        fill={`url(#${river})`}
      />
      <path
        d="M-20 452c70 18 120-16 190 6 78 24 130-10 230 8v220H-20z"
        fill="#4B6E58"
        opacity="0.38"
      />
      <ellipse cx="48" cy="520" rx="28" ry="16" fill="#4B6E58" opacity="0.7" />
      <ellipse cx="96" cy="534" rx="34" ry="18" fill="#4B6E58" opacity="0.62" />
      <ellipse cx="300" cy="528" rx="36" ry="18" fill="#4B6E58" opacity="0.66" />
      <ellipse cx="348" cy="548" rx="30" ry="16" fill="#4B6E58" opacity="0.7" />
      <path
        d="M18 590c70-28 120 8 170-8 64-20 90 22 186 6"
        fill="none"
        stroke="#1E2A2F"
        strokeWidth="14"
        strokeLinecap="round"
        opacity="0.12"
      />
      <path
        d="M22 586c68-26 118 8 168-8 62-20 88 20 178 6"
        fill="none"
        stroke="#FBF9F4"
        strokeWidth="8"
        strokeLinecap="round"
        opacity="0.85"
      />
    </svg>
  );
}
