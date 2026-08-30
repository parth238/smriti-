import { useEffect, useState } from "react";

import { loadCaregiverAnalytics, type AnalyticsBundle } from "../api/analytics";
import { Notice } from "../components/Notice";
import { PageHeader } from "../components/PageHeader";
import { StatTile } from "../components/StatTile";
import { REMINDERS } from "../data/demo";

export function Overview() {
  const [bundle, setBundle] = useState<AnalyticsBundle | null>(null);

  useEffect(() => {
    void loadCaregiverAnalytics().then(setBundle);
  }, []);

  if (!bundle) {
    return <p className="text-mist-blue">Loading overview…</p>;
  }

  const missed = REMINDERS.filter((row) => row.missed).length;
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
      {missed ? (
        <div className="mb-5">
          <Notice>
            Evening medicine at 8 PM was not marked done. This is a reminder note, not a medical
            warning.
          </Notice>
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
