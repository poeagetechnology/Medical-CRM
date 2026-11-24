import React, { useState } from "react";
import { useCollection } from "../hooks/useCollection";
import { motion } from "framer-motion";
import { FiX, FiLoader } from "react-icons/fi";

const HOURS = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];

export default function Appointments() {
  const { data: appointments, loading, update } = useCollection('appointments');
  const [selected, setSelected] = useState(null);

  const updateTime = async (newTime) => {
    if (selected) {
      await update(selected.id, { time: newTime });
      setSelected(null);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="p-6 space-y-5">

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {HOURS.map((hour) => (
          <div key={hour} className="flex border-t">
            <div className="w-24 p-4 text-sm text-gray-400 border-r">{hour}</div>
            <div className="flex-1 p-3 space-y-2">
              {appointments
                .filter(a => a.time && a.time.startsWith(hour.split(":")[0]))
                .map((a) => (
                  <AppointmentBlock key={a.id} data={a} onClick={() => setSelected(a)} />
                ))}
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <RescheduleModal
          appointment={selected}
          onClose={() => setSelected(null)}
          onSave={updateTime}
        />
      )}

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

function AppointmentBlock({ data, onClick }) {
  const statusColors = {
    Scheduled: "bg-blue-100 text-blue-600",
    Pending: "bg-yellow-100 text-yellow-600",
    Completed: "bg-green-100 text-green-600",
  };
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className="cursor-pointer bg-white border border-gray-200 rounded-xl p-3 shadow-sm"
    >
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-medium text-gray-800">{data.patient}</h4>
          <p className="text-xs text-gray-500">{data.doctor}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs ${statusColors[data.status] || "bg-gray-100 text-gray-600"}`}>
          {data.status}
        </span>
      </div>
    </motion.div>
  );
}

function RescheduleModal({ appointment, onClose, onSave }) {
  const times = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];
  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl p-6 w-full max-w-md"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-800">Reschedule Appointment</h3>
          <button onClick={onClose}><FiX /></button>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          {appointment.patient} • {appointment.doctor}
        </p>
        <div className="grid grid-cols-3 gap-3">
          {times.map((t) => (
            <button
              key={t}
              onClick={() => onSave(t)}
              className="border rounded-xl py-2 hover:bg-blue-50 hover:border-blue-400"
            >
              {t}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
