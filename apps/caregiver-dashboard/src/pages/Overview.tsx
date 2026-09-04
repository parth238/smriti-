import { useEffect, useState } from "react";

import { loadCaregiverAnalytics, type AnalyticsBundle } from "../api/analytics";
import type { CaregiverDataFailure } from "../api/errors";
import { PATIENT_CHANGE_EVENT } from "../api/patients";
import { loadReminders } from "../api/reminders";
import { CaregiverDataError } from "../components/CaregiverDataError";
import { Notice } from "../components/Notice";
import { PageHeader } from "../components/PageHeader";
import { StatTile } from "../components/StatTile";

export function Overview() {
  const [bundle, setBundle] = useState<AnalyticsBundle | null>(null);
  const [missedNote, setMissedNote] = useState<string | null>(null);
  const [reminderError, setReminderError] = useState<CaregiverDataFailure | null>(null);

  async function refresh() {
    setBundle(null);
    const analytics = await loadCaregiverAnalytics();
    if (analytics.source === "error") {
      setBundle(analytics);
      setMissedNote(null);
      setReminderError(null);
      return;
    }
    const reminders = await loadReminders();
    if (reminders.source === "live") {
      setReminderError(null);
      const missed = reminders.rows.filter((row) => row.status === "missed");
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
      setReminderError(reminders.error);
      if (reminders.error.kind === "authentication") {
        setBundle({ source: "error", error: reminders.error });
        return;
      }
    }
    setBundle(analytics);
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

  if (bundle.source === "error") {
    return (
      <>
        <PageHeader title="Caregiver overview" hint="Live information for your linked family member." />
        <CaregiverDataError error={bundle.error} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={`${bundle.patient.label} this week`}
        hint={`${bundle.patient.language}. Comparisons are against their own usual week, never a population range.`}
      />
      <p className="mb-4 text-sm text-mist-blue">{bundle.updatedLabel}</p>
      {missedNote ? (
        <div className="mb-5">
          <Notice>{missedNote}</Notice>
        </div>
      ) : null}
      {reminderError ? (
        <div className="mb-5">
          <CaregiverDataError error={reminderError} />
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
          value={
            bundle.patient.baselineAccuracy === null
              ? "Not set"
              : `${Math.round(bundle.patient.baselineAccuracy)}%`
          }
          hint="Personal baseline only"
        />
      </div>
    </>
  );
}
