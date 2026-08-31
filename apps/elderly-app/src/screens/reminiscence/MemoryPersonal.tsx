import { resolveMediaUrl } from "../../api/memories";
import { Chrome } from "../../components/Chrome";
import { useI18n } from "../../context/LanguageContext";
import { usePersonalMemories } from "../../hooks/usePersonalMemories";

export function MemoryPersonal() {
  const { tx } = useI18n();
  const { rows, loading, offline, pickTitle, pickPrompt } = usePersonalMemories();

  return (
    <main>
      <Chrome backTo="/memories" />
      {offline && rows.length > 0 ? (
        <p className="mb-4 text-body text-mist-blue">{tx("memoriesOffline")}</p>
      ) : null}
      {loading ? (
        <p className="text-body-lg text-mist-blue">{tx("memoriesLoading")}</p>
      ) : rows.length === 0 ? (
        <div className="photo-frame flex flex-col items-center justify-center px-6 py-10 text-center">
          <div className="h-28 w-40 bg-white shadow-[inset_0_0_0_3px_#7C93A3]" />
          <p className="mt-6 text-body-lg text-mist-blue">{tx("memoriesEmpty")}</p>
        </div>
      ) : (
        <div className="space-y-8">
          {rows.map((item) => {
            const prompt = pickPrompt(item);
            return (
              <article key={item.id} className="page-enter">
                <div className="photo-plate p-0">
                  <img
                    src={resolveMediaUrl(item.media_url)}
                    alt={pickTitle(item)}
                    className="block w-full rounded-2xl object-cover"
                    style={{ minHeight: "12rem", maxHeight: "20rem" }}
                  />
                </div>
                <h2 className="mt-4 font-display text-h2">{pickTitle(item)}</h2>
                {item.location ? (
                  <p className="mt-2 text-body text-mist-blue">{item.location}</p>
                ) : null}
                {item.year ? (
                  <p className="mt-1 text-body text-mist-blue">{item.year}</p>
                ) : null}
                {prompt ? <p className="mt-3 text-body-lg">{prompt}</p> : null}
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
