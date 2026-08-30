import { Link } from "react-router-dom";

import { Chrome } from "../components/Chrome";
import { CulturalScene } from "../components/CulturalScene";
import { Motif } from "../components/Motif";
import { useI18n } from "../context/LanguageContext";
import { CULTURAL_PACK } from "../data/culturalPack";

export function Reminiscence() {
  const { tx } = useI18n();
  return (
    <main>
      <Chrome backTo="/" />
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
    </main>
  );
}

export function MemoryPersonal() {
  const { tx } = useI18n();
  return (
    <main>
      <Chrome backTo="/memories" />
      <div className="photo-frame flex flex-col items-center justify-center px-6 py-10 text-center">
        <div className="h-28 w-40 bg-white shadow-[inset_0_0_0_3px_#7C93A3]" />
        <p className="mt-6 text-body-lg text-mist-blue">{tx("memoriesEmpty")}</p>
      </div>
    </main>
  );
}

export function MemoryCultural() {
  const { tx } = useI18n();
  return (
    <main>
      <Chrome backTo="/memories" />
      <p className="mb-5 text-body-lg">{tx("culturalNote")}</p>
      <div className="gamosa-line mb-6" />
      <div className="space-y-8">
        {CULTURAL_PACK.map((item) => (
          <article key={item.id} className="page-enter">
            <div className="photo-plate p-0">
              <CulturalScene id={item.scene} />
            </div>
            <h2 className="mt-4 font-display text-h2">{tx(item.titleKey)}</h2>
            <p className="mt-2 text-body-lg">{tx(item.promptKey)}</p>
            <p className="mt-2 text-body text-mist-blue">{item.state}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
