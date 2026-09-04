import { useEffect, useState } from "react";

import { loadMemories, uploadMemory } from "../api/memories";
import { PATIENT_CHANGE_EVENT } from "../api/patients";
import { CaregiverDataError } from "../components/CaregiverDataError";
import { PageHeader } from "../components/PageHeader";

export function Memories() {
  const [bundle, setBundle] = useState<
    Awaited<ReturnType<typeof loadMemories>> | null
  >(null);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    void refresh();

    const onPatientChange = () => void refresh();

    window.addEventListener(PATIENT_CHANGE_EVENT, onPatientChange);

    return () =>
      window.removeEventListener(PATIENT_CHANGE_EVENT, onPatientChange);
  }, []);

  async function refresh() {
    setBundle(await loadMemories());
  }

  async function onUpload(event: React.FormEvent) {
    event.preventDefault();

    if (!file || !title.trim() || !consent || bundle?.source !== "live") {
      return;
    }

    setBusy(true);

    const result = await uploadMemory({
      userId: bundle.patientId,
      file,
      titleEn: title.trim(),
    });

    setBusy(false);

    if (result.ok) {
      setActionMessage("");
      setTitle("");
      setFile(null);
      setConsent(false);
      await refresh();
    } else {
      setActionMessage(result.error.message);

      if (result.error.kind === "authentication") {
        await refresh();
      }
    }
  }

  const family = (bundle?.rows ?? []).filter(
    (item) => item.kind === "family",
  );

  const cultural = (bundle?.rows ?? []).filter(
    (item) => item.kind === "cultural",
  );

  return (
    <>
      <PageHeader
        title="Memories"
        hint="Cultural pack is shared. Family photos wait for a caregiver upload."
      />

      {bundle?.source === "error" ? (
        <CaregiverDataError error={bundle.error} />
      ) : null}

      <form
        onSubmit={onUpload}
        className="mb-8 space-y-4 rounded-2xl border border-sand bg-white p-6 shadow-xs"
      >
        <h2 className="font-serif text-xl font-medium tracking-tight text-deep-hill">
          Upload Family Photo
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-deep-hill sm:col-span-2">
            Photo title
            <input
              className="mt-1.5 w-full rounded-xl border border-sand bg-sand/20 px-3.5 py-2.5 transition-colors focus:border-tea-garden focus:bg-white focus:outline-none focus:ring-1 focus:ring-tea-garden"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Family wedding"
            />
          </label>

          <label className="block text-sm font-medium text-deep-hill sm:col-span-2">
            Photo file
            <input
              id="file-upload"
              type="file"
              accept="image/*"
              className="mt-1.5 block w-full text-sm text-mist-blue file:mr-4 file:rounded-xl file:border-0 file:bg-sand file:px-4 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-wider file:text-deep-hill transition-colors hover:file:bg-sand/80"
              onChange={(event) =>
                setFile(event.target.files?.[0] ?? null)
              }
            />
          </label>
        </div>

        <label className="flex items-start gap-3 rounded-xl bg-sand/30 p-3.5 text-xs leading-relaxed text-deep-hill">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-sand text-tea-garden focus:ring-tea-garden"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
          />

          <span>
            I confirm proxy consent under DPDP Act 2023 to store this family
            photo for cognitive reminiscence on the linked elderly account.
          </span>
        </label>

        {bundle?.source === "error" ? (
          <p className="text-sm text-gamosa-red">
            Memory upload is unavailable: {bundle.error.message}
          </p>
        ) : null}

        {actionMessage ? (
          <p className="text-sm text-gamosa-red">{actionMessage}</p>
        ) : null}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={
              busy ||
              !consent ||
              !file ||
              !title.trim() ||
              bundle?.source !== "live"
            }
            className="rounded-xl bg-gamosa-red px-5 py-2.5 text-sm font-medium text-rice-white shadow-xs transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Uploading..." : "Upload Photo"}
          </button>
        </div>
      </form>

      <div className="mb-8">
        <h3 className="mb-3 font-serif text-lg font-medium text-deep-hill">
          Family Memories
        </h3>

        {family.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-sand bg-white/60 py-12 text-center shadow-xs">
            <div className="mb-4 rounded-full bg-sand/80 p-4 text-mist-blue">
              <svg
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>

            <p className="font-serif text-lg font-medium text-deep-hill">
              No family memories yet
            </p>

            <p className="mt-1 max-w-md text-xs text-mist-blue">
              Family photos power the face-recall game on the elderly app and
              help with reminiscence. Upload a photo above to get started.
            </p>
          </div>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {family.map((item) => (
              <li
                key={item.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-sand bg-white shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
              >
                {item.mediaUrl ? (
                  <div className="aspect-[4/3] w-full bg-sand/30">
                    <img
                      src={item.mediaUrl}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[4/3] w-full items-center justify-center bg-sand/20 text-xs text-mist-blue/50">
                    No Image
                  </div>
                )}

                <div className="flex flex-1 flex-col justify-between p-4">
                  <div>
                    <p className="line-clamp-1 font-medium text-deep-hill">
                      {item.title}
                    </p>

                    {item.peopleTagged && item.peopleTagged.length > 0 ? (
                      <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-tea-garden">
                        {item.peopleTagged.join(", ")}
                      </p>
                    ) : null}

                    {item.description ? (
                      <p className="mt-2 line-clamp-2 text-xs text-mist-blue">
                        {item.description}
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-sand pt-3 text-xs text-mist-blue">
                    <span>{item.year || item.region || "Family"}</span>

                    {item.createdAt ? (
                      <span>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="mb-3 font-serif text-lg font-medium text-deep-hill">
          Cultural Memories
        </h3>

        {cultural.length === 0 ? (
          <p className="text-xs text-mist-blue">
            No cultural pack items found.
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {cultural.map((item) => (
              <li
                key={item.id}
                className="flex flex-col justify-between rounded-2xl border border-sand bg-white p-5 shadow-xs transition-shadow hover:shadow-sm"
              >
                <div>
                  <p className="line-clamp-1 font-medium text-deep-hill">
                    {item.title}
                  </p>

                  {item.description ? (
                    <p className="mt-2 line-clamp-2 text-xs text-mist-blue">
                      {item.description}
                    </p>
                  ) : null}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-sand pt-3 text-xs font-semibold uppercase tracking-wider text-tea-garden">
                  <span>Cultural Pack</span>
                  <span className="font-normal text-mist-blue">
                    {item.region}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}