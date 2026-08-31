import { useEffect, useState } from "react";

import { loadReminders, type RemindersBundle } from "../api/reminders";
import { PATIENT_CHANGE_EVENT } from "../api/patients";
import { Notice } from "../components/Notice";
import { PageHeader } from "../components/PageHeader";

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

  const missed = (bundle?.rows ?? []).filter((row) => row.missed);

  return (
    <>
      <PageHeader title="Alerts" hint="Calm notes only. Absence of alerts is good news." />
      {bundle?.source === "demo" ? (
        <p className="mb-4 text-body text-mist-blue">{bundle.label}</p>
      ) : null}
      {!bundle ? (
        <p className="text-tea-garden">Loading reminders…</p>
      ) : missed.length === 0 ? (
        <p className="text-tea-garden">No alerts yet. This is a good thing.</p>
      ) : (
        <div className="space-y-3">
          {missed.map((row) => (
            <Notice key={row.id}>{`${row.title} was not marked done (${row.time}).`}</Notice>
          ))}
        </div>
      )}
    </>
  );
}
