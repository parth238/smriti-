import React, { useEffect, useState } from "react";

import {
  loadCaregiverAnalytics,
  type AnalyticsBundle,
} from "../api/analytics";
import { PATIENT_CHANGE_EVENT } from "../api/patients";
import { CaregiverDataError } from "../components/CaregiverDataError";
import { TrendChart } from "../components/charts/TrendChart";
import { StatTile } from "../components/StatTile";
import { PageHeader } from "../components/PageHeader";
import { Skeleton } from "../components/Skeleton";

export function Progress() {
  const [bundle, setBundle] = useState<AnalyticsBundle | null>(null);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    void loadCaregiverAnalytics().then(setBundle);

    const onPatientChange = () => {
      void loadCaregiverAnalytics().then(setBundle);
    };

    window.addEventListener(PATIENT_CHANGE_EVENT, onPatientChange);

    return () =>
      window.removeEventListener(PATIENT_CHANGE_EVENT, onPatientChange);
  }, []);

  if (!bundle) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (bundle.source === "error") {
    return (
      <>
        <PageHeader
          title="Weekly Progress"
          hint="Performance compared to their personal baseline. Nothing here is a diagnosis."
        />
        <CaregiverDataError error={bundle.error} />
      </>
    );
  }

  const completionRate =
    bundle.sessionsCount > 0
      ? Math.round(
        (bundle.finishedCount / bundle.sessionsCount) * 100,
      )
      : 0;

  function toggleSession(id: string) {
    setExpandedSessionId((previous) =>
      previous === id ? null : id,
    );
  }

  return (
    <>
      <PageHeader
        title="Weekly Progress"
        hint="Performance compared to their personal baseline. Nothing here is a diagnosis."
      />

      <p className="mb-5 text-sm text-mist-blue">
        {bundle.updatedLabel}
      </p>

      <section className="mb-8">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          <StatTile
            label="Sessions"
            value={String(bundle.sessionsCount)}
            hint="Total this week"
          />

          <StatTile
            label="Completion Rate"
            value={`${completionRate}%`}
            hint="Sessions finished"
          />

          <StatTile
            label="Avg Accuracy"
            value={
              bundle.periodAccuracy !== null
                ? `${Math.round(bundle.periodAccuracy)}%`
                : "N/A"
            }
            hint="Overall this week"
          />

          <StatTile
            label="Avg Reaction"
            value={
              bundle.periodReactionMs !== null
                ? `${Math.round(bundle.periodReactionMs)}ms`
                : "N/A"
            }
            hint="Overall this week"
          />
        </div>
      </section>

      <section className="mb-8 rounded-2xl border border-sand bg-white p-6 shadow-xs">
        <h2 className="mb-3 font-serif text-xl font-medium tracking-tight text-deep-hill">
          What changed this week?
        </h2>

        <ul className="list-disc space-y-1 pl-5 text-deep-hill">
          <li>
            {bundle.sessionsCount} session
            {bundle.sessionsCount !== 1 ? "s" : ""}{" "}
            {bundle.sessionsCount === 1 ? "was" : "were"} opened.
          </li>

          <li>
            {bundle.finishedCount} session
            {bundle.finishedCount !== 1 ? "s" : ""}{" "}
            {bundle.finishedCount === 1 ? "was" : "were"} completed (
            {completionRate}% finish rate).
          </li>

          {bundle.periodAccuracy !== null &&
            bundle.patient.baselineAccuracy !== null ? (
            <li>
              Average accuracy this week:{" "}
              {Math.round(bundle.periodAccuracy)}% (baseline{" "}
              {Math.round(bundle.patient.baselineAccuracy)}%).
            </li>
          ) : null}

          {bundle.note ? <li>{bundle.note}</li> : null}
        </ul>
      </section>

      <div className="mb-8 grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-sand bg-white p-6 shadow-xs">
          <h2 className="mb-3 font-serif text-lg font-medium tracking-tight text-deep-hill">
            Accuracy Trend
          </h2>

          {bundle.trends.length > 0 &&
            bundle.patient.baselineAccuracy !== null ? (
            <TrendChart
              data={bundle.trends}
              dataKey="accuracy"
              baseline={bundle.patient.baselineAccuracy}
            />
          ) : (
            <p className="text-sm text-mist-blue">
              Not enough live sessions to show an accuracy trend yet.
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-sand bg-white p-6 shadow-xs">
          <h2 className="mb-3 font-serif text-lg font-medium tracking-tight text-deep-hill">
            Reaction Time
          </h2>

          {bundle.trends.length > 0 &&
            bundle.patient.baselineReactionMs !== null ? (
            <TrendChart
              data={bundle.trends}
              dataKey="reactionMs"
              baseline={bundle.patient.baselineReactionMs}
            />
          ) : (
            <p className="text-sm text-mist-blue">
              Not enough live sessions to show a reaction trend yet.
            </p>
          )}
        </section>
      </div>

      <section className="mb-8 rounded-2xl border border-sand bg-white p-6 shadow-xs">
        <h2 className="mb-4 font-serif text-xl font-medium tracking-tight text-deep-hill">
          Session History
        </h2>

        {bundle.sessions.length === 0 ? (
          <p className="text-mist-blue">
            No game sessions recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-mist-blue/20 text-mist-blue">
                  <th className="w-8 pb-3 pr-4 font-medium" />
                  <th className="pb-3 pr-4 font-medium">Game</th>
                  <th className="pb-3 pr-4 font-medium">When</th>
                  <th className="pb-3 pr-4 font-medium">Accuracy</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-mist-blue/10">
                {bundle.sessions.map((row) => (
                  <React.Fragment key={row.id}>
                    <tr
                      className="group cursor-pointer transition-colors hover:bg-mist-blue/5"
                      onClick={() => toggleSession(row.id)}
                    >
                      <td className="py-3 pr-2 text-mist-blue">
                        <span
                          className={`inline-block transition-transform ${expandedSessionId === row.id
                            ? "rotate-90"
                            : ""
                            }`}
                        >
                          ›
                        </span>
                      </td>

                      <td className="py-3 pr-4 font-medium text-deep-hill">
                        {row.game}
                      </td>

                      <td className="py-3 pr-4 text-mist-blue">
                        {row.playedAt}
                      </td>

                      <td className="py-3 pr-4">
                        <span className="inline-flex items-center rounded-full bg-mist-blue/10 px-2.5 py-0.5 font-medium text-deep-hill">
                          {row.accuracy}%
                        </span>
                      </td>

                      <td className="py-3">
                        {row.completed ? (
                          <span className="font-medium text-tea-garden">
                            Completed
                          </span>
                        ) : (
                          <span className="text-yellow-600">
                            Stopped early
                          </span>
                        )}
                      </td>
                    </tr>

                    {expandedSessionId === row.id ? (
                      <tr className="bg-mist-blue/5">
                        <td
                          colSpan={5}
                          className="border-b border-mist-blue/10 px-6 py-4"
                        >
                          <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                            <div>
                              <p className="mb-1 text-mist-blue">
                                Reaction Time
                              </p>
                              <p className="font-medium text-deep-hill">
                                {row.reactionMs} ms
                              </p>
                            </div>

                            <div>
                              <p className="mb-1 text-mist-blue">
                                Session Status
                              </p>
                              <p className="font-medium text-deep-hill">
                                {row.completed
                                  ? "Completed"
                                  : "Stopped early"}
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}