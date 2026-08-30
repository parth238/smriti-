import { Notice } from "../components/Notice";
import { PageHeader } from "../components/PageHeader";
import { REMINDERS } from "../data/demo";

export function Reminders() {
  return (
    <>
      <PageHeader
        title="Reminders"
        hint="Create and edit happens here. The elderly app only marks done."
      />
      <div className="space-y-3">
        {REMINDERS.map((row) =>
          row.missed ? (
            <Notice key={row.id}>{`${row.title} at ${row.time} was not marked done.`}</Notice>
          ) : (
            <article key={row.id} className="rounded-xl bg-white px-4 py-4">
              <p className="font-semibold">{row.title}</p>
              <p className="text-mist-blue">{row.time}</p>
            </article>
          ),
        )}
      </div>
    </>
  );
}
