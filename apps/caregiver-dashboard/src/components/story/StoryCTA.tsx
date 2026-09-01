import { Link } from "react-router-dom";

import { isCaregiverSignedIn } from "../../auth/session";
import { ELDERLY_URL } from "./storyData";

export function StoryCTA() {
  const signedIn = isCaregiverSignedIn();

  return (
    <footer className="border-t border-neutral-200 bg-white px-6 py-16 sm:px-12 lg:px-20">
      <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
        <div>
          <p className="text-2xl font-bold text-neutral-900">Ready when you are.</p>
          <p className="mt-2 text-neutral-500">Sign in to your desk, or open the companion on her phone.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to={signedIn ? "/dashboard" : "/login"}
            className="rounded-lg bg-neutral-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
          >
            {signedIn ? "Open dashboard" : "Sign in"}
          </Link>
          <a
            href={ELDERLY_URL}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-800 transition hover:border-neutral-900"
          >
            Elderly app
          </a>
        </div>
      </div>
      <p className="mx-auto mt-12 max-w-5xl text-center text-sm text-neutral-400">
        Smriti · memory companion for families
      </p>
    </footer>
  );
}
