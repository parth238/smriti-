import { useEffect, useState } from "react";

import { loadCaregiverAnalytics, type AnalyticsBundle } from "../api/analytics";
import { PATIENT_CHANGE_EVENT } from "../api/patients";
import { CaregiverDataError } from "../components/CaregiverDataError";
import { PageHeader } from "../components/PageHeader";

export function Sessions() {
  const [bundle, setBundle] = useState<AnalyticsBundle | null>(null);

  useEffect(() => {
    void loadCaregiverAnalytics().then(setBundle);
    const onPatientChange = () => void loadCaregiverAnalytics().then(setBundle);
    window.addEventListener(PATIENT_CHANGE_EVENT, onPatientChange);
    return () => window.removeEventListener(PATIENT_CHANGE_EVENT, onPatientChange);
  }, []);

  if (!bundle) {
    return <p className="text-mist-blue">Loading sessions…</p>;
  }

  if (bundle.source === "error") {
    return (
      <>
        <PageHeader title="Session history" hint="Recent play, without score headlines." />
        <CaregiverDataError error={bundle.error} />
      </>
    );
  }

  return (
    <>
      <PageHeader title="Session history" hint="Recent play, without score headlines." />
      <p className="mb-4 text-sm text-mist-blue">{bundle.updatedLabel}</p>
      {bundle.sessions.length === 0 ? (
        <p className="text-mist-blue">No game sessions recorded yet.</p>
      ) : (
        <table className="w-full border-separate border-spacing-y-2 text-left">
          <thead>
            <tr className="text-sm text-mist-blue">
              <th className="px-3">Game</th>
              <th className="px-3">When</th>
              <th className="px-3">Vs usual</th>
              <th className="px-3">Finished</th>
            </tr>
          </thead>
          <tbody>
            {bundle.sessions.map((row) => (
              <tr key={row.id} className="bg-white">
                <td className="rounded-l-xl px-3 py-3">{row.game}</td>
                <td className="px-3 py-3">{row.playedAt}</td>
                <td className="px-3 py-3">{row.accuracy}% this play</td>
                <td className="rounded-r-xl px-3 py-3">
                  {row.completed ? "Yes" : "Stopped early"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
