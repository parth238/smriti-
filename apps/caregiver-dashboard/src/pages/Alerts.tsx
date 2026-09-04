import { useEffect, useState } from "react";

import { loadReminders, type RemindersBundle } from "../api/reminders";
import { PATIENT_CHANGE_EVENT } from "../api/patients";
import { CaregiverDataError } from "../components/CaregiverDataError";
import { PageHeader } from "../components/PageHeader";
import { Skeleton } from "../components/Skeleton";
import { StatTile } from "../components/StatTile";

export function Alerts() {
  const [bundle, setBundle] = useState<RemindersBundle | null>(null);

  async function refresh() {
    setBundle(await loadReminders());
  }

  useEffect(() => {
    void refresh();
    const onPatientChange = () => void refresh();
    window.addEventListener(PATIENT_CHANGE_EVENT, onPatientChange);
    return () => window.removeEventListener(PATIENT_CHANGE_EVENT, onPatientChange);
  }, []);

  if (!bundle) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (bundle.source === "error") {
    return (
      <>
        <PageHeader
          title="Alerts"
          hint="Calm notes only. Absence of alerts is good news."
        />
        <CaregiverDataError error={bundle.error} />
      </>
    );
  }

  const missed = bundle.rows.filter(
    (row) => row.missed && !row.acknowledged,
  );
  const cleared = bundle.rows.filter((row) => row.acknowledged);

  return (
    <>
      <PageHeader
        title="Alerts"
        hint="Calm notes only. Absence of alerts is good news."
      />

      <section className="mb-8">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          <StatTile
            label="Active Alerts"
            value={String(missed.length)}
            hint="Action needed"
          />
          <StatTile
            label="Missed Reminders"
            value={String(missed.length)}
            hint="Not marked done"
          />
          <StatTile
            label="Cleared"
            value={String(cleared.length)}
            hint="Resolved by elder"
          />
          <StatTile
            label="Status"
            value={missed.length === 0 ? "All Clear" : "Needs Attention"}
            hint="Current state"
          />
        </div>
      </section>

      {missed.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-sand bg-white/60 py-12 text-center shadow-xs">
          <div className="mb-4 rounded-full bg-tea-garden/15 p-4 text-tea-garden">
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
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <p className="font-serif text-xl font-medium text-deep-hill">
            You&apos;re all caught up
          </p>
          <p className="mt-1 text-xs text-mist-blue">
            No alerts need your attention right now.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {missed.map((row) => (
            <div
              key={row.id}
              className="flex items-start justify-between rounded-2xl border border-gamosa-red/25 bg-white p-6 shadow-xs"
            >
              <div className="flex gap-4">
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gamosa-red/10 font-bold text-gamosa-red">
                  !
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-gamosa-red/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-gamosa-red">
                      High Priority
                    </span>
                    <span className="text-xs text-mist-blue">
                      {row.time}
                    </span>
                  </div>

                  <p className="mt-2 font-serif text-lg font-medium text-deep-hill">
                    {row.title}
                  </p>

                  <p className="mt-1 text-xs text-mist-blue">
                    This reminder was missed by the patient. Consider calling
                    to check on them.
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}