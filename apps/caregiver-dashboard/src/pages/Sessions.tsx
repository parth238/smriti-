import { PageHeader } from "../components/PageHeader";
import { SESSIONS } from "../data/demo";

export function Sessions() {
  return (
    <>
      <PageHeader title="Session history" hint="Recent play, without score headlines." />
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
          {SESSIONS.map((row) => (
            <tr key={row.id} className="bg-white">
              <td className="rounded-l-xl px-3 py-3">{row.game}</td>
              <td className="px-3 py-3">{row.playedAt}</td>
              <td className="px-3 py-3">{row.accuracy}% this play</td>
              <td className="rounded-r-xl px-3 py-3">{row.completed ? "Yes" : "Stopped early"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
