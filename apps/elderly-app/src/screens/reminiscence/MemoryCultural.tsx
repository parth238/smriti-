import { Chrome } from "../../components/Chrome";
import { CulturalScene } from "../../components/CulturalScene";
import { useI18n } from "../../context/LanguageContext";
import { loadBundledCulturalPack } from "../../data/culturalPack";

export function MemoryCultural() {
  const { tx, language } = useI18n();
  const pack = loadBundledCulturalPack(language);
  return (
    <main>
      <Chrome backTo="/memories" />
      <p className="mb-5 text-body-lg">{tx("culturalNote")}</p>
      <div className="gamosa-line mb-6" />
      <div className="space-y-8">
        {pack.map((item) => (
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
