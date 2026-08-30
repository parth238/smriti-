export function StatTile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <article className="rounded-xl bg-white px-4 py-4">
      <p className="text-sm text-mist-blue">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-deep-hill">{value}</p>
      <p className="mt-1 text-sm text-mist-blue">{hint}</p>
    </article>
  );
}
