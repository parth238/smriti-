import { useEffect, useState } from "react";

import { loadCaregiverAnalytics, type AnalyticsBundle } from "../api/analytics";
import { TrendChart } from "../components/charts/TrendChart";
import { Notice } from "../components/Notice";
import { PageHeader } from "../components/PageHeader";

export function Analytics() {
  const [bundle, setBundle] = useState<AnalyticsBundle | null>(null);

  useEffect(() => {
    void loadCaregiverAnalytics().then(setBundle);
  }, []);

  if (!bundle) {
    return <p className="text-mist-blue">Loading analytics…</p>;
  }

  return (
    <>
      <PageHeader
        title="This week beside their usual"
        hint="Dashed line is their personal baseline. Nothing here is a diagnosis."
      />
      <p className="mb-4 text-sm text-mist-blue">{bundle.updatedLabel}</p>
      {bundle.source === "demo" ? (
        <div className="mb-5">
          <Notice>
            Charts below are labeled demo or last-cached data, not live truth.
          </Notice>
        </div>
      ) : null}
      <section className="mb-8 rounded-xl bg-white p-5">
        <h2 className="mb-3 font-semibold">Accuracy</h2>
        <TrendChart
          data={bundle.trends}
          dataKey="accuracy"
          baseline={bundle.patient.baselineAccuracy}
        />
      </section>
      <section className="rounded-xl bg-white p-5">
        <h2 className="mb-3 font-semibold">Reaction time</h2>
        <TrendChart
          data={bundle.trends}
          dataKey="reactionMs"
          baseline={bundle.patient.baselineReactionMs}
        />
        {bundle.note ? <p className="mt-3 text-sm text-mist-blue">{bundle.note}</p> : null}
      </section>
    </>
  );
}
