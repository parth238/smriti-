import { useCallback, useEffect, useState } from "react";

import {
  loadLinkedPatients,
  PATIENT_CHANGE_EVENT,
  selectPatient,
  type LinkedPatientsResult,
} from "../api/patients";
import { CaregiverSignInLink } from "./CaregiverDataError";

export function PatientSwitcher() {
  const [result, setResult] = useState<LinkedPatientsResult | null>(null);

  const refresh = useCallback(async () => {
    setResult(await loadLinkedPatients());
  }, []);

  useEffect(() => {
    void refresh();
    const onChange = () => void refresh();
    window.addEventListener(PATIENT_CHANGE_EVENT, onChange);
    return () => window.removeEventListener(PATIENT_CHANGE_EVENT, onChange);
  }, [refresh]);

  if (!result) {
    return <p className="mt-3 text-xs text-mist-blue">Loading family member…</p>;
  }

  if (!result.ok) {
    return (
      <p className="mt-3 text-xs text-mist-blue">
        {result.error.message}{" "}
        {result.error.kind === "authentication" ? (
          <CaregiverSignInLink className="text-rice-white underline" />
        ) : null}
      </p>
    );
  }

  if (result.rows.length === 0) {
    return (
      <p className="mt-3 text-xs text-mist-blue">
        No linked family member yet. Create one via API or run the judge seed.
      </p>
    );
  }

  if (result.rows.length === 1) {
    return (
      <p className="mt-3 text-sm text-rice-white/90">
        Caring for <span className="font-semibold">{result.rows[0].full_name}</span>
      </p>
    );
  }

  return (
    <label className="mt-3 block text-xs text-mist-blue">
      Family member
      <select
        className="mt-1 w-full rounded-lg border border-white/20 bg-deep-hill px-2 py-2 text-sm text-rice-white"
        value={result.selected?.user_id ?? result.rows[0].user_id}
        onChange={(event) => selectPatient(event.target.value)}
      >
        {result.rows.map((row) => (
          <option key={row.user_id} value={row.user_id}>
            {row.full_name}
            {row.is_primary ? " (primary)" : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
