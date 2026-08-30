import { useNavigate } from "react-router-dom";

import { signOutCaregiver } from "../auth/session";
import { PageHeader } from "../components/PageHeader";
import { PATIENT } from "../data/demo";

export function Settings() {
  const navigate = useNavigate();
  return (
    <>
      <PageHeader title="Settings" hint="Linked person and sign out." />
      <article className="rounded-xl bg-white px-4 py-4">
        <p className="text-sm text-mist-blue">Linked family member</p>
        <p className="mt-1 font-semibold">
          {PATIENT.label} · {PATIENT.region}
        </p>
      </article>
      <button
        type="button"
        className="mt-6 rounded-lg border border-mist-blue px-4 py-2"
        onClick={() => {
          signOutCaregiver();
          navigate("/login", { replace: true });
        }}
      >
        Sign out
      </button>
    </>
  );
}
