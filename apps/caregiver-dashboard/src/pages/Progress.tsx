import React, { useState } from "react";

import { loadCaregiverAnalytics } from "../api/analytics";
import { CaregiverDataError } from "../components/CaregiverDataError";
import { PageHeader } from "../components/PageHeader";
import { RefreshStatus } from "../components/RefreshStatus";
import { Skeleton } from "../components/Skeleton";
import { StatTile } from "../components/StatTile";
import { TrendChart } from "../components/charts/TrendChart";
import { useCaregiverLiveRefresh } from "../hooks/useCaregiverLiveRefresh";
import {
  computeProgressMetrics,
  deduplicateSessions,
  sortSessionsNewestFirst,
  sortTrendsChronologically,
} from "../lib/progressAnalytics";

export function Progress() {
  const {
    data: bundle,
    status,
    lastUpdatedLabel,
    isUpdating,
    refresh,
  } = useCaregiverLiveRefresh({
    fetcher: loadCaregiverAnalytics,
    intervalMs: 60_000,
    staleMs: 30_000,
  });

  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(
    null,
  );

  function toggleSession(id: string) {
    setExpandedSessionId((previous) => (previous === id ? null : id));
  }

  if (!bundle) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
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
          action={
            <RefreshStatus
              status={status}
              lastUpdatedLabel={lastUpdatedLabel}
              isUpdating={isUpdating}
              onRefresh={refresh}
            />
          }
        />
        <CaregiverDataError error={bundle.error} />
      </>
    );
  }

  // Consistent, deduplicated metrics derived from real session data
  const metrics = computeProgressMetrics(bundle.sessions);
  const chronologicalTrends = sortTrendsChronologically(bundle.trends);
  const displaySessions = sortSessionsNewestFirst(
    deduplicateSessions(bundle.sessions),
  );

  const completionRateDisplay =
    metrics.completionRate !== null ? `${metrics.completionRate}%` : "—";
  const accuracyDisplay =
    metrics.avgAccuracy !== null
      ? `${metrics.avgAccuracy}%`
      : bundle.periodAccuracy !== null
        ? `${Math.round(bundle.periodAccuracy)}%`
        : "—";
  const reactionDisplay =
    metrics.avgReactionMs !== null
      ? `${metrics.avgReactionMs}ms`
      : bundle.periodReactionMs !== null
        ? `${Math.round(bundle.periodReactionMs)}ms`
        : "—";

  return (
    <>
      <PageHeader
        title="Weekly Progress"
        hint="Performance compared to their personal baseline. Nothing here is a diagnosis."
        action={
          <RefreshStatus
            status={status}
            lastUpdatedLabel={lastUpdatedLabel}
            isUpdating={isUpdating}
            onRefresh={refresh}
          />
        }
      />

      {/* 1. Summary Cards */}
      <section className="mb-8" aria-labelledby="summary-heading">
        <h2 id="summary-heading" className="sr-only">
          Progress Summary
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label="Sessions"
            value={String(metrics.totalSessions)}
            hint={
              metrics.totalSessions > 0
                ? `${metrics.completedSessions} completed this week`
                : "No sessions recorded"
            }
          />

          <StatTile
            label="Completion Rate"
            value={completionRateDisplay}
            hint={
              metrics.totalSessions > 0
                ? "Finished to completion"
                : "Awaiting sessions"
            }
          />

          <StatTile
            label="Avg Accuracy"
            value={accuracyDisplay}
            hint={
              bundle.patient.baselineAccuracy !== null
                ? `Baseline: ${Math.round(bundle.patient.baselineAccuracy)}%`
                : "Personal baseline only"
            }
          />

          <StatTile
            label="Avg Reaction"
            value={reactionDisplay}
            hint={
              bundle.patient.baselineReactionMs !== null
                ? `Baseline: ${Math.round(bundle.patient.baselineReactionMs)}ms`
                : "Personal baseline only"
            }
          />
        </div>
      </section>

      {/* Narrative Context Card */}
      <section className="mb-8 rounded-2xl border border-sand bg-white p-6 shadow-xs">
        <h2 className="mb-3 font-serif text-xl font-medium tracking-tight text-deep-hill">
          What changed this week?
        </h2>

        {metrics.totalSessions === 0 ? (
          <p className="text-sm text-mist-blue">
            No game sessions recorded during this period.
          </p>
        ) : (
          <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-deep-hill">
            <li>
              {metrics.totalSessions} session
              {metrics.totalSessions !== 1 ? "s" : ""}{" "}
              {metrics.totalSessions === 1 ? "was" : "were"} opened across{" "}
              {metrics.activeDaysCount} active day
              {metrics.activeDaysCount !== 1 ? "s" : ""}.
            </li>

            <li>
              {metrics.completedSessions} session
              {metrics.completedSessions !== 1 ? "s" : ""}{" "}
              {metrics.completedSessions === 1 ? "was" : "were"} completed (
              {completionRateDisplay} finish rate).
            </li>

            {metrics.avgAccuracy !== null &&
            bundle.patient.baselineAccuracy !== null ? (
              <li>
                Average accuracy this week: {metrics.avgAccuracy}% (personal
                baseline {Math.round(bundle.patient.baselineAccuracy)}%).
              </li>
            ) : null}

            {bundle.note ? (
              <li className="italic text-mist-blue">{bundle.note}</li>
            ) : null}
          </ul>
        )}
      </section>

      {/* 2. Chronological Trends */}
      <section className="mb-8" aria-labelledby="trends-heading">
        <h2 id="trends-heading" className="sr-only">
          Performance Trends
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl border border-sand bg-white p-6 shadow-xs">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-serif text-lg font-medium tracking-tight text-deep-hill">
                Accuracy Trend
              </h3>
              {bundle.patient.baselineAccuracy !== null ? (
                <span className="text-xs text-mist-blue">
                  Baseline: {Math.round(bundle.patient.baselineAccuracy)}%
                </span>
              ) : null}
            </div>

            {chronologicalTrends.length > 0 &&
            bundle.patient.baselineAccuracy !== null ? (
              <TrendChart
                data={chronologicalTrends}
                dataKey="accuracy"
                baseline={bundle.patient.baselineAccuracy}
              />
            ) : (
              <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-sand bg-sand/10 text-center">
                <p className="text-sm text-mist-blue">
                  Not enough live sessions to show an accuracy trend yet.
                </p>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-sand bg-white p-6 shadow-xs">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-serif text-lg font-medium tracking-tight text-deep-hill">
                Reaction Time Trend
              </h3>
              {bundle.patient.baselineReactionMs !== null ? (
                <span className="text-xs text-mist-blue">
                  Baseline: {Math.round(bundle.patient.baselineReactionMs)}ms
                </span>
              ) : null}
            </div>

            {chronologicalTrends.length > 0 &&
            bundle.patient.baselineReactionMs !== null ? (
              <TrendChart
                data={chronologicalTrends}
                dataKey="reactionMs"
                baseline={bundle.patient.baselineReactionMs}
              />
            ) : (
              <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-sand bg-sand/10 text-center">
                <p className="text-sm text-mist-blue">
                  Not enough live sessions to show a reaction trend yet.
                </p>
              </div>
            )}
          </section>
        </div>
      </section>

      {/* 3. Game Breakdown */}
      <section className="mb-8 rounded-2xl border border-sand bg-white p-6 shadow-xs">
        <h2 className="mb-4 font-serif text-xl font-medium tracking-tight text-deep-hill">
          Game Breakdown
        </h2>

        {metrics.gameStats.length === 0 ? (
          <p className="text-sm text-mist-blue">
            No game breakdowns available yet.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {metrics.gameStats.map((gameStat) => (
              <div
                key={gameStat.game}
                className="flex flex-col justify-between rounded-xl border border-sand bg-sand/15 p-4 transition-shadow hover:shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-deep-hill">
                      {gameStat.game}
                    </h3>
                    <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-deep-hill shadow-2xs">
                      {gameStat.totalSessions} played
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-mist-blue">
                    <div>
                      <p className="text-mist-blue/80">Avg Accuracy</p>
                      <p className="text-sm font-semibold text-deep-hill">
                        {gameStat.avgAccuracy !== null
                          ? `${gameStat.avgAccuracy}%`
                          : "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-mist-blue/80">Completion</p>
                      <p className="text-sm font-semibold text-deep-hill">
                        {gameStat.completionRate !== null
                          ? `${gameStat.completionRate}%`
                          : "—"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 border-t border-sand/60 pt-2 text-xs text-mist-blue">
                  <span>
                    {gameStat.completedSessions} of {gameStat.totalSessions}{" "}
                    completed
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. Smaller Session History */}
      <section className="mb-8 rounded-2xl border border-sand bg-white p-6 shadow-xs">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-xl font-medium tracking-tight text-deep-hill">
            Session History
          </h2>
          <span className="text-xs text-mist-blue">
            {displaySessions.length} session
            {displaySessions.length !== 1 ? "s" : ""} recorded
          </span>
        </div>

        {displaySessions.length === 0 ? (
          <p className="text-sm text-mist-blue">
            No game sessions recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-mist-blue/20 text-xs font-semibold uppercase tracking-wider text-mist-blue">
                  <th className="w-8 pb-3 pr-2" />
                  <th className="pb-3 pr-4 font-medium">Game</th>
                  <th className="pb-3 pr-4 font-medium">When</th>
                  <th className="pb-3 pr-4 font-medium">Accuracy</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-mist-blue/10">
                {displaySessions.map((row) => (
                  <React.Fragment key={row.id}>
                    <tr
                      className="group cursor-pointer transition-colors hover:bg-mist-blue/5"
                      onClick={() => toggleSession(row.id)}
                    >
                      <td className="py-3 pr-2 text-mist-blue">
                        <span
                          className={`inline-block transition-transform duration-150 ${
                            expandedSessionId === row.id ? "rotate-90" : ""
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
                        {typeof row.accuracy === "number" ? (
                          <span className="inline-flex items-center rounded-full bg-mist-blue/10 px-2.5 py-0.5 font-medium text-deep-hill">
                            {row.accuracy}%
                          </span>
                        ) : (
                          <span className="text-mist-blue">—</span>
                        )}
                      </td>

                      <td className="py-3">
                        {row.completed ? (
                          <span className="inline-flex items-center rounded-md bg-tea-garden/15 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-tea-garden">
                            Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-amber-700">
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
                              <p className="mb-1 text-xs uppercase tracking-wider text-mist-blue">
                                Reaction Time
                              </p>
                              <p className="font-medium text-deep-hill">
                                {typeof row.reactionMs === "number"
                                  ? `${row.reactionMs} ms`
                                  : "—"}
                              </p>
                            </div>

                            <div>
                              <p className="mb-1 text-xs uppercase tracking-wider text-mist-blue">
                                Session Status
                              </p>
                              <p className="font-medium text-deep-hill">
                                {row.completed
                                  ? "Finished completely"
                                  : "Stopped / Quit early"}
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