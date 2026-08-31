import { useEffect, useState } from "react";

import { Notice } from "../components/Notice";
import { PageHeader } from "../components/PageHeader";
import { createReminder, deactivateReminder, loadReminders } from "../api/reminders";

export function Reminders() {
  const [bundle, setBundle] = useState<Awaited<ReturnType<typeof loadReminders>> | null>(null);
  const [title, setTitle] = useState("");
  const [when, setWhen] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void loadReminders().then(setBundle);
  }, []);

  async function refresh() {
    setBundle(await loadReminders());
  }

  async function onCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim() || !when) {
      return;
    }
    setBusy(true);
    const ok = await createReminder({
      titleEn: title.trim(),
      type: "custom",
      scheduledTime: new Date(when).toISOString(),
    });
    setBusy(false);
    if (ok) {
      setTitle("");
      setWhen("");
      await refresh();
    }
  }

  return (
    <>
      <PageHeader
        title="Reminders"
        hint="Create and edit happens here. The elderly app only marks done."
      />
      {bundle?.source === "demo" ? <Notice>{bundle.label}</Notice> : null}
      <form onSubmit={onCreate} className="mb-6 space-y-3 rounded-xl bg-white p-4">
        <label className="block text-sm text-mist-blue">
          Title
          <input
            className="mt-1 w-full rounded-lg border border-mist-blue/30 px-3 py-2"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Evening medicine"
          />
        </label>
        <label className="block text-sm text-mist-blue">
          When
          <input
            type="datetime-local"
            className="mt-1 w-full rounded-lg border border-mist-blue/30 px-3 py-2"
            value={when}
            onChange={(event) => setWhen(event.target.value)}
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-gamosa-red px-4 py-2 font-semibold text-rice-white disabled:opacity-60"
        >
          {busy ? "Saving..." : "Add reminder"}
        </button>
      </form>
      <div className="space-y-3">
        {(bundle?.rows ?? []).map((row) =>
          row.missed ? (
            <Notice key={row.id}>{`${row.title} at ${row.time} was not marked done.`}</Notice>
          ) : (
            <article key={row.id} className="rounded-xl bg-white px-4 py-4">
              <p className="font-semibold">{row.title}</p>
              <p className="text-mist-blue">{row.time}</p>
              {bundle?.source === "live" ? (
                <button
                  type="button"
                  className="mt-2 text-sm text-gamosa-red"
                  onClick={() => void deactivateReminder(row.id).then(refresh)}
                >
                  Deactivate
                </button>
              ) : null}
            </article>
          ),
        )}
      </div>
    </>
  );
}
