export function ProgressDots({ total, filled }: { total: number; filled: number }) {
  return (
    <div className="mb-5 flex gap-2" aria-hidden="true">
      {Array.from({ length: total }, (_, index) => (
        <span key={index} className={index < filled ? "dot dot-on" : "dot"} />
      ))}
    </div>
  );
}
