import { Notice } from "../components/Notice";
import { PageHeader } from "../components/PageHeader";
import { StatTile } from "../components/StatTile";
import { PATIENT, REMINDERS, SESSIONS } from "../data/demo";

export function Overview() {
  const done = SESSIONS.filter((row) => row.completed).length;
  const missed = REMINDERS.filter((row) => row.missed).length;
  return (
    <>
      <PageHeader
        title={`${PATIENT.label} this week`}
        hint={`${PATIENT.region} · ${PATIENT.language}. Comparisons are against their own usual week, never a population range.`}
      />
      {missed ? (
        <div className="mb-5">
          <Notice>
            Evening medicine at 8 PM was not marked done. This is a reminder note, not a medical
            warning.
          </Notice>
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Sessions" value={`${SESSIONS.length}`} hint="Games opened this week" />
        <StatTile label="Finished" value={`${done}`} hint="They stayed until the warm ending" />
        <StatTile
          label="Usual accuracy"
          value={`${PATIENT.baselineAccuracy}%`}
          hint="Personal baseline only"
        />
      </div>
    </>
  );
}
