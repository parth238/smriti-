import { Link } from "react-router-dom";

import { isCaregiverSignedIn } from "../../auth/session";
import type { NavSection } from "./storyData";
import { NAV_SECTIONS } from "./storyData";

type StoryNavProps = {
  activeSection: NavSection | null;
};

export function StoryNav({ activeSection }: StoryNavProps) {
  const signedIn = isCaregiverSignedIn();

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-neutral-100 bg-white">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4 sm:px-10">
        <Link to="/" className="font-semibold text-neutral-900">
          Smriti
        </Link>
        <nav className="hidden items-center gap-8 text-sm md:flex">
          {NAV_SECTIONS.map((item) => (
            <a
              key={item.id}
              href={item.href}
              className={
                activeSection === item.id
                  ? "font-semibold text-neutral-900"
                  : "text-neutral-500 transition hover:text-neutral-900"
              }
            >
              {item.label}
            </a>
          ))}
          <Link
            to={signedIn ? "/dashboard" : "/login"}
            className="rounded-lg bg-neutral-900 px-4 py-2 font-semibold text-white transition hover:bg-neutral-800"
          >
            {signedIn ? "Dashboard" : "Sign in"}
          </Link>
        </nav>
        <Link
          to={signedIn ? "/dashboard" : "/login"}
          className="rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-semibold text-white md:hidden"
        >
          {signedIn ? "Desk" : "Sign in"}
        </Link>
      </div>
    </header>
  );
}
