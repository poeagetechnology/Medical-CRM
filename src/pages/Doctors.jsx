import React from "react";
import { useCollection } from "../hooks/useCollection";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import { FiUser, FiCheckCircle, FiAlertCircle, FiLoader } from "react-icons/fi";

export default function Doctors() {
  const { data: doctors, loading } = useCollection('doctors');

  if (loading) return <Loader />;

  return (
    <div className="p-6 space-y-5">

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard title="Total Doctors" value={doctors.length} icon={<FiUser />} color="blue" />
        <KpiCard title="Available" value={doctors.filter(d => d.status === "Available").length} icon={<FiCheckCircle />} color="green" />
        <KpiCard title="Busy" value={doctors.filter(d => d.status !== "Available").length} icon={<FiAlertCircle />} color="red" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {doctors.map((d) => <DoctorCard key={d.id} doctor={d} />)}
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
  const styles = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    red: "bg-red-100 text-red-600",
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
      <div className={`p-4 rounded-2xl ${styles[color]}`}>{icon}</div>
    </motion.div>
  );
}

function DoctorCard({ doctor }) {
  const statusStyles = {
    Available: "bg-green-100 text-green-600",
    "In Surgery": "bg-red-100 text-red-600",
    "On Duty": "bg-blue-100 text-blue-600",
  };
  const statusDot = {
    Available: "bg-green-500",
    "In Surgery": "bg-red-500",
    "On Duty": "bg-blue-500",
  };
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      className="bg-white/80 backdrop-blur rounded-3xl border border-gray-100 shadow-sm p-5 space-y-4"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600">
          <FiUser />
        </div>
        <div>
          <h3 className="font-medium text-gray-800">{doctor.name}</h3>
          <p className="text-sm text-gray-400">{doctor.dept}</p>
          {doctor.experience && <p className="text-xs text-gray-400">{doctor.experience}</p>}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusStyles[doctor.status] || "bg-gray-100 text-gray-600"}`}>
          {doctor.status || "Unknown"}
        </span>
        <span className={`w-3 h-3 rounded-full ${statusDot[doctor.status] || "bg-gray-400"} animate-pulse`} />
      </div>
      <div className="flex gap-2">
        <button className="flex-1 text-sm bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700">
          Assign Patient
        </button>
        <button className="flex-1 text-sm border border-gray-200 py-2 rounded-xl hover:bg-gray-50">
          View
        </button>
      </div>
    </motion.div>
  );
}
