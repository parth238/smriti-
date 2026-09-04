export function PageHeader({
  title,
  hint,
  action,
}: {
  title: string;
  hint: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
      <div>
        <h1 className="font-serif text-3xl font-normal tracking-tight text-deep-hill">
          {title}
        </h1>
        <p className="mt-1.5 text-sm text-mist-blue">{hint}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
