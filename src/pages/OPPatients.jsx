import React, { useState } from "react";
import { useCollection } from "../hooks/useCollection";
import { motion } from "framer-motion";
import { FiUserPlus, FiPlay, FiCheckCircle, FiLoader } from "react-icons/fi";

export default function OPPatients() {
  const { data: patients, loading, add, update } = useCollection("opPatients");
  const [form, setForm] = useState({ name: "", doctor: "" });

  const generateToken = () => `OP-${100 + patients.length + 1}`;

  const addPatient = async () => {
    if (!form.name || !form.doctor) return;
    await add({ ...form, token: generateToken(), status: "Waiting" });
    setForm({ name: "", doctor: "" });
  };

  const updateStatus = async (patient) => {
    const next = { Waiting: "In Consultation", "In Consultation": "Completed" };
    if (next[patient.status]) {
      await update(patient.id, { status: next[patient.status] });
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="p-6 space-y-5">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            placeholder="Patient Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            placeholder="Doctor"
            value={form.doctor}
            onChange={(e) => setForm({ ...form, doctor: e.target.value })}
            className="border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={addPatient}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white rounded-xl py-2 hover:bg-blue-700"
          >
            <FiUserPlus /> Enroll Patient
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {patients.map((p, i) => (
          <QueueCard
            key={p.id}
            patient={p}
            index={i}
            updateStatus={() => updateStatus(p)}
          />
        ))}
        {patients.length === 0 && (
          <p className="col-span-3 text-center text-gray-400 py-8">
            No OP patients enrolled.
          </p>
        )}
      </div>
    </div>
  );
}

function Loader() {
  return (
    <div className="flex items-center justify-center h-64 text-gray-400 gap-2">
      <FiLoader className="animate-spin" /> Loading.......
    </div>
  );
}

function QueueCard({ patient, index, updateStatus }) {
  const statusStyles = {
    Waiting: "bg-yellow-100 text-yellow-600",
    "In Consultation": "bg-blue-100 text-blue-600",
    Completed: "bg-green-100 text-green-600",
  };
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-4"
    >
      <div className="flex justify-between">
        <span className="font-semibold text-gray-800">{patient.token}</span>
        <span
          className={`px-3 py-1 rounded-full text-xs ${statusStyles[patient.status]}`}
        >
          {patient.status}
        </span>
      </div>
      <h3 className="text-lg font-medium text-gray-800">{patient.name}</h3>
      <p className="text-sm text-gray-500">{patient.doctor}</p>
      <p className="text-xs text-gray-400">Queue Position: #{index + 1}</p>
      <button
        onClick={updateStatus}
        disabled={patient.status === "Completed"}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {patient.status === "Waiting" && (
          <>
            <FiPlay /> Start Consultation
          </>
        )}
        {patient.status === "In Consultation" && (
          <>
            <FiCheckCircle /> Complete
          </>
        )}
        {patient.status === "Completed" && "Completed"}
      </button>
    </motion.div>
  );
}
