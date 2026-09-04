import { Link } from "react-router-dom";

import { ELDERLY_URL } from "./storyData";

export function StoryCTA() {
  return (
    <footer className="border-t border-neutral-200 bg-white px-6 py-16 sm:px-12 lg:px-20">
      <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
        <div>
          <p className="text-2xl sm:text-3xl font-bold tracking-[-0.025em] text-neutral-900">Ready when you are.</p>
          <p className="mt-2 text-base font-normal leading-relaxed text-neutral-500">
            Sign in to your desk, or open the companion on her phone.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/login"
            className="rounded-lg bg-neutral-900 px-6 py-3 text-sm font-medium tracking-tight text-white transition hover:bg-neutral-800"
          >
            Sign in
          </Link>
          <a
            href={ELDERLY_URL}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-neutral-300 px-6 py-3 text-sm font-medium tracking-tight text-neutral-800 transition hover:border-neutral-900"
          >
            Elderly app
          </a>
        </div>
      </div>
      <p className="mx-auto mt-12 max-w-5xl text-center text-xs font-medium tracking-normal text-neutral-400">
        Smriti · memory companion for families
      </p>
    </footer>
  );
}
