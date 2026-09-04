import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { loadCaregiverAnalytics, type AnalyticsBundle } from "../api/analytics";
import type { CaregiverDataFailure } from "../api/errors";
import { PATIENT_CHANGE_EVENT } from "../api/patients";
import { loadReminders } from "../api/reminders";
import { CaregiverDataError } from "../components/CaregiverDataError";
import { Notice } from "../components/Notice";
import { PageHeader } from "../components/PageHeader";
import { Skeleton } from "../components/Skeleton";
import { StatTile } from "../components/StatTile";
import type { ReminderRow, SessionRow } from "../data/demo";

type TimelineItem = {
  id: string;
  time: Date;
  timeLabel: string;
  title: string;
  type: "session" | "reminder";
  status: "completed" | "stopped" | "done" | "missed" | "upcoming" | "due";
  statusLabel: string;
};

function parseIsoOrDate(value?: string | null): Date {
  if (!value) {
    return new Date(0);
  }
  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) {
    return date;
  }
  return new Date(0);
}

function isToday(isoOrFormatted?: string | null): boolean {
  if (!isoOrFormatted) {
    return false;
  }
  const date = new Date(isoOrFormatted);
  const today = new Date();
  if (!Number.isNaN(date.getTime())) {
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }
  const dayStr = today.getDate().toString();
  const monthShort = today
    .toLocaleString("en-US", { month: "short" })
    .toLowerCase();
  const lower = isoOrFormatted.toLowerCase();
  return (
    lower.includes(monthShort) &&
    (lower.includes(` ${dayStr} `) ||
      lower.includes(` ${dayStr},`) ||
      lower.includes(`, ${dayStr} `) ||
      lower.includes(` ${dayStr}`))
  );
}

export function Overview() {
  const [bundle, setBundle] = useState<AnalyticsBundle | null>(null);
  const [reminders, setReminders] = useState<ReminderRow[]>([]);
  const [missedNote, setMissedNote] = useState<string | null>(null);
  const [reminderError, setReminderError] =
    useState<CaregiverDataFailure | null>(null);

  async function refresh() {
    const analytics = await loadCaregiverAnalytics();

    if (analytics.source === "error") {
      setBundle(analytics);
      setReminders([]);
      setMissedNote(null);
      setReminderError(null);
      return;
    }

    const remindersResult = await loadReminders();

    if (remindersResult.source === "live") {
      setReminderError(null);
      setReminders(remindersResult.rows);

      const missed = remindersResult.rows.filter(
        (row) => row.status === "missed" || (row.missed && !row.acknowledged),
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
      setReminders([]);
      setMissedNote(null);
      setReminderError(remindersResult.error);

      if (remindersResult.error.kind === "authentication") {
        setBundle({ source: "error", error: remindersResult.error });
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
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
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

  const analytics = bundle;

  // Single consistent source of truth: all sessions sorted newest first
  const allSessions: SessionRow[] = [...analytics.sessions].sort(
    (a, b) =>
      parseIsoOrDate(b.playedAtIso ?? b.playedAt).getTime() -
      parseIsoOrDate(a.playedAtIso ?? a.playedAt).getTime(),
  );

  // Today's sessions derived consistently
  const todaySessions = allSessions.filter((session) =>
    isToday(session.playedAtIso ?? session.playedAt),
  );
  const sessionsOpenedToday = todaySessions.length;
  const sessionsCompletedToday = todaySessions.filter(
    (session) => session.completed,
  ).length;

  // Real reminder stats for today
  const todayReminders = reminders.filter((row) =>
    isToday(row.scheduledTime),
  );
  const todayDoneReminders = todayReminders.filter(
    (row) => row.acknowledged || row.status === "acknowledged",
  );
  const todayMissedReminders = todayReminders.filter(
    (row) => row.status === "missed" || (row.missed && !row.acknowledged),
  );

  // Latest real session activity (newest from allSessions)
  const lastSession: SessionRow | undefined = allSessions[0];

  // Next upcoming active reminder
  const upcomingReminders = reminders
    .filter((r) => {
      if (!r.scheduledTime || r.active === false || r.acknowledged) {
        return false;
      }
      const d = new Date(r.scheduledTime);
      return !Number.isNaN(d.getTime()) && d.getTime() >= Date.now();
    })
    .sort(
      (a, b) =>
        parseIsoOrDate(a.scheduledTime).getTime() -
        parseIsoOrDate(b.scheduledTime).getTime(),
    );
  const nextReminder = upcomingReminders[0];

  // Build combined Today's Timeline with ALL real activities from today
  const timeline: TimelineItem[] = [];

  todaySessions.forEach((session) => {
    const timeObj = parseIsoOrDate(session.playedAtIso ?? session.playedAt);
    const timeFormatted =
      timeObj.getTime() !== 0
        ? timeObj.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          })
        : session.playedAt;

    timeline.push({
      id: `ses-${session.id}`,
      time: timeObj,
      timeLabel: timeFormatted,
      title: session.game,
      type: "session",
      status: session.completed ? "completed" : "stopped",
      statusLabel: session.completed ? "COMPLETED" : "STOPPED",
    });
  });

  todayReminders.forEach((reminder) => {
    const isDone = Boolean(
      reminder.acknowledged || reminder.status === "acknowledged",
    );
    const isMissed =
      reminder.status === "missed" ||
      Boolean(reminder.missed && !reminder.acknowledged);
    const isDue = reminder.status === "due";
    const timeObj = parseIsoOrDate(reminder.scheduledTime);
    const timeFormatted =
      timeObj.getTime() !== 0
        ? timeObj.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          })
        : reminder.time;

    timeline.push({
      id: `rem-${reminder.id}`,
      time: timeObj,
      timeLabel: timeFormatted,
      title: reminder.title,
      type: "reminder",
      status: isDone ? "done" : isMissed ? "missed" : isDue ? "due" : "upcoming",
      statusLabel: isDone
        ? "DONE"
        : isMissed
          ? "MISSED"
          : isDue
            ? "DUE NOW"
            : "SCHEDULED",
    });
  });

  // Sort chronological newest first
  timeline.sort((a, b) => b.time.getTime() - a.time.getTime());

  return (
    <>
      <PageHeader
        title={`${bundle.patient.label} today`}
        hint={`${bundle.patient.language}. Comparisons are against their own usual baseline, never a population range.`}
      />

      <p className="mb-4 text-xs font-medium text-mist-blue">
        {bundle.updatedLabel}
      </p>

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

      {/* 4 Compact Stat Cards in 1 Row */}
      <section className="mb-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label="Sessions"
            value={
              sessionsOpenedToday > 0
                ? `${sessionsCompletedToday} / ${sessionsOpenedToday}`
                : "0 / 0"
            }
            hint={
              sessionsOpenedToday > 0
                ? "Completed today"
                : "No sessions today"
            }
          />

          <StatTile
            label="Reminders"
            value={`${todayDoneReminders.length} / ${todayMissedReminders.length}`}
            hint="Done / missed today"
          />

          <StatTile
            label="Last Activity"
            value={lastSession ? lastSession.game : "None"}
            hint={lastSession ? lastSession.playedAt : "No recent activity"}
          />

          <StatTile
            label="Next Up"
            value={nextReminder ? nextReminder.title : "All clear"}
            hint={nextReminder ? nextReminder.time : "No pending items"}
          />
        </div>
      </section>

      {/* Main Content Layout: Left Timeline, Right Sidebar */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Today's Timeline */}
        <section className="rounded-2xl border border-sand bg-white p-6 shadow-xs lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-serif text-xl font-medium tracking-tight text-deep-hill">
              Today&apos;s Timeline
            </h2>
            {timeline.length > 0 ? (
              <span className="text-xs text-mist-blue">
                {timeline.length} activit{timeline.length !== 1 ? "ies" : "y"} today
              </span>
            ) : null}
          </div>

          {timeline.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-sand bg-sand/10 py-12 text-center">
              <p className="text-sm font-medium text-deep-hill">
                No activity or reminders recorded yet today.
              </p>
              <p className="mt-1 text-xs text-mist-blue">
                Game sessions and reminders for today will appear here chronologically.
              </p>
            </div>
          ) : (
            <div className="relative py-1">
              {/* Vertical timeline center line on desktop, left line on mobile */}
              <div
                className="absolute bottom-3 top-3 w-0.5 bg-sand/80 left-4 md:left-1/2 md:-translate-x-1/2"
                aria-hidden="true"
              />

              <div className="space-y-2.5">
                {timeline.map((item, index) => {
                  const isEven = index % 2 === 0;
                  const isPositive =
                    item.status === "completed" || item.status === "done";
                  const isNegative = item.status === "missed";

                  const dotBg = isPositive
                    ? "bg-tea-garden text-rice-white"
                    : isNegative
                      ? "bg-gamosa-red text-rice-white"
                      : "bg-sand text-deep-hill";

                  return (
                    <div
                      key={item.id}
                      className="relative flex items-center md:justify-between"
                    >
                      {/* Center / Left circular marker dot */}
                      <div
                        className={`absolute left-4 top-1/2 z-10 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white text-[11px] font-bold shadow-2xs md:left-1/2 ${dotBg}`}
                      >
                        {isPositive ? "✓" : isNegative ? "!" : "•"}
                      </div>

                      {/* Alternating left and right cards on desktop */}
                      <div
                        className={`w-full pl-9 md:w-[calc(50%-1.5rem)] md:pl-0 ${
                          isEven ? "md:mr-auto" : "md:ml-auto"
                        }`}
                      >
                        <div
                          className={`rounded-xl border px-4 py-3 shadow-2xs transition-all hover:shadow-xs ${
                            isPositive
                              ? "border-tea-garden/30 bg-tea-garden/5"
                              : isNegative
                                ? "border-gamosa-red/30 bg-gamosa-red/5"
                                : "border-sand bg-white"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-mist-blue">
                                  {item.type === "session" ? "SESSION" : "REMINDER"}
                                </span>
                                <span className="text-mist-blue/50">•</span>
                                <span className="text-xs text-mist-blue">
                                  {item.timeLabel}
                                </span>
                              </div>

                              <h3 className="mt-0.5 truncate font-serif text-sm font-medium text-deep-hill sm:text-base">
                                {item.title}
                              </h3>
                            </div>

                            <span
                              className={`inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
                                isPositive
                                  ? "bg-tea-garden/15 text-tea-garden"
                                  : isNegative
                                    ? "bg-gamosa-red/15 text-gamosa-red"
                                    : "bg-sand/60 text-deep-hill"
                              }`}
                            >
                              {item.statusLabel}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* Right Column: Caregiver Snapshot & Quick Actions */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-sand bg-white p-6 shadow-xs">
            <h2 className="mb-2 font-serif text-lg font-medium text-deep-hill">
              Caregiver Snapshot
            </h2>

            {sessionsCompletedToday > 0 ? (
              <>
                <p className="text-sm font-medium text-tea-garden">
                  Routine activity is underway today.
                </p>
                <p className="mt-1 text-xs text-mist-blue">
                  Completed {sessionsCompletedToday} session{sessionsCompletedToday !== 1 ? "s" : ""}.
                </p>
              </>
            ) : sessionsOpenedToday > 0 ? (
              <>
                <p className="text-sm font-medium text-amber-700">
                  Sessions opened today.
                </p>
                <p className="mt-1 text-xs text-mist-blue">
                  {sessionsOpenedToday} session{sessionsOpenedToday !== 1 ? "s" : ""} opened, none completed yet.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-deep-hill">
                  No sessions completed yet today.
                </p>
                <p className="mt-1 text-xs text-mist-blue">
                  Routine activity will appear here as games are played.
                </p>
              </>
            )}

            <div className="mt-4 space-y-1.5 border-t border-sand pt-3 text-xs text-mist-blue">
              {bundle.patient.baselineAccuracy !== null ? (
                <p>
                  <span className="font-medium text-deep-hill">Personal Baseline:</span>{" "}
                  {Math.round(bundle.patient.baselineAccuracy)}% accuracy
                  {bundle.patient.baselineReactionMs !== null
                    ? ` · ${Math.round(bundle.patient.baselineReactionMs)}ms`
                    : ""}
                </p>
              ) : null}

              {bundle.periodAccuracy !== null ? (
                <p>
                  <span className="font-medium text-deep-hill">7-day Average:</span>{" "}
                  {Math.round(bundle.periodAccuracy)}% accuracy
                  {bundle.periodReactionMs !== null
                    ? ` · ${Math.round(bundle.periodReactionMs)}ms`
                    : ""}
                </p>
              ) : null}

              {bundle.note ? (
                <p className="mt-2 text-deep-hill/90 italic">
                  {bundle.note}
                </p>
              ) : null}
            </div>
          </section>

          <section className="rounded-2xl border border-sand bg-white p-6 shadow-xs">
            <h2 className="mb-3 font-serif text-lg font-medium text-deep-hill">
              Quick Actions
            </h2>

            <div className="space-y-2">
              <Link
                to="/reminders"
                className="flex items-center justify-between rounded-xl bg-sand/40 px-4 py-3 text-sm font-medium text-deep-hill transition hover:bg-sand/70"
              >
                <span>+ Add reminder</span>
                <span className="text-mist-blue">→</span>
              </Link>

              <Link
                to="/memories"
                className="flex items-center justify-between rounded-xl bg-sand/40 px-4 py-3 text-sm font-medium text-deep-hill transition hover:bg-sand/70"
              >
                <span>+ Add memory photo</span>
                <span className="text-mist-blue">→</span>
              </Link>

              <Link
                to="/progress"
                className="flex items-center justify-between rounded-xl bg-sand/40 px-4 py-3 text-sm font-medium text-deep-hill transition hover:bg-sand/70"
              >
                <span>View progress</span>
                <span className="text-mist-blue">→</span>
              </Link>

              <Link
                to="/alerts"
                className="flex items-center justify-between rounded-xl bg-sand/40 px-4 py-3 text-sm font-medium text-deep-hill transition hover:bg-sand/70"
              >
                <span>View alerts</span>
                <span className="text-mist-blue">→</span>
              </Link>
            </div>
          </section>
        </div>
      </div>

      {/* Bottom Section: Recent Activity Table */}
      <section className="mb-8 mt-8 rounded-2xl border border-sand bg-white p-6 shadow-xs">
        <h2 className="mb-4 font-serif text-xl font-medium tracking-tight text-deep-hill">
          Recent Activity
        </h2>

        {allSessions.length === 0 ? (
          <p className="text-sm text-mist-blue">
            No recent game sessions recorded.
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
                {allSessions.slice(0, 5).map((row) => (
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