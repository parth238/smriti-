import { Reveal } from "./Reveal";
import { SOLUTION_POINTS } from "./storyData";

export function SolutionSection() {
  return (
    <section id="solution" className="border-t border-neutral-200 bg-neutral-900 px-6 py-24 text-white sm:px-12 lg:px-20">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">The solution</p>
          <h2 className="mt-3 text-3xl font-bold tracking-[-0.025em] leading-tight text-white sm:text-4xl">
            What Smriti gives both of you
          </h2>
          <p className="mt-4 max-w-2xl text-base sm:text-lg font-normal leading-relaxed text-neutral-300">
            Not surveillance. Not guilt. Just a shared, calm picture of today.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {SOLUTION_POINTS.map((point, index) => (
            <Reveal key={point.title} delayMs={index * 80}>
              <div className="border-t border-neutral-700 pt-6">
                <p className="text-xs font-semibold tracking-widest text-neutral-500 font-mono">0{index + 1}</p>
                <h3 className="mt-3 text-xl font-semibold tracking-tight text-white">{point.title}</h3>
                <p className="mt-3 text-sm sm:text-base font-normal leading-relaxed text-neutral-400">{point.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
