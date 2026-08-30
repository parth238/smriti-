import type { CulturalSceneId } from "../data/culturalPack";

export function CulturalScene({ id }: { id: CulturalSceneId }) {
  if (id === "bihu") {
    return (
      <svg viewBox="0 0 320 180" className="scene-art" aria-hidden="true">
        <rect width="320" height="180" fill="#4B6E58" />
        <circle cx="258" cy="38" r="22" fill="#E0A542" />
        <path d="M0 110c40-24 80 8 120-10s80 18 120-6 56 4 80 16v70H0z" fill="#1E2A2F" opacity="0.35" />
        <rect x="78" y="78" width="28" height="50" rx="8" fill="#A8342A" />
        <circle cx="92" cy="64" r="14" fill="#E8C9A8" />
        <path d="M80 58c6-10 18-8 22 2" fill="#F7F3EC" />
        <ellipse cx="92" cy="108" rx="36" ry="8" fill="#FBF9F4" />
        <path d="M56 108h72" stroke="#A8342A" strokeWidth="6" />
        <circle cx="168" cy="118" r="22" fill="#E0A542" />
        <circle cx="168" cy="118" r="12" fill="#A8342A" />
        <circle cx="214" cy="126" r="16" fill="#E0A542" />
      </svg>
    );
  }
  if (id === "tea") {
    return (
      <svg viewBox="0 0 320 180" className="scene-art" aria-hidden="true">
        <rect width="320" height="180" fill="#7C93A3" />
        <circle cx="56" cy="36" r="20" fill="#E0A542" opacity="0.85" />
        <path d="M0 70c50-28 90 4 140-16 48-20 86 14 180 0v126H0z" fill="#4B6E58" />
        <path
          d="M0 96c40 8 80-10 120 4s88 2 128-10 72 12 72 12"
          fill="none"
          stroke="#FBF9F4"
          strokeWidth="3"
          opacity="0.35"
        />
        <ellipse cx="250" cy="148" rx="40" ry="12" fill="#1E2A2F" opacity="0.2" />
        <path d="M236 108h36v28a16 16 0 0 1-36 0z" fill="#A8342A" />
      </svg>
    );
  }
  if (id === "river") {
    return (
      <svg viewBox="0 0 320 180" className="scene-art" aria-hidden="true">
        <rect width="320" height="180" fill="#7C93A3" />
        <path d="M0 40c60-20 100 16 160-8 52-20 90 8 160 18v40H0z" fill="#4B6E58" opacity="0.55" />
        <path
          d="M-10 108c48 18 70-16 120 0s86-14 130 4 90-10 120 8"
          fill="none"
          stroke="#FBF9F4"
          strokeWidth="10"
          opacity="0.55"
        />
      </svg>
    );
  }
  if (id === "kaziranga") {
    return (
      <svg viewBox="0 0 320 180" className="scene-art" aria-hidden="true">
        <rect width="320" height="180" fill="#7C93A3" />
        <circle cx="280" cy="36" r="18" fill="#E0A542" />
        <path d="M0 90c40-20 90 10 140-8 60-22 90 16 180 4v94H0z" fill="#4B6E58" />
        <ellipse cx="70" cy="128" rx="28" ry="14" fill="#1E2A2F" opacity="0.35" />
        <path d="M48 118h16v22h-6l-8 16h-8l8-16h-10z" fill="#1E2A2F" />
        <path d="M210 100c18 8 36 6 48-8 2 18-8 36-24 42-20 8-38-6-24-34z" fill="#1E2A2F" opacity="0.55" />
      </svg>
    );
  }
  if (id === "hornbill") {
    return (
      <svg viewBox="0 0 320 180" className="scene-art" aria-hidden="true">
        <rect width="320" height="180" fill="#4B6E58" />
        <path d="M0 120c50-30 90 8 140-12s90 20 180 0v72H0z" fill="#1E2A2F" opacity="0.28" />
        <path
          d="M70 110c30-24 54-50 62-78 28 22 58 40 90 36-24 22-58 40-98 46-28 4-44-2-54-4z"
          fill="#A8342A"
        />
        <path d="M128 48l28-10" stroke="#E0A542" strokeWidth="6" strokeLinecap="round" />
        <circle cx="148" cy="58" r="5" fill="#FBF9F4" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 320 180" className="scene-art" aria-hidden="true">
      <rect width="320" height="180" fill="#FBF9F4" />
      <rect x="28" y="28" width="264" height="124" fill="#FBF9F4" stroke="#A8342A" strokeWidth="10" />
      <path d="M28 48h264M28 132h264" stroke="#A8342A" strokeWidth="14" />
      <path d="M48 78h36M236 78h36M48 102h24M248 102h24" stroke="#A8342A" strokeWidth="8" />
    </svg>
  );
}
