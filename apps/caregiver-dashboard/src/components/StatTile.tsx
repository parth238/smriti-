export function StatTile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <article className="rounded-2xl border border-sand bg-white p-5 shadow-xs transition-shadow duration-200 hover:shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-mist-blue">{label}</p>
      <p className="mt-2 font-serif text-2xl font-medium text-deep-hill sm:text-3xl">{value}</p>
      <p className="mt-1 text-xs text-mist-blue/90">{hint}</p>
    </article>
  );
}
