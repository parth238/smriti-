import { Link } from "react-router-dom";

import { isCaregiverSignedIn } from "../../auth/session";
import { ELDERLY_URL, HERO_IMAGE } from "./storyData";

export function StoryHero() {
  const signedIn = isCaregiverSignedIn();

  return (
    <section id="hero" className="grid min-h-screen bg-white pt-[65px] lg:grid-cols-[1.15fr_0.85fr]">
      <div className="relative min-h-[55vh] lg:min-h-screen">
        <img
          src={HERO_IMAGE}
          alt="Elderly Assamese woman at home"
          className="absolute inset-0 h-full w-full object-cover object-[center_18%]"
        />
      </div>

      <div className="flex flex-col justify-center px-8 py-14 sm:px-12 lg:px-16 lg:py-20">
        <p className="text-sm font-medium tracking-wide text-neutral-500">Smriti</p>
        <h1 className="mt-3 text-4xl font-bold leading-[1.12] text-neutral-900 sm:text-5xl">
          A quiet path home for memory.
        </h1>
        <p className="mt-6 max-w-md text-lg leading-relaxed text-neutral-600">
          For elders who need daily structure, familiar voices, and gentle games — and for families
          who need to know she is okay today, even from far away.
        </p>
        <p className="mt-4 max-w-md text-base leading-relaxed text-neutral-500">
          One companion on her phone. One calm view on yours. Both stay in sync.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <a
            href="#hook"
            className="rounded-lg bg-neutral-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
          >
            Learn more
          </a>
          <Link
            to={signedIn ? "/dashboard" : "/login"}
            className="rounded-lg border border-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-800 transition hover:border-neutral-900"
          >
            {signedIn ? "Open dashboard" : "Sign in"}
          </Link>
        </div>

        <a
          href={ELDERLY_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-8 text-sm text-neutral-500 underline-offset-2 hover:text-neutral-800 hover:underline"
        >
          Open elderly companion on phone →
        </a>
      </div>
    </section>
  );
}
