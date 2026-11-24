import { useState } from "react";
import { useCollection } from "../hooks/useCollection";
import { motion, AnimatePresence } from "framer-motion";
import CountUp from "react-countup";
import { FiSearch, FiX, FiMoreVertical, FiLoader } from "react-icons/fi";

export default function Patients() {
  const { data: patients, loading } = useCollection("patients");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = patients
    .filter((p) => filter === "All" || p.status === filter)
    .filter((p) => p.name?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <Loader />;

  return (
    <div className="p-6 space-y-5">

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <KpiCard title="Total Patients" value={patients.length} color="blue" />
        <KpiCard title="Critical"       value={patients.filter((p) => p.status === "Critical").length} color="red" />
        <KpiCard title="Stable"         value={patients.filter((p) => p.status === "Stable").length}   color="green" />
      </div>

      {/* Toolbar — search + filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-all flex-1 min-w-[200px] max-w-xs">
          <FiSearch className="text-slate-400 flex-shrink-0" size={14} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none w-full text-sm text-slate-700 placeholder:text-slate-400"
            placeholder="Search patients..."
          />
          {search && (
            <button onClick={() => setSearch("")}>
              <FiX size={13} className="text-slate-400 hover:text-slate-600" />
            </button>
          )}
        </div>

        {/* Filter pills */}
        <div className="flex gap-2">
          {["All", "Critical", "Stable", "Checkup"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition
                ${filter === f
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Patient List */}
      <div className="space-y-3">
        {filtered.map((p) => (
          <motion.div
            key={p.id}
            whileHover={{ y: -2 }}
            className="group bg-white border border-slate-100 rounded-2xl px-5 py-4 shadow-sm hover:shadow-md transition flex justify-between items-center"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600 text-sm flex-shrink-0">
                {p.name?.[0] || "P"}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{p.name}</p>
                <p className="text-xs text-slate-400">{p.doctor}</p>
              </div>
            </div>
            <div className="flex items-center gap-5">
              <span className="text-sm text-slate-400 hidden sm:block">{p.room}</span>
              <StatusBadge status={p.status} />
              <button
                onClick={() => setSelectedPatient(p)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition"
              >
                <FiMoreVertical size={14} />
              </button>
            </div>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400 text-sm">
            No patients match your filters.
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedPatient && (
          <Drawer patient={selectedPatient} onClose={() => setSelectedPatient(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function Loader() {
  return (
    <div className="flex items-center justify-center h-64 text-slate-400 gap-2">
      <FiLoader className="animate-spin" /> Loading...
    </div>
  );
}

function KpiCard({ title, value, color }) {
  const colors = {
    blue:  "bg-blue-50 text-blue-600",
    red:   "bg-red-50 text-red-600",
    green: "bg-emerald-50 text-emerald-600",
  };
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center gap-4"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${colors[color]}`}>
        {value}
      </div>
      <div>
        <p className="text-xs text-slate-500">{title}</p>
        <h2 className="text-2xl font-bold text-slate-800 leading-tight">
          <CountUp end={value} duration={1.2} />
        </h2>
      </div>
    </motion.div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    Critical: "bg-red-100 text-red-600",
    Stable:   "bg-green-100 text-green-600",
    Checkup:  "bg-amber-100 text-amber-600",
  };
  return (
    <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${styles[status] || "bg-slate-100 text-slate-600"}`}>
      {status}
    </span>
  );
}

function Drawer({ patient, onClose }) {
  return (
    <motion.div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-end z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ x: 400 }}
        animate={{ x: 0 }}
        exit={{ x: 400 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="w-full max-w-sm bg-white h-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800">Patient Details</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <FiX size={14} />
          </button>
        </div>

        <div className="px-6 py-5">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600 text-lg">
              {patient.name?.[0] || "P"}
            </div>
            <div>
              <p className="font-semibold text-slate-800">{patient.name}</p>
              <StatusBadge status={patient.status} />
            </div>
          </div>

          <div className="space-y-3">
            <Row label="Doctor"      value={patient.doctor} />
            <Row label="Room"        value={patient.room} />
            <Row label="Status"      value={patient.status} />
            {patient.age        && <Row label="Age"        value={`${patient.age} yrs`} />}
            {patient.phone      && <Row label="Phone"      value={patient.phone} />}
            {patient.bloodGroup && <Row label="Blood Group"value={patient.bloodGroup} />}
          </div>
        </div>

        <div className="px-6 space-y-3">
          <button className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition">
            View Full Profile
          </button>
          <button className="w-full border border-slate-200 text-slate-700 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 transition">
            Edit Patient
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between py-2 border-b border-slate-50">
      <span className="text-xs text-slate-400 font-medium">{label}</span>
      <span className="text-xs font-semibold text-slate-700">{value}</span>
    </div>
  );
}
