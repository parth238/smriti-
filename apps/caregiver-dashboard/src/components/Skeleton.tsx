export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-sand/60 ${className}`}
      aria-hidden="true"
    />
  );
}
