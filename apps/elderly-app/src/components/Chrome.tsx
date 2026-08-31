import { Link, useNavigate } from "react-router-dom";

import { useI18n } from "../context/LanguageContext";
import { quitActiveGameIfNeeded } from "../lib/gameSessionRegistry";

type ChromeProps = {
  backTo?: string;
  showHome?: boolean;
};

export function Chrome({ backTo = "/", showHome = true }: ChromeProps) {
  const { tx } = useI18n();
  const navigate = useNavigate();
  return (
    <div className="mb-5 flex items-center justify-between gap-tap">
      <button
        type="button"
        onClick={() => {
          void quitActiveGameIfNeeded().then(() => navigate(backTo));
        }}
        className="pressable inline-flex min-h-tap min-w-[112px] items-center justify-center rounded-2xl bg-white px-4 text-button-label text-deep-hill"
      >
        {tx("back")}
      </button>
      {showHome ? (
        <Link
          to="/"
          className="pressable inline-flex min-h-tap min-w-[112px] items-center justify-center rounded-2xl bg-tea-garden px-4 text-button-label text-rice-white"
        >
          {tx("home")}
        </Link>
      ) : (
        <span />
      )}
    </div>
  );
}
