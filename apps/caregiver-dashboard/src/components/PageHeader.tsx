export function PageHeader({ title, hint }: { title: string; hint: string }) {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-semibold text-deep-hill">{title}</h1>
      <p className="mt-1 text-mist-blue">{hint}</p>
    </header>
  );
}
