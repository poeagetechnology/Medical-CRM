import React from "react";
import {
  LayoutDashboard, Users, Calendar, Activity, Truck, Scissors,
  Bed, CreditCard, BarChart3, Stethoscope, FileText, Pill,
  Bell, Settings, UserCircle, ClipboardList, Search, LogOut,
  ShieldCheck, ChevronLeft, ChevronRight, Heart,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const navItems = [
  { section: "Main" },
  { icon: LayoutDashboard, label: "Dashboard",        id: "dashboard" },
  { icon: Calendar,        label: "Calendar",         id: "callendar" },
  { icon: Bell,            label: "Notifications",    id: "notifications" },
  { icon: Search,          label: "Search",           id: "search" },

  { section: "Patients" },
  { icon: Users,           label: "Patients",         id: "patients" },
  { icon: FileText,        label: "Patient Reports",  id: "patientReports" },
  { icon: UserCircle,      label: "Patient Details",  id: "patientDetails" },
  { icon: Activity,        label: "OP Patients",      id: "opPatients" },
  { icon: Stethoscope,     label: "Checkup Patients", id: "checkupPatients" },

  { section: "Operations" },
  { icon: Calendar,        label: "Appointments",     id: "appointments" },
  { icon: Stethoscope,     label: "Doctors",          id: "doctors" },
  { icon: ClipboardList,   label: "Smart Reports",    id: "report" },
  { icon: Truck,           label: "Ambulance",        id: "ambulance" },
  { icon: Scissors,        label: "Surgeries",        id: "surgeries" },
  { icon: Bed,             label: "Beds",             id: "beds" },
  { icon: Pill,            label: "Medical Center",   id: "medicalCenter" },

  { section: "Finance" },
  { icon: CreditCard,      label: "Billing",          id: "billing" },
  { icon: BarChart3,       label: "Analytics",        id: "analytics" },

  { section: "System" },
  { icon: Users,           label: "Staff",            id: "staff" },
  { icon: ShieldCheck,     label: "Admin",            id: "admin" },
  { icon: Settings,        label: "Settings",         id: "settings" },
  { icon: UserCircle,      label: "Profile",          id: "profile" },
];

export function Sidebar({ activePage, setActivePage, collapsed = false, setCollapsed }) {
  const { user, profile, logout } = useAuth();

  const displayName = profile?.name || user?.displayName || user?.email?.split("@")[0] || "User";
  const displayRole = profile?.role || "Staff";
  const initials = displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <aside
      className={`h-screen fixed z-20 flex flex-col transition-all duration-300 bg-[#0D1B2A] border-r border-slate-800
      ${collapsed ? "w-[68px]" : "w-60"}`}
    >
      {/* Brand header */}
      {collapsed ? (
        <div className="h-16 border-b border-slate-800 flex-shrink-0 flex flex-col items-center justify-center gap-1">
          <button
            onClick={() => setCollapsed(false)}
            title="Expand sidebar"
            className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center hover:bg-blue-500 transition"
          >
            <Heart size={15} className="text-white" />
          </button>
        </div>
      ) : (
        <div className="h-16 border-b border-slate-800 flex-shrink-0 flex items-center px-4 gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
            <Heart size={15} className="text-white" />
          </div>
          <span className="text-sm font-bold text-white tracking-wide">MedCRM</span>
          <button
            onClick={() => setCollapsed(true)}
            className="ml-auto w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-300 hover:bg-slate-800 transition"
          >
            <ChevronLeft size={14} />
          </button>
        </div>
      )}

      {/* User profile card */}
      {!collapsed && (
        <div className="px-3 py-3 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-slate-800/50">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate leading-tight">{displayName}</p>
              <p className="text-xs text-slate-500 truncate leading-tight">{displayRole}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 space-y-0.5">
        {navItems.map((item, index) => {
          if (item.section) {
            return !collapsed ? (
              <p key={index} className="px-4 pt-5 pb-1.5 text-xs font-semibold text-slate-600 uppercase tracking-widest first:pt-2">
                {item.section}
              </p>
            ) : (
              index > 0 ? <div key={index} className="my-2 mx-3 border-t border-slate-800/80" /> : null
            );
          }

          const Icon = item.icon;
          const isActive = activePage === item.id;

          return (
            <div key={item.id} className="px-2">
              <button
                onClick={() => setActivePage(item.id)}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 w-full rounded-xl transition-all text-left
                  ${collapsed ? "h-10 justify-center" : "px-3 py-2.5"}
                  ${isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-900/40"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  }`}
              >
                <Icon size={16} className="flex-shrink-0" />
                {!collapsed && (
                  <span className="text-sm font-medium truncate">{item.label}</span>
                )}
              </button>
            </div>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-2 border-t border-slate-800 flex-shrink-0">
        <button
          onClick={logout}
          title={collapsed ? "Sign Out" : undefined}
          className={`flex items-center gap-3 w-full rounded-xl text-slate-500 hover:bg-red-950/60 hover:text-red-400 transition
          ${collapsed ? "h-10 justify-center" : "px-3 py-2.5"}`}
        >
          <LogOut size={16} className="flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
