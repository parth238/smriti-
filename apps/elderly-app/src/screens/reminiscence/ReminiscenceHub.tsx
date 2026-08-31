import { Link } from "react-router-dom";

import { Motif } from "../../components/Motif";
import { useI18n } from "../../context/LanguageContext";

export function ReminiscenceHub() {
  const { tx } = useI18n();
  return (
    <>
      <h1 className="font-display text-h1">{tx("memoriesTitle")}</h1>
      <div className="mt-6 space-y-4">
        <Link
          to="/memories/personal"
          className="pressable table-tile flex min-h-[96px] items-center gap-4 px-5"
        >
          <Motif id="lamp" className="h-16 w-16" />
          <span className="text-button-label">{tx("memoriesPersonal")}</span>
        </Link>
        <Link
          to="/memories/cultural"
          className="pressable table-tile flex min-h-[96px] items-center gap-4 px-5"
        >
          <Motif id="cloth" className="h-16 w-16" />
          <span className="text-button-label">{tx("memoriesCultural")}</span>
        </Link>
      </div>
    </>
  );
}
