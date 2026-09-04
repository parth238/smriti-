import { useEffect, useState } from "react";

import { PATIENT_CHANGE_EVENT } from "../api/patients";
import {
  createReminder,
  deactivateReminder,
  loadReminders,
  updateReminder,
} from "../api/reminders";
import { CaregiverDataError } from "../components/CaregiverDataError";
import { PageHeader } from "../components/PageHeader";
import { Skeleton } from "../components/Skeleton";
import { StatTile } from "../components/StatTile";
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

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function isToday(iso?: string): boolean {
  if (!iso) {
    return false;
  }

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function isPast(iso?: string): boolean {
  if (!iso) {
    return false;
  }

  const date = new Date(iso);

  return !Number.isNaN(date.getTime()) && date.getTime() < Date.now();
}

export function Reminders() {
  const [bundle, setBundle] = useState<
    Awaited<ReturnType<typeof loadReminders>> | null
  >(null);

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

    return () =>
      window.removeEventListener(PATIENT_CHANGE_EVENT, onPatientChange);
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

  function startEdit(row: {
    id: string;
    title: string;
    scheduledTime?: string;
  }) {
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

  if (!bundle) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (bundle.source === "error") {
    return (
      <>
        <PageHeader
          title="Reminders"
          hint="Create and edit happens here. The elderly app only marks done."
        />
        <CaregiverDataError error={bundle.error} />
      </>
    );
  }

  const missed = bundle.rows.filter(
    (row) => row.missed && !row.acknowledged,
  );

  const completed = bundle.rows.filter((row) => {
    if (row.missed && !row.acknowledged) {
      return false;
    }

    return (
      row.acknowledged ||
      row.active === false ||
      (!row.missed && row.active && isPast(row.scheduledTime))
    );
  });

  const active = bundle.rows.filter(
    (row) =>
      !row.missed &&
      !row.acknowledged &&
      row.active !== false,
  );

  const today = bundle.rows.filter(
    (row) =>
      (!row.missed || row.acknowledged) &&
      isToday(row.scheduledTime),
  );

  const upcoming = active.filter(
    (row) => !isToday(row.scheduledTime) && !isPast(row.scheduledTime),
  );

  const renderRow = (row: (typeof bundle.rows)[number]) => {
    if (editingId === row.id) {
      return (
        <article
          key={row.id}
          className="space-y-4 rounded-2xl border border-sand bg-white p-5 shadow-xs"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-deep-hill">
              Title
              <input
                className="mt-1.5 w-full rounded-xl border border-sand bg-sand/20 px-3.5 py-2.5 focus:border-tea-garden focus:bg-white focus:outline-none focus:ring-1 focus:ring-tea-garden"
                value={editTitle}
                onChange={(event) => setEditTitle(event.target.value)}
              />
            </label>

            <label className="block text-sm font-medium text-deep-hill">
              When
              <input
                type="datetime-local"
                className="mt-1.5 w-full rounded-xl border border-sand bg-sand/20 px-3.5 py-2.5 focus:border-tea-garden focus:bg-white focus:outline-none focus:ring-1 focus:ring-tea-garden"
                value={editWhen}
                onChange={(event) => setEditWhen(event.target.value)}
              />
            </label>
          </div>

          <div className="flex justify-end gap-3 border-t border-sand pt-3">
            <button
              type="button"
              className="rounded-xl px-4 py-2 text-sm font-medium text-mist-blue hover:text-deep-hill"
              onClick={() => setEditingId(null)}
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={busy || !editTitle.trim() || !editWhen}
              className="rounded-xl bg-tea-garden px-4 py-2 text-sm font-medium text-rice-white disabled:opacity-50"
              onClick={() => void saveEdit(row.id)}
            >
              {busy ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </article>
      );
    }

    return (
      <article
        key={row.id}
        className={`group flex flex-col justify-between gap-4 rounded-2xl border p-5 shadow-xs transition-all sm:flex-row sm:items-center ${row.acknowledged
            ? "border-tea-garden/30 bg-tea-garden/5"
            : "border-sand bg-white"
          }`}
      >
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-deep-hill">{row.title}</p>

            {row.acknowledged ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-tea-garden/15 px-2.5 py-0.5 text-xs font-semibold text-tea-garden">
                ✓ Done
                {row.acknowledgedTime
                  ? ` at ${row.acknowledgedTime}`
                  : ""}
              </span>
            ) : null}
          </div>

          <p className="mt-1 text-sm text-mist-blue">
            {row.acknowledged && row.acknowledgedTime
              ? `Scheduled for ${row.time} · Marked done by elder at ${row.acknowledgedTime}`
              : row.time}
          </p>

          {row.status === "missed" ? (
            <p className="mt-1 text-xs font-medium text-gamosa-red">
              {getReminderStatusLabel(row)}
            </p>
          ) : null}
        </div>

        {bundle.source === "live" ? (
          <div className="flex gap-4 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
            <button
              type="button"
              className="text-sm font-medium text-tea-garden hover:underline"
              onClick={() => startEdit(row)}
            >
              Edit
            </button>

            <button
              type="button"
              disabled={busy}
              className="text-sm font-medium text-gamosa-red hover:underline disabled:opacity-50"
              onClick={() => void deactivate(row.id)}
            >
              Deactivate
            </button>
          </div>
        ) : null}
      </article>
    );
  };

  return (
    <>
      <PageHeader
        title="Reminders"
        hint="Create and edit happens here. The elderly app only marks done."
      />

      <section className="mb-8">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          <StatTile
            label="Today"
            value={String(today.length)}
            hint="Reminders for today"
          />
          <StatTile
            label="Completed"
            value={String(completed.length)}
            hint="Past and done"
          />
          <StatTile
            label="Missed"
            value={String(missed.length)}
            hint="Need attention"
          />
          <StatTile
            label="Upcoming"
            value={String(upcoming.length)}
            hint="Scheduled next"
          />
        </div>
      </section>

      <form
        onSubmit={onCreate}
        className="mb-8 space-y-4 rounded-2xl border border-sand bg-white p-6 shadow-xs"
      >
        <h2 className="font-serif text-xl font-medium tracking-tight text-deep-hill">
          Add New Reminder
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-deep-hill">
            Title
            <input
              className="mt-1.5 w-full rounded-xl border border-sand bg-sand/20 px-3.5 py-2.5 focus:border-tea-garden focus:bg-white focus:outline-none focus:ring-1 focus:ring-tea-garden"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Evening medicine"
            />
          </label>

          <label className="block text-sm font-medium text-deep-hill">
            When
            <input
              type="datetime-local"
              className="mt-1.5 w-full rounded-xl border border-sand bg-sand/20 px-3.5 py-2.5 focus:border-tea-garden focus:bg-white focus:outline-none focus:ring-1 focus:ring-tea-garden"
              value={when}
              onChange={(event) => setWhen(event.target.value)}
            />
          </label>
        </div>

        {actionMessage ? (
          <p className="text-sm text-gamosa-red">{actionMessage}</p>
        ) : null}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={busy || !title.trim() || !when}
            className="rounded-xl bg-gamosa-red px-5 py-2.5 text-sm font-medium text-rice-white shadow-xs transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Saving..." : "Add Reminder"}
          </button>
        </div>
      </form>

      <div className="mb-8">
        <h3 className="mb-3 font-serif text-lg font-medium text-gamosa-red">
          Missed
        </h3>

        {missed.length > 0 ? (
          <div className="space-y-3">
            {missed.map((row) => (
              <div
                key={row.id}
                className="rounded-2xl border border-gamosa-red/30 bg-gamosa-red/5 p-5 shadow-xs"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-deep-hill">
                      {row.title}
                    </p>
                    <p className="mt-1 text-sm text-gamosa-red">
                      {getReminderStatusLabel(row)}
                    </p>
                  </div>

                  {bundle.source === "live" ? (
                    <button
                      type="button"
                      className="text-xs font-semibold uppercase tracking-wider text-gamosa-red transition-colors hover:text-deep-hill disabled:opacity-50"
                      disabled={busy}
                      onClick={() => void deactivate(row.id)}
                    >
                      Deactivate
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-sand bg-white/60 p-6 text-center shadow-xs">
            <p className="font-medium text-tea-garden">
              Everything is on track.
            </p>
            <p className="mt-1 text-xs text-mist-blue">
              No missed reminders.
            </p>
          </div>
        )}
      </div>

      <div className="mb-8">
        <h3 className="mb-3 font-serif text-lg font-medium text-deep-hill">
          Today
        </h3>

        {today.length > 0 ? (
          <div className="space-y-3">{today.map(renderRow)}</div>
        ) : (
          <div className="rounded-2xl border border-dashed border-sand bg-white/60 p-6 text-center shadow-xs">
            <p className="text-sm text-mist-blue">
              No reminders scheduled for today.
            </p>
          </div>
        )}
      </div>

      <div className="mb-8">
        <h3 className="mb-3 font-serif text-lg font-medium text-deep-hill">
          Upcoming
        </h3>

        {upcoming.length > 0 ? (
          <div className="space-y-3">{upcoming.map(renderRow)}</div>
        ) : (
          <div className="rounded-2xl border border-dashed border-sand bg-white/60 p-6 text-center shadow-xs">
            <p className="text-sm text-mist-blue">
              No upcoming reminders.
            </p>
          </div>
        )}
      </div>

      <div className="mb-8 opacity-70 transition-opacity hover:opacity-100">
        <h3 className="mb-3 font-serif text-lg font-medium text-mist-blue">
          Completed / History
        </h3>

        {completed.length > 0 ? (
          <div className="space-y-3">{completed.map(renderRow)}</div>
        ) : (
          <div className="rounded-2xl border border-dashed border-sand bg-white/60 p-6 text-center shadow-xs">
            <p className="text-sm text-mist-blue">
              No completed reminders yet.
            </p>
          </div>
        )}
      </div>
    </>
  );
}