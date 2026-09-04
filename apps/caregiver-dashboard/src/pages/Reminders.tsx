import { useEffect, useState } from "react";

import { PATIENT_CHANGE_EVENT } from "../api/patients";
import { loadReminders, updateReminder, deactivateReminder, createReminder } from "../api/reminders";
import { CaregiverDataError } from "../components/CaregiverDataError";
import { Notice } from "../components/Notice";
import { PageHeader } from "../components/PageHeader";
import { getReminderStatusLabel } from "../lib/reminderStatus";

function toLocalInput(iso?: string): string {
  if (!iso) {
    return "";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function Reminders() {
  const [bundle, setBundle] = useState<Awaited<ReturnType<typeof loadReminders>> | null>(null);
  const [title, setTitle] = useState("");
  const [when, setWhen] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editWhen, setEditWhen] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  async function refresh() {
    setBundle(await loadReminders());
  }

  useEffect(() => {
    void refresh();
    const onPatientChange = () => void refresh();
    window.addEventListener(PATIENT_CHANGE_EVENT, onPatientChange);
    return () => window.removeEventListener(PATIENT_CHANGE_EVENT, onPatientChange);
  }, []);

  async function onCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim() || !when || bundle?.source !== "live") {
      return;
    }
    setBusy(true);
    const result = await createReminder({
      userId: bundle.patientId,
      titleEn: title.trim(),
      type: "custom",
      scheduledTime: new Date(when).toISOString(),
    });
    setBusy(false);
    if (result.ok) {
      setActionMessage("");
      setTitle("");
      setWhen("");
      await refresh();
    } else {
      setActionMessage(result.error.message);
      if (result.error.kind === "authentication") {
        await refresh();
      }
    }
  }

  function startEdit(row: { id: string; title: string; scheduledTime?: string }) {
    setEditingId(row.id);
    setEditTitle(row.title);
    setEditWhen(toLocalInput(row.scheduledTime));
  }

  async function saveEdit(reminderId: string) {
    if (!editTitle.trim() || !editWhen) {
      return;
    }
    setBusy(true);
    const result = await updateReminder({
      reminderId,
      titleEn: editTitle.trim(),
      scheduledTime: new Date(editWhen).toISOString(),
    });
    setBusy(false);
    if (result.ok) {
      setActionMessage("");
      setEditingId(null);
      await refresh();
    } else {
      setActionMessage(result.error.message);
      if (result.error.kind === "authentication") {
        await refresh();
      }
    }
  }

  async function deactivate(reminderId: string) {
    setBusy(true);
    const result = await deactivateReminder(reminderId);
    setBusy(false);
    if (result.ok) {
      setActionMessage("");
      await refresh();
    } else {
      setActionMessage(result.error.message);
      if (result.error.kind === "authentication") {
        await refresh();
      }
    }
  }

  return (
    <>
      <PageHeader
        title="Reminders"
        hint="Create and edit happens here. The elderly app only marks done."
      />
      {bundle?.source === "error" ? <CaregiverDataError error={bundle.error} /> : null}
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
        {bundle?.source === "error" ? (
          <p className="text-sm text-gamosa-red">
            Reminder creation is unavailable: {bundle.label}
          </p>
        ) : null}
        {actionMessage ? <p className="text-sm text-gamosa-red">{actionMessage}</p> : null}
        <button
          type="submit"
          disabled={busy || bundle?.source !== "live"}
          className="rounded-xl bg-gamosa-red px-4 py-2 font-semibold text-rice-white disabled:opacity-60"
        >
          {busy ? "Saving..." : "Add reminder"}
        </button>
      </form>
      <div className="space-y-3">
        {(bundle?.rows ?? []).map((row) =>
          row.status === "missed" ? (
            <Notice key={row.id}>
              {`${row.title}: ${getReminderStatusLabel(row)}.`}
            </Notice>
          ) : editingId === row.id ? (
            <article key={row.id} className="rounded-xl bg-white px-4 py-4 space-y-3">
              <label className="block text-sm text-mist-blue">
                Title
                <input
                  className="mt-1 w-full rounded-lg border border-mist-blue/30 px-3 py-2"
                  value={editTitle}
                  onChange={(event) => setEditTitle(event.target.value)}
                />
              </label>
              <label className="block text-sm text-mist-blue">
                When
                <input
                  type="datetime-local"
                  className="mt-1 w-full rounded-lg border border-mist-blue/30 px-3 py-2"
                  value={editWhen}
                  onChange={(event) => setEditWhen(event.target.value)}
                />
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={busy}
                  className="rounded-xl bg-tea-garden px-4 py-2 text-sm font-semibold text-rice-white"
                  onClick={() => void saveEdit(row.id)}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="rounded-xl px-4 py-2 text-sm text-mist-blue"
                  onClick={() => setEditingId(null)}
                >
                  Cancel
                </button>
              </div>
            </article>
          ) : (
            <article key={row.id} className="rounded-xl bg-white px-4 py-4">
              <p className="font-semibold">{row.title}</p>
              <p className="text-mist-blue">{getReminderStatusLabel(row)}</p>
              {bundle?.source === "live" ? (
                <div className="mt-2 flex gap-4 text-sm">
                  <button
                    type="button"
                    className="text-tea-garden"
                    onClick={() => startEdit(row)}
                  >
                    Edit
                  </button>
                  {row.active ? (
                    <button
                      type="button"
                      className="text-gamosa-red"
                      disabled={busy}
                      onClick={() => void deactivate(row.id)}
                    >
                      Deactivate
                    </button>
                  ) : null}
                </div>
              ) : null}
            </article>
          ),
        )}
      </div>
    </>
  );
}
