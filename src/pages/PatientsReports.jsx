import React from "react";
import { useCollection } from "../hooks/useCollection";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import { FiFileText, FiCheckCircle, FiClock, FiDownload, FiEye, FiLoader } from "react-icons/fi";

export default function PatientsReports() {
  const { data: reports, loading } = useCollection('patientReports');

  if (loading) return <Loader />;

  return (
    <div className="p-6 space-y-5">

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard title="Total Reports" value={reports.length} icon={<FiFileText />} gradient="from-blue-500 to-indigo-500" />
        <KpiCard title="Completed" value={reports.filter(r => r.status === "Completed").length} icon={<FiCheckCircle />} gradient="from-green-500 to-emerald-500" />
        <KpiCard title="Pending" value={reports.filter(r => r.status === "Pending").length} icon={<FiClock />} gradient="from-red-500 to-orange-500" />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white/80 backdrop-blur rounded-3xl shadow-md border border-gray-100 overflow-hidden"
      >
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h3 className="font-semibold text-gray-700">Reports List</h3>
          <span className="text-sm text-gray-400">{reports.length} records</span>
        </div>

        <table className="w-full text-sm">
          <thead className="text-gray-400">
            <tr>
              <th className="text-left px-6 py-3">Patient</th>
              <th>Report</th>
              <th>Doctor</th>
              <th>Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {reports.map((r) => (
              <motion.tr key={r.id} whileHover={{ scale: 1.01 }} className="border-t hover:bg-gray-50/70 transition">
                <td className="px-6 py-4 font-medium">{r.patient}</td>
                <td>
                  <span className="px-3 py-1 rounded-lg bg-blue-100 text-blue-600 text-xs font-medium">
                    {r.type}
                  </span>
                </td>
                <td className="text-center">{r.doctor}</td>
                <td className="text-center">{r.date}</td>
                <td className="text-center"><StatusBadge status={r.status} /></td>
                <td>
                  <div className="flex gap-2 justify-center">
                    <button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"><FiEye size={14} /></button>
                    <button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"><FiDownload size={14} /></button>
                  </div>
                </td>
              </motion.tr>
            ))}
            {reports.length === 0 && (
              <tr><td colSpan={6} className="py-8 text-center text-gray-400">No reports found.</td></tr>
            )}
          </tbody>
        </table>
      </motion.div>

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

function KpiCard({ title, value, icon, gradient }) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className={`rounded-3xl p-6 text-white shadow-lg bg-gradient-to-br ${gradient} flex justify-between items-center`}
    >
      <div>
        <p className="text-sm opacity-80">{title}</p>
        <h2 className="text-3xl font-semibold mt-2"><CountUp end={value} duration={1.2} /></h2>
      </div>
      <div className="text-3xl opacity-80">{icon}</div>
    </motion.div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    Completed: "bg-green-100 text-green-600",
    Pending: "bg-red-100 text-red-600",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}
