import { Link } from "react-router-dom";

import { StorySection } from "../components/story/StorySection";

const ELDERLY_URL = import.meta.env.VITE_ELDERLY_APP_URL ?? "http://localhost:5173";

const PDF_ROWS = [
  { item: "Six cognitive game domains", status: "Shipped", note: "7 activities in elderly PWA" },
  { item: "Assamese + English UI", status: "Shipped", note: "Full i18n; voice needs Bhashini keys" },
  { item: "Adaptive difficulty", status: "Shipped", note: "Rule-based staircase, visible on results" },
  { item: "Caregiver monitoring", status: "This website", note: "You are on the caregiver web desk" },
  { item: "Offline-first elderly app", status: "Partial", note: "Dexie + PWA; demo airplane mode on phone" },
  { item: "Clinical / RL / geofencing", status: "Roadmap", note: "Honest Tier 3 — not claimed in pitch" },
] as const;

export function StoryMode() {
  return (
    <div className="story-scroll">
      <header className="fixed left-0 right-0 top-0 z-20 flex items-center justify-between bg-rice-white/90 px-6 py-3 backdrop-blur-sm">
        <p className="font-semibold text-deep-hill">Smriti</p>
        <nav className="flex gap-4 text-sm">
          <a href="#problem" className="text-tea-garden hover:underline">
            Problem
          </a>
          <a href="#solution" className="text-tea-garden hover:underline">
            Solution
          </a>
          <a href="#apps" className="text-tea-garden hover:underline">
            Two apps
          </a>
          <Link to="/login" className="rounded-lg bg-gamosa-red px-3 py-1.5 font-semibold text-rice-white">
            Caregiver login
          </Link>
        </nav>
      </header>

      <StorySection id="hook" className="story-hero flex flex-col justify-center pt-24">
        <p className="text-sm uppercase tracking-[0.2em] text-tea-garden">SIH26003 · Assam · NER</p>
        <h1 className="mt-4 font-display text-4xl font-bold leading-tight md:text-5xl">
          A quiet path home for memory, voice, and family peace.
        </h1>
        <div className="gamosa-line my-8 max-w-xs story-line-draw" />
        <p className="text-lg text-mist-blue md:text-xl">
          Smriti is <strong>not one app</strong> — it is an elderly companion{" "}
          <strong>PWA on the phone</strong> plus this <strong>caregiver web desk</strong>, both
          speaking to one FastAPI backend. Built for Assamese elders and families separated by
          distance.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <a
            href="#problem"
            className="rounded-xl bg-tea-garden px-6 py-3 font-semibold text-rice-white transition hover:opacity-90"
          >
            Read our story
          </a>
          <a
            href={ELDERLY_URL}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border-2 border-tea-garden px-6 py-3 font-semibold text-tea-garden"
          >
            Open elderly app
          </a>
        </div>
      </StorySection>

      <StorySection id="problem" dark>
        <p className="text-sm uppercase tracking-widest text-marigold">The problem</p>
        <h2 className="mt-3 text-3xl font-bold">Memory loss meets language and distance.</h2>
        <p className="mt-6 text-lg text-rice-white/85">
          In Northeast India, families often live apart — a son in Guwahati, a mother in a tea-garden
          town. Mild cognitive impairment and dementia need daily structure: games, reminders, familiar
          faces, Assamese words — not English hospital forms.
        </p>
        <ul className="mt-8 space-y-4 text-rice-white/90">
          <li className="story-bullet">Global brain-training apps ignore Assamese and local culture.</li>
          <li className="story-bullet">Caregivers cannot see whether medicine was taken or a game was played.</li>
          <li className="story-bullet">Offline villages lose connectivity — the app must still work.</li>
        </ul>
      </StorySection>

      <StorySection id="solution">
        <p className="text-sm uppercase tracking-widest text-tea-garden">Our solution</p>
        <h2 className="mt-3 text-3xl font-bold">Two surfaces, one Smriti platform.</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <article className="story-card rounded-2xl border border-tea-garden/20 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase text-gamosa-red">Elderly · Phone PWA</p>
            <h3 className="mt-2 text-xl font-semibold">Large, calm, Assamese-first</h3>
            <p className="mt-3 text-mist-blue">
              Seven cognitive activities, family photo memory, reminders with local notifications,
              grandmother companion, offline Dexie storage. Port <code>5173</code> locally.
            </p>
          </article>
          <article className="story-card rounded-2xl border border-tea-garden/20 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase text-gamosa-red">Caregiver · This website</p>
            <h3 className="mt-2 text-xl font-semibold">Monitor without hovering</h3>
            <p className="mt-3 text-mist-blue">
              Trends, sessions, reminders, family photos, missed-reminder alerts — desktop web for
              sons and daughters. Port <code>5174</code> locally. You are here.
            </p>
          </article>
        </div>
      </StorySection>

      <StorySection id="apps" dark>
        <p className="text-sm uppercase tracking-widest text-marigold">How it flows</p>
        <h2 className="mt-3 text-3xl font-bold">Story-based journey</h2>
        <ol className="mt-10 space-y-8">
          {[
            "Caregiver uploads a family photo and sets an evening medicine reminder on this dashboard.",
            "Elderly opens the phone PWA — splash, Assamese home, reality orientation (date, time, home).",
            "She plays Memory Match with her photo, marks the reminder done — even offline.",
            "Phone syncs when online; this dashboard charts update; you get a calm alert if she misses one.",
          ].map((step, index) => (
            <li key={step} className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-marigold font-bold text-deep-hill">
                {index + 1}
              </span>
              <p className="pt-1.5 text-lg text-rice-white/90">{step}</p>
            </li>
          ))}
        </ol>
      </StorySection>

      <StorySection id="pdf">
        <p className="text-sm uppercase tracking-widest text-tea-garden">Brutally honest · PDF checklist</p>
        <h2 className="mt-3 text-3xl font-bold">What we claim vs what we ship</h2>
        <div className="mt-8 overflow-hidden rounded-2xl border border-mist-blue/30">
          <table className="w-full text-left text-sm">
            <thead className="bg-tea-garden/10">
              <tr>
                <th className="px-4 py-3 font-semibold">PDF requirement</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Where</th>
              </tr>
            </thead>
            <tbody>
              {PDF_ROWS.map((row) => (
                <tr key={row.item} className="border-t border-mist-blue/20">
                  <td className="px-4 py-3">{row.item}</td>
                  <td className="px-4 py-3 font-medium text-tea-garden">{row.status}</td>
                  <td className="px-4 py-3 text-mist-blue">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-6 text-mist-blue">
          We do not claim React Native, clinical diagnosis, or full Bhashini voice until keys are on
          production API. Judges can verify Assamese TTS in Settings when configured.
        </p>
      </StorySection>

      <StorySection id="cta" className="flex flex-col justify-center bg-tea-garden/10">
        <h2 className="text-3xl font-bold">Ready for judges and families</h2>
        <p className="mt-4 text-lg text-mist-blue">
          Sign in to the caregiver desk, or open the elderly companion on a phone. Same seed accounts
          as local demo — hosted URLs when Harshit/Parth finish deploy.
        </p>
        <div className="gamosa-line my-8 max-w-xs" />
        <div className="flex flex-wrap gap-4">
          <Link
            to="/login"
            className="rounded-xl bg-gamosa-red px-8 py-4 font-semibold text-rice-white"
          >
            Open caregiver dashboard
          </Link>
          <a
            href={ELDERLY_URL}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border-2 border-deep-hill px-8 py-4 font-semibold"
          >
            Try elderly PWA
          </a>
        </div>
        <p className="mt-8 text-sm text-mist-blue">
          Demo caregiver: <code>9876543210</code> / <code>SmritiJudge2026</code> · Elderly PIN:{" "}
          <code>2468</code>
        </p>
      </StorySection>

      <footer className="snap-start bg-deep-hill px-6 py-8 text-center text-sm text-rice-white/70">
        Smriti · Built by Anirudh P.S Yadav · Teammates polish ·{" "}
        <Link to="/login" className="underline">
          Dashboard
        </Link>
      </footer>
    </div>
  );
}
