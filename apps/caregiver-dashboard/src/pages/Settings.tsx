import { useNavigate } from "react-router-dom";

import { signOutCaregiver } from "../auth/session";
import { PageHeader } from "../components/PageHeader";
import { PATIENT } from "../data/demo";

export function Settings() {
  const navigate = useNavigate();
  return (
    <>
      <PageHeader title="Settings" hint="Linked person and sign out." />
      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-sand bg-white p-6 shadow-xs">
          <h2 className="mb-4 font-serif text-xl font-medium tracking-tight text-deep-hill">Linked Family Member</h2>
          <div className="rounded-xl bg-sand/30 p-4">
            <p className="font-medium text-deep-hill">{PATIENT.label}</p>
            <p className="mt-1 text-xs text-mist-blue">Region: {PATIENT.region}</p>
            <p className="text-xs text-mist-blue">Language: {PATIENT.language}</p>
          </div>
          <p className="mt-4 text-xs text-mist-blue leading-relaxed">
            Smriti automatically adjusts game content and reminiscence cues based on the linked family member's region and language.
          </p>
        </section>

        <section className="rounded-2xl border border-sand bg-white p-6 shadow-xs">
          <h2 className="mb-4 font-serif text-xl font-medium tracking-tight text-deep-hill">Account & Session</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-sand pb-4">
              <div>
                <p className="text-sm font-medium text-deep-hill">Sign Out</p>
                <p className="mt-0.5 text-xs text-mist-blue">Securely sign out of your caregiver session.</p>
              </div>
              <button
                type="button"
                className="rounded-xl border border-gamosa-red px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gamosa-red transition-colors hover:bg-gamosa-red/5"
                onClick={() => {
                  signOutCaregiver();
                  navigate("/login", { replace: true });
                }}
              >
                Sign out
              </button>
            </div>
            <div>
              <p className="text-sm font-medium text-deep-hill">About Smriti</p>
              <p className="mt-0.5 text-xs text-mist-blue">Caregiver Dashboard v1.0.0 · Modern Classic Edition</p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
