import { useCallback, useEffect, useState } from "react";

import {
  ensureSelectedPatient,
  loadLinkedPatients,
  PATIENT_CHANGE_EVENT,
  selectPatient,
  type LinkedPatient,
} from "../api/patients";

export function PatientSwitcher() {
  const [patients, setPatients] = useState<LinkedPatient[]>([]);
  const [current, setCurrent] = useState<LinkedPatient | null>(null);

  const refresh = useCallback(async () => {
    const rows = await loadLinkedPatients();
    setPatients(rows);
    const active = await ensureSelectedPatient();
    setCurrent(active);
  }, []);

  useEffect(() => {
    void refresh();
    const onChange = () => void refresh();
    window.addEventListener(PATIENT_CHANGE_EVENT, onChange);
    return () => window.removeEventListener(PATIENT_CHANGE_EVENT, onChange);
  }, [refresh]);

  if (patients.length === 0) {
    return (
      <p className="mt-3 text-xs text-mist-blue">
        No linked family member yet. Create one via API or run the judge seed.
      </p>
    );
  }

  if (patients.length === 1) {
    return (
      <p className="mt-3 text-sm text-rice-white/90">
        Caring for <span className="font-semibold">{patients[0].full_name}</span>
      </p>
    );
  }

  return (
    <label className="mt-3 block text-xs text-mist-blue">
      Family member
      <select
        className="mt-1 w-full rounded-lg border border-white/20 bg-deep-hill px-2 py-2 text-sm text-rice-white"
        value={current?.user_id ?? patients[0].user_id}
        onChange={(event) => selectPatient(event.target.value)}
      >
        {patients.map((row) => (
          <option key={row.user_id} value={row.user_id}>
            {row.full_name}
            {row.is_primary ? " (primary)" : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
