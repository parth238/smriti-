import { Notice } from "../components/Notice";
import { PageHeader } from "../components/PageHeader";
import { REMINDERS } from "../data/demo";

export function Alerts() {
  const missed = REMINDERS.filter((row) => row.missed);
  return (
    <>
      <PageHeader title="Alerts" hint="Calm notes only. Absence of alerts is good news." />
      {missed.length === 0 ? (
        <p className="text-tea-garden">No alerts yet. This is a good thing.</p>
      ) : (
        <div className="space-y-3">
          {missed.map((row) => (
            <Notice key={row.id}>{`${row.title} was not marked done.`}</Notice>
          ))}
        </div>
      )}
    </>
  );
}
