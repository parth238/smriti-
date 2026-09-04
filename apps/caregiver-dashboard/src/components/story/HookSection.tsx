import { DementiaChart } from "./DementiaChart";
import { Reveal } from "./Reveal";
import { DEMENTIA_STATS, HOOK_COPY } from "./storyData";

export function HookSection() {
  return (
    <section id="hook" className="border-t border-neutral-200 bg-neutral-50 px-6 py-24 sm:px-12 lg:px-20">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">Why Smriti</p>
            <h2 className="mt-4 text-3xl font-bold tracking-[-0.025em] leading-[1.2] text-neutral-900 sm:text-4xl">
              {HOOK_COPY.headline}
            </h2>
            <p className="mt-5 text-base sm:text-lg font-normal leading-[1.65] text-neutral-600">{HOOK_COPY.body}</p>
          </div>
        </Reveal>

        <Reveal className="mt-16" delayMs={80}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {DEMENTIA_STATS.map((stat, index) => (
              <Reveal key={stat.label} delayMs={index * 60}>
                <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                  <p className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900">{stat.value}</p>
                  <p className="mt-2 text-sm font-semibold tracking-tight text-neutral-800">{stat.label}</p>
                  <p className="mt-1 text-xs font-normal leading-normal text-neutral-500">{stat.detail}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Reveal>

        <Reveal className="mt-10" delayMs={120}>
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
                  India · dementia prevalence
                </p>
                <p className="mt-1.5 text-lg font-semibold tracking-tight text-neutral-900">
                  A rising curve families cannot ignore
                </p>
              </div>
              <p className="text-xs font-medium text-neutral-500">Millions of people · 2010–2036</p>
            </div>
            <div className="mt-6">
              <DementiaChart />
            </div>
            <p className="mt-4 text-xs font-normal leading-relaxed text-neutral-400">
              Sources: Dementia India Report, ARDSI / Lancet regional estimates. Figures are
              rounded projections used for awareness — not clinical benchmarks.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
