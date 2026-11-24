import React, { useState } from "react";
import { Bell, Search, ChevronDown, X, LogOut, Settings, AlertTriangle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCollection } from "../../hooks/useCollection";

const PAGE_NAMES = {
  dashboard:        "Dashboard",
  patients:         "Patients",
  patientDetails:   "Patient Details",
  patientReports:   "Patient Reports",
  opPatients:       "OP Patients",
  checkupPatients:  "Checkup Patients",
  appointments:     "Appointments",
  analytics:        "Analytics",
  billing:          "Billing & Payments",
  report:           "Smart Reports",
  doctors:          "Doctors",
  ambulance:        "Ambulance",
  surgeries:        "Surgeries",
  beds:             "Bed Management",
  medicalCenter:    "Medical Center",
  callendar:        "Calendar",
  settings:         "Settings",
  notifications:    "Notifications",
  search:           "Search",
  staff:            "Staff",
  admin:            "Administration",
  profile:          "My Profile",
};

const NOTIF_BG   = { critical: "bg-red-50",   info: "bg-blue-50",  success: "bg-green-50" };
const NOTIF_ICON = { critical: "🚨",           info: "🔵",          success: "✅" };

export default function Header({ activePage = "dashboard", role = "Admin" }) {
  const { user, profile, logout } = useAuth();
  const displayRole = profile?.role || role;

  const { data: patients }      = useCollection("patients");
  const { data: notifications } = useCollection("notifications");

  const emergency = patients.filter((p) => p.status === "Critical").length;
  const unread    = notifications.length;

  const [search,      setSearch]      = useState("");
  const [showNotif,   setShowNotif]   = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const pageTitle  = PAGE_NAMES[activePage] || "Dashboard";
  const userName   = profile?.name || user?.email?.split("@")[0] || "User";
  const userInitial = userName[0]?.toUpperCase() || "U";

  const closeAll = () => { setShowNotif(false); setShowProfile(false); };

  return (
    <div className="sticky top-0 z-20">

      {/* Emergency Banner */}
      {emergency > 0 && (
        <div className="bg-red-600 text-white text-xs font-medium text-center py-1.5 flex items-center justify-center gap-2">
          <AlertTriangle size={13} className="flex-shrink-0" />
          {emergency} Critical Patient{emergency > 1 ? "s" : ""} — Immediate Attention Required
        </div>
      )}

      {/* Main Header Row */}
      <header className="h-16 px-6 flex items-center justify-between bg-white border-b border-slate-200 shadow-sm">

        {/* LEFT — Page title */}
        <div className="flex-shrink-0 w-48">
          <h1 className="text-sm font-semibold text-slate-800 leading-tight">{pageTitle}</h1>
          <p className="text-xs text-slate-400">
            {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>

        {/* CENTER — Search */}
        <div className="flex-1 max-w-md mx-4">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus-within:bg-white focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <Search size={14} className="text-slate-400 flex-shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patients, doctors, reports..."
              className="bg-transparent outline-none w-full text-sm text-slate-700 placeholder:text-slate-400"
            />
            {search && (
              <button onClick={() => setSearch("")} className="flex-shrink-0">
                <X size={13} className="text-slate-400 hover:text-slate-600" />
              </button>
            )}
          </div>
        </div>

        {/* RIGHT — Notifications + Profile */}
        <div className="flex items-center gap-1 flex-shrink-0">

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => { setShowNotif(!showNotif); setShowProfile(false); }}
              className="relative w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
            >
              <Bell size={17} />
              {unread > 0 && (
                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full" />
              )}
            </button>

            {showNotif && (
              <>
                <div className="fixed inset-0 z-40" onClick={closeAll} />
                <div className="absolute right-0 mt-2 w-80 bg-white shadow-2xl rounded-2xl border border-slate-100 overflow-hidden z-50">
                  <div className="flex justify-between items-center px-4 py-3 border-b border-slate-100 bg-slate-50">
                    <h4 className="text-sm font-semibold text-slate-700">Notifications</h4>
                    <span className="text-xs text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">{unread}</span>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                    {notifications.slice(0, 6).map((n) => (
                      <div
                        key={n.id}
                        className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition ${NOTIF_BG[n.type] || ""}`}
                      >
                        <span className="text-sm flex-shrink-0 mt-0.5">{NOTIF_ICON[n.type] || "ℹ️"}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-700">{n.title}</p>
                          <p className="text-xs text-slate-500 truncate">{n.message}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{n.time}</p>
                        </div>
                      </div>
                    ))}
                    {notifications.length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-6">No notifications</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Profile */}
          <div className="relative ml-1">
            <button
              onClick={() => { setShowProfile(!showProfile); setShowNotif(false); }}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-slate-100 transition"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {userInitial}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-semibold text-slate-700 leading-tight">{userName}</p>
                <p className="text-xs text-slate-400 leading-tight">{displayRole}</p>
              </div>
              <ChevronDown size={12} className="text-slate-400" />
            </button>

            {showProfile && (
              <>
                <div className="fixed inset-0 z-40" onClick={closeAll} />
                <div className="absolute right-0 mt-2 w-52 bg-white shadow-2xl rounded-2xl border border-slate-100 overflow-hidden z-50">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-700">{userName}</p>
                    <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                    {profile?.role && (
                      <span className="inline-block mt-1.5 px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-xs font-medium">
                        {profile.role}
                      </span>
                    )}
                  </div>
                  <div className="p-1.5">
                    <button className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 rounded-xl transition">
                      <Settings size={13} /> Settings
                    </button>
                    <button
                      onClick={logout}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-red-500 hover:bg-red-50 rounded-xl transition"
                    >
                      <LogOut size={13} /> Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

        </div>
      </header>
    </div>
  );
}
