import { useEffect, useState } from "react";

import { loadCaregiverAnalytics, type AnalyticsBundle } from "../api/analytics";
import { PATIENT_CHANGE_EVENT } from "../api/patients";
import { loadReminders } from "../api/reminders";
import { Notice } from "../components/Notice";
import { PageHeader } from "../components/PageHeader";
import { StatTile } from "../components/StatTile";

export function Overview() {
  const [bundle, setBundle] = useState<AnalyticsBundle | null>(null);
  const [missedNote, setMissedNote] = useState<string | null>(null);

  async function refresh() {
    const analytics = await loadCaregiverAnalytics();
    setBundle(analytics);
    const reminders = await loadReminders();
    if (reminders.source === "live") {
      const missed = reminders.rows.filter((row) => row.missed);
      if (missed.length > 0) {
        setMissedNote(
          missed.map((row) => `${row.title} at ${row.time}`).join(". ") +
            ". This is a reminder note, not a medical warning.",
        );
      } else {
        setMissedNote(null);
      }
    } else {
      setMissedNote(null);
    }
  }

  useEffect(() => {
    void refresh();
    const onPatientChange = () => void refresh();
    window.addEventListener(PATIENT_CHANGE_EVENT, onPatientChange);
    return () => window.removeEventListener(PATIENT_CHANGE_EVENT, onPatientChange);
  }, []);

  if (!bundle) {
    return <p className="text-mist-blue">Loading overview…</p>;
  }

  return (
    <>
      <PageHeader
        title={`${bundle.patient.label} this week`}
        hint={`${bundle.patient.region} · ${bundle.patient.language}. Comparisons are against their own usual week, never a population range.`}
      />
      <p className="mb-4 text-sm text-mist-blue">{bundle.updatedLabel}</p>
      {bundle.source === "demo" ? (
        <div className="mb-5">
          <Notice>
            Showing labeled demo or last-cached sample data. This is not live session truth until
            the API is reachable and a family member is linked.
          </Notice>
        </div>
      ) : null}
      {missedNote ? (
        <div className="mb-5">
          <Notice>{missedNote}</Notice>
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile
          label="Sessions"
          value={`${bundle.sessionsCount}`}
          hint="Games opened this week"
        />
        <StatTile
          label="Finished"
          value={`${bundle.finishedCount}`}
          hint="They stayed until the warm ending"
        />
        <StatTile
          label="Usual accuracy"
          value={`${Math.round(bundle.patient.baselineAccuracy)}%`}
          hint="Personal baseline only"
        />
      </div>
    </>
  );
}
