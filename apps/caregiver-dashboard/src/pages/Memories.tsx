import { PageHeader } from "../components/PageHeader";
import { MEMORIES } from "../data/demo";

export function Memories() {
  const family = MEMORIES.filter((item) => item.kind === "family");
  return (
    <>
      <PageHeader
        title="Memories"
        hint="Cultural pack is shared. Family photos wait for a caregiver upload."
      />
      {family.length === 0 ? (
        <p className="mb-4 text-mist-blue">No family photos uploaded yet. Ask to add some when you can.</p>
      ) : null}
      <ul className="grid gap-3 sm:grid-cols-2">
        {MEMORIES.map((item) => (
          <li key={item.id} className="rounded-xl bg-white px-4 py-4">
            <p className="font-semibold">{item.title}</p>
            <p className="text-sm text-mist-blue">
              {item.region} · {item.kind === "cultural" ? "Cultural pack" : "Family"}
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}
