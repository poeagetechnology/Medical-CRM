import React from "react";
import { useCollection } from "../hooks/useCollection";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import { FiClock, FiUserCheck, FiPlay, FiLoader } from "react-icons/fi";

export default function CheckupPatients() {
  const { data: checkups, loading, update } = useCollection('checkupPatients');

  const advance = async (patient) => {
    const next = { Waiting: "In Progress", "In Progress": "Completed" };
    if (next[patient.status]) {
      await update(patient.id, { status: next[patient.status] });
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="p-6 space-y-5">

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard title="Total" value={checkups.length} icon={<FiUserCheck />} color="blue" />
        <KpiCard title="Waiting" value={checkups.filter(p => p.status === "Waiting").length} icon={<FiClock />} color="yellow" />
        <KpiCard title="In Progress" value={checkups.filter(p => p.status === "In Progress").length} icon={<FiPlay />} color="green" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatusColumn title="Waiting" data={checkups.filter(p => p.status === "Waiting")} onAdvance={advance} />
        <StatusColumn title="In Progress" data={checkups.filter(p => p.status === "In Progress")} onAdvance={advance} />
        <StatusColumn title="Completed" data={checkups.filter(p => p.status === "Completed")} onAdvance={advance} />
      </div>

    </div>
  );
}

function Loader() {
  return (
    <div className="flex items-center justify-center h-64 text-gray-400 gap-2">
      <FiLoader className="animate-spin" /> Loading...
    </div>
  );
}

function KpiCard({ title, value, icon, color }) {
  const colors = {
    blue: "bg-blue-100 text-blue-600",
    yellow: "bg-yellow-100 text-yellow-600",
    green: "bg-green-100 text-green-600",
  };
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex justify-between items-center"
    >
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <h2 className="text-3xl font-semibold text-gray-800 mt-2">
          <CountUp end={value} duration={1.2} />
        </h2>
      </div>
      <div className={`p-4 rounded-2xl ${colors[color]}`}>{icon}</div>
    </motion.div>
  );
}

function StatusColumn({ title, data, onAdvance }) {
  return (
    <div className="bg-white/80 backdrop-blur rounded-3xl border border-gray-100 shadow-sm p-4">
      <h3 className="font-semibold text-gray-700 mb-4">{title}</h3>
      <div className="space-y-4">
        {data.map((p) => <PatientCard key={p.id} patient={p} onAdvance={() => onAdvance(p)} />)}
        {data.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">No patients</p>
        )}
      </div>
    </div>
  );
}

function PatientCard({ patient, onAdvance }) {
  const statusStyles = {
    Waiting: "bg-yellow-100 text-yellow-600",
    "In Progress": "bg-blue-100 text-blue-600",
    Completed: "bg-green-100 text-green-600",
  };
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-3"
    >
      <div className="flex justify-between items-center">
        <h4 className="font-medium text-gray-800">{patient.name}</h4>
        <span className={`px-2 py-1 rounded-full text-xs ${statusStyles[patient.status]}`}>
          {patient.status}
        </span>
      </div>
      <p className="text-sm text-gray-500">{patient.doctor}</p>
      <p className="text-sm font-medium text-gray-700">{patient.time}</p>
      <button
        onClick={onAdvance}
        disabled={patient.status === "Completed"}
        className="w-full text-sm bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {patient.status === "Waiting" && "Start Checkup"}
        {patient.status === "In Progress" && "Complete"}
        {patient.status === "Completed" && "Done"}
      </button>
    </motion.div>
  );
}
