import { useEffect, useState } from "react";

import { loadMemories, uploadMemory } from "../api/memories";
import { PATIENT_CHANGE_EVENT } from "../api/patients";
import { CaregiverDataError } from "../components/CaregiverDataError";
import { PageHeader } from "../components/PageHeader";

export function Memories() {
  const [bundle, setBundle] = useState<Awaited<ReturnType<typeof loadMemories>> | null>(null);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    void refresh();
    const onPatientChange = () => void refresh();
    window.addEventListener(PATIENT_CHANGE_EVENT, onPatientChange);
    return () => window.removeEventListener(PATIENT_CHANGE_EVENT, onPatientChange);
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
      await refresh();
    } else {
      setActionMessage(result.error.message);
      if (result.error.kind === "authentication") {
        await refresh();
      }
    }
  }

  const family = (bundle?.rows ?? []).filter((item) => item.kind === "family");

  return (
    <>
      <PageHeader
        title="Memories"
        hint="Cultural pack is shared. Family photos wait for a caregiver upload."
      />
      {bundle?.source === "error" ? <CaregiverDataError error={bundle.error} /> : null}
      <form onSubmit={onUpload} className="mb-6 space-y-3 rounded-xl bg-white p-4">
        <label className="block text-sm text-mist-blue">
          Photo title
          <input
            className="mt-1 w-full rounded-lg border border-mist-blue/30 px-3 py-2"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Family wedding"
          />
        </label>
        <label className="block text-sm text-mist-blue">
          Photo file
          <input
            type="file"
            accept="image/*"
            className="mt-1 block w-full text-sm"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </label>
        <label className="flex items-start gap-2 text-sm text-mist-blue">
          <input
            type="checkbox"
            className="mt-1"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
          />
          <span>
            I confirm proxy consent under DPDP Act 2023 to store this family photo for cognitive
            reminiscence on the linked elderly account.
          </span>
        </label>
        {bundle?.source === "error" ? (
          <p className="text-sm text-gamosa-red">
            Memory upload is unavailable: {bundle.error.message}
          </p>
        ) : null}
        {actionMessage ? <p className="text-sm text-gamosa-red">{actionMessage}</p> : null}
        <button
          type="submit"
          disabled={busy || !consent || bundle?.source !== "live"}
          className="rounded-xl bg-gamosa-red px-4 py-2 font-semibold text-rice-white disabled:opacity-60"
        >
          {busy ? "Uploading..." : "Upload family photo"}
        </button>
      </form>
      {bundle?.source === "live" && family.length === 0 ? (
        <p className="mb-4 text-mist-blue">No family photos uploaded yet. Ask to add some when you can.</p>
      ) : null}
      <ul className="grid gap-3 sm:grid-cols-2">
        {(bundle?.rows ?? []).map((item) => (
          <li key={item.id} className="rounded-xl bg-white px-4 py-4">
            <p className="font-semibold">{item.title}</p>
            <p className="text-sm text-mist-blue">
              {item.region} · {item.kind === "cultural" ? "Cultural pack" : "Family"}
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}
