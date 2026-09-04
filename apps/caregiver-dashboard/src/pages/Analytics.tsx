import { useEffect, useState } from "react";

import { loadCaregiverAnalytics, type AnalyticsBundle } from "../api/analytics";
import { PATIENT_CHANGE_EVENT } from "../api/patients";
import { CaregiverDataError } from "../components/CaregiverDataError";
import { TrendChart } from "../components/charts/TrendChart";
import { PageHeader } from "../components/PageHeader";

export function Analytics() {
  const [bundle, setBundle] = useState<AnalyticsBundle | null>(null);

  useEffect(() => {
    void loadCaregiverAnalytics().then(setBundle);
    const onPatientChange = () => void loadCaregiverAnalytics().then(setBundle);
    window.addEventListener(PATIENT_CHANGE_EVENT, onPatientChange);
    return () => window.removeEventListener(PATIENT_CHANGE_EVENT, onPatientChange);
  }, []);

  if (!bundle) {
    return <p className="text-mist-blue">Loading analytics…</p>;
  }

  if (bundle.source === "error") {
    return (
      <>
        <PageHeader
          title="This week beside their usual"
          hint="Dashed line is their personal baseline. Nothing here is a diagnosis."
        />
        <CaregiverDataError error={bundle.error} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="This week beside their usual"
        hint="Dashed line is their personal baseline. Nothing here is a diagnosis."
      />
      <p className="mb-4 text-sm text-mist-blue">{bundle.updatedLabel}</p>
      <section className="mb-8 rounded-xl bg-white p-5">
        <h2 className="mb-3 font-semibold">Accuracy</h2>
        {bundle.trends.length > 0 && bundle.patient.baselineAccuracy !== null ? (
          <TrendChart
            data={bundle.trends}
            dataKey="accuracy"
            baseline={bundle.patient.baselineAccuracy}
          />
        ) : (
          <p className="text-mist-blue">Not enough live sessions to show an accuracy trend yet.</p>
        )}
      </section>
      <section className="rounded-xl bg-white p-5">
        <h2 className="mb-3 font-semibold">Reaction time</h2>
        {bundle.trends.length > 0 && bundle.patient.baselineReactionMs !== null ? (
          <TrendChart
            data={bundle.trends}
            dataKey="reactionMs"
            baseline={bundle.patient.baselineReactionMs}
          />
        ) : (
          <p className="text-mist-blue">Not enough live sessions to show a reaction trend yet.</p>
        )}
        {bundle.note ? <p className="mt-3 text-sm text-mist-blue">{bundle.note}</p> : null}
      </section>
    </>
  );
}
