import { Reveal } from "./Reveal";
import { PROBLEM_BEATS } from "./storyData";

export function ProblemFlow() {
  return (
    <section id="problem" className="bg-white">
      <div className="border-t border-neutral-200 px-6 py-16 sm:px-12 lg:px-20">
        <Reveal>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-neutral-400">The problem</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-bold text-neutral-900 sm:text-4xl">
            This is what families live with every day.
          </h2>
        </Reveal>
      </div>

      {PROBLEM_BEATS.map((beat, index) => {
        const imageFirst = index % 2 === 0;
        return (
          <Reveal key={beat.id}>
            <article
              className={`grid min-h-[70vh] border-t border-neutral-200 lg:min-h-[80vh] lg:grid-cols-2 ${
                imageFirst ? "" : "lg:[&>div:first-child]:order-2"
              }`}
            >
              <div className="relative min-h-[45vh] lg:min-h-full">
                <img
                  src={beat.image}
                  alt=""
                  loading="lazy"
                  style={{ objectPosition: beat.objectPosition }}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-col justify-center px-8 py-12 sm:px-12 lg:px-16">
                <p className="text-sm text-neutral-400">
                  {String(index + 1).padStart(2, "0")} / {String(PROBLEM_BEATS.length).padStart(2, "0")}
                </p>
                <h3 className="mt-3 text-2xl font-bold text-neutral-900 sm:text-3xl">{beat.title}</h3>
                <p className="mt-5 max-w-lg text-lg leading-relaxed text-neutral-600">{beat.copy}</p>
              </div>
            </article>
          </Reveal>
        );
      })}
    </section>
  );
}
