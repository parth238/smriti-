import { NavLink } from "react-router-dom";

import { PatientSwitcher } from "../components/PatientSwitcher";
import { NAV } from "./nav";

type SidebarProps = {
  open?: boolean;
  onClose?: () => void;
};

export function Sidebar({ open = false, onClose }: SidebarProps) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex w-full max-w-[15rem] shrink-0 flex-col overflow-y-auto bg-deep-hill px-4 py-6 text-rice-white transition-transform md:static md:min-h-screen md:w-60 md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
    >
      <div className="flex items-center justify-between md:block">
        <div>
          <p className="font-serif text-2xl font-normal tracking-wide text-rice-white">
            Smriti
          </p>
          <p className="mt-0.5 text-xs uppercase tracking-widest text-marigold/90">
            Caregiver Portal
          </p>
        </div>
      </div>

      <div className="mt-5">
        <PatientSwitcher />
      </div>

      <div className="gamosa-line my-5 opacity-70" />

      <nav className="mt-0 flex flex-1 flex-col gap-1.5">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/dashboard"}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center rounded-xl px-3.5 py-2.5 text-[14px] font-medium transition-all duration-150 ${isActive
                ? "bg-tea-garden text-rice-white shadow-xs font-semibold"
                : "text-rice-white/75 hover:bg-white/10 hover:text-rice-white"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto border-t border-white/10 pt-4">
        <NavLink
          to="/settings"
          onClick={onClose}
          className={({ isActive }) =>
            `block rounded-xl px-3.5 py-2.5 text-[14px] font-medium transition-all duration-150 ${isActive
              ? "bg-tea-garden text-rice-white shadow-xs font-semibold"
              : "text-rice-white/75 hover:bg-white/10 hover:text-rice-white"
            }`
          }
        >
          Settings
        </NavLink>
      </div>
    </aside>
  );
}