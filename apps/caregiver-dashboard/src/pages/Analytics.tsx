import { TrendChart } from "../components/charts/TrendChart";
import { PageHeader } from "../components/PageHeader";
import { PATIENT, TRENDS } from "../data/demo";

export function Analytics() {
  return (
    <>
      <PageHeader
        title="This week beside their usual"
        hint="Dashed line is their personal baseline. Nothing here is a diagnosis."
      />
      <section className="mb-8 rounded-xl bg-white p-5">
        <h2 className="mb-3 font-semibold">Accuracy</h2>
        <TrendChart data={TRENDS} dataKey="accuracy" baseline={PATIENT.baselineAccuracy} />
      </section>
      <section className="rounded-xl bg-white p-5">
        <h2 className="mb-3 font-semibold">Reaction time</h2>
        <TrendChart data={TRENDS} dataKey="reactionMs" baseline={PATIENT.baselineReactionMs} />
        <p className="mt-3 text-sm text-mist-blue">
          Reaction time is a bit higher than usual this week.
        </p>
      </section>
    </>
  );
}
