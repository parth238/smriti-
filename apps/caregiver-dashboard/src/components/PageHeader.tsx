export function PageHeader({ title, hint }: { title: string; hint: string }) {
  return (
    <header className="mb-6">
      <h1 className="font-serif text-3xl font-normal tracking-tight text-deep-hill">{title}</h1>
      <p className="mt-1.5 text-sm text-mist-blue">{hint}</p>
    </header>
  );
}
