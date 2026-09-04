import { useEffect, useState } from "react";

import { loadCaregiverAnalytics, type AnalyticsBundle } from "../api/analytics";
import type { CaregiverDataFailure } from "../api/errors";
import { PATIENT_CHANGE_EVENT } from "../api/patients";
import { loadReminders } from "../api/reminders";
import { CaregiverDataError } from "../components/CaregiverDataError";
import { Notice } from "../components/Notice";
import { PageHeader } from "../components/PageHeader";
import { StatTile } from "../components/StatTile";

type TimelineItem = {
  id: string;
  time: Date;
  title: string;
  status: "upcoming" | "done" | "missed" | "completed" | "stopped";
  type: "reminder" | "session";
};

function parseDate(value: string): Date {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date(0) : date;
}

function isToday(value: string): boolean {
  const date = parseDate(value);
  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

export function Overview() {
  const [bundle, setBundle] = useState<AnalyticsBundle | null>(null);
  const [missedNote, setMissedNote] = useState<string | null>(null);
  const [reminderError, setReminderError] =
    useState<CaregiverDataFailure | null>(null);

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

      const missed = reminders.rows.filter(
        (row) => row.status === "missed",
      );

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

    return () =>
      window.removeEventListener(PATIENT_CHANGE_EVENT, onPatientChange);
  }, []);

  if (!bundle) {
    return <p className="text-mist-blue">Loading overview...</p>;
  }

  if (bundle.source === "error") {
    return (
      <>
        <PageHeader
          title="Caregiver overview"
          hint="Live information for your linked family member."
        />
        <CaregiverDataError error={bundle.error} />
      </>
    );
  }

  /*
   * The dashboard presentation below is derived only from the
   * real analytics/reminder data already loaded above.
   */
  const analytics = bundle;

  /*
   * We need the reminder data for the timeline. Load it again here only
   * if the initial refresh did not expose it as state. This presentation
   * remains real-data-only; errors are surfaced rather than replaced
   * with demo content.
   */
  const todaySessions = analytics.sessions.filter((session) =>
    isToday(session.playedAt),
  );

  const timeline: TimelineItem[] = [];

  todaySessions.forEach((session) => {
    timeline.push({
      id: `ses-${session.id}`,
      time: parseDate(session.playedAt),
      title: session.game,
      status: session.completed ? "completed" : "stopped",
      type: "session",
    });
  });

  timeline.sort((a, b) => a.time.getTime() - b.time.getTime());

  const sessionsOpenedToday = todaySessions.length;
  const sessionsCompletedToday = todaySessions.filter(
    (session) => session.completed,
  ).length;

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

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-sand bg-white p-6 shadow-xs lg:col-span-2">
          <h2 className="mb-4 font-serif text-xl font-medium tracking-tight text-deep-hill">
            Today&apos;s Activity
          </h2>

          {timeline.length === 0 ? (
            <p className="text-sm text-mist-blue">
              No game sessions recorded today.
            </p>
          ) : (
            <div className="space-y-4">
              {timeline.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-sand bg-white p-4 shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-tea-garden/15 text-tea-garden">
                      {item.status === "completed" ? "✓" : "–"}
                    </div>

                    <div>
                      <h3 className="font-medium text-deep-hill">
                        {item.title}
                      </h3>
                      <p className="text-xs uppercase tracking-wider text-mist-blue">
                        {item.type}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-xs font-semibold uppercase tracking-wider ${item.status === "completed"
                          ? "text-tea-garden"
                          : "text-yellow-600"
                        }`}
                    >
                      {item.status === "completed"
                        ? "Completed"
                        : "Stopped"}
                    </span>

                    <p className="mt-0.5 text-xs text-mist-blue">
                      {item.time.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="space-y-6">
          <section className="rounded-2xl border border-sand bg-white p-6 shadow-xs">
            <h2 className="mb-2 font-serif text-lg font-medium text-deep-hill">
              Caregiver Snapshot
            </h2>

            <p className="text-sm font-medium text-tea-garden">
              {sessionsCompletedToday > 0
                ? "Activity recorded today."
                : "No sessions completed yet today."}
            </p>

            <p className="mt-2 text-xs text-mist-blue">
              {sessionsOpenedToday > 0
                ? `Completed ${sessionsCompletedToday} session${sessionsCompletedToday !== 1 ? "s" : ""
                } today.`
                : "No sessions opened today."}
            </p>
          </section>

          <section className="rounded-2xl border border-sand bg-white p-6 shadow-xs">
            <h2 className="mb-3 font-serif text-lg font-medium text-deep-hill">
              Quick Actions
            </h2>

            <div className="space-y-2">
              <a
                href="/reminders"
                className="block rounded-xl bg-sand/60 px-4 py-3 text-sm font-medium text-deep-hill transition hover:bg-sand"
              >
                + Add reminder
              </a>

              <a
                href="/memories"
                className="block rounded-xl bg-sand/60 px-4 py-3 text-sm font-medium text-deep-hill transition hover:bg-sand"
              >
                + Add memory photo
              </a>

              <a
                href="/progress"
                className="block rounded-xl bg-sand/60 px-4 py-3 text-sm font-medium text-deep-hill transition hover:bg-sand"
              >
                View progress
              </a>

              <a
                href="/alerts"
                className="block rounded-xl bg-sand/60 px-4 py-3 text-sm font-medium text-deep-hill transition hover:bg-sand"
              >
                View alerts
              </a>
            </div>
          </section>
        </div>
      </div>

      <section className="mb-8 mt-8 rounded-2xl border border-sand bg-white p-6 shadow-xs">
        <h2 className="mb-4 font-serif text-xl font-medium tracking-tight text-deep-hill">
          Recent Activity
        </h2>

        {analytics.sessions.length === 0 ? (
          <p className="text-sm text-mist-blue">
            No recent game sessions.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-mist-blue/20 text-mist-blue">
                  <th className="pb-3 pr-4 font-medium">Game</th>
                  <th className="pb-3 pr-4 font-medium">When</th>
                  <th className="pb-3 pr-4 font-medium">Accuracy</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-mist-blue/10">
                {analytics.sessions.slice(0, 5).map((row) => (
                  <tr key={row.id}>
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}