import { NavLink } from "react-router-dom";

import { PatientSwitcher } from "../components/PatientSwitcher";
import { NAV } from "./nav";

export function Sidebar() {
  return (
    <aside className="flex min-h-screen w-60 shrink-0 flex-col bg-deep-hill px-4 py-6 text-rice-white">
      <p className="text-xl font-semibold tracking-tight">Smriti</p>
      <p className="mt-1 text-sm text-mist-blue">Caregiver</p>
      <PatientSwitcher />
      <div className="gamosa-line my-5 opacity-80" />
      <nav className="flex flex-col gap-1">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/dashboard"}
            className={({ isActive }) =>
              `rounded-lg px-3 py-2.5 text-[15px] ${
                isActive ? "bg-tea-garden text-rice-white" : "text-rice-white/80 hover:bg-white/10"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
