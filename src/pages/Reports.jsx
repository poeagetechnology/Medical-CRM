import React, { useState } from "react";
import { useCollection } from "../hooks/useCollection";
import { motion } from "framer-motion";
import { FiLoader } from "react-icons/fi";

const TIME_SLOTS = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00"];

export default function DoctorSystem() {
  const { data: doctors, loading: dLoad, update: updateDoctor } = useCollection('doctors');
  const { data: opPatients, loading: oLoad, update: updateOP } = useCollection('opPatients');
  const [assignments, setAssignments] = useState([]);

  const loading = dLoad || oLoad;

  const autoAssign = async () => {
    const availableDoctors = doctors.filter(d => d.status === 'Available');
    const waitingPatients = opPatients.filter(p => p.status === 'Waiting');

    const newAssignments = [...assignments];
    const usedSlots = newAssignments.map(a => a.time);

    for (const patient of waitingPatients) {
      const doctor = availableDoctors.shift();
      if (!doctor) break;

      const freeSlot = TIME_SLOTS.find(t => !usedSlots.includes(t));
      if (!freeSlot) break;

      newAssignments.push({ patient: patient.name, doctor: doctor.name, time: freeSlot });
      usedSlots.push(freeSlot);

      await updateOP(patient.id, { status: 'In Consultation' });
      await updateDoctor(doctor.id, { status: 'On Duty' });
    }

    setAssignments(newAssignments);
  };

  if (loading) return <Loader />;

  return (
    <div className="p-6 space-y-5">

      <div className="flex justify-end">
        <button
          onClick={autoAssign}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition text-sm font-medium"
        >
          Auto Assign Patients
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        <Panel title="OP Queue">
          {opPatients.map((p) => (
            <Item key={p.id} text={p.name} status={p.status} />
          ))}
          {opPatients.length === 0 && <Empty />}
        </Panel>

        <Panel title="Doctors">
          {doctors.map((d) => (
            <Item key={d.id} text={d.name} status={d.status} />
          ))}
          {doctors.length === 0 && <Empty />}
        </Panel>

        <Panel title="Schedule">
          {TIME_SLOTS.map((time) => {
            const slot = assignments.find(a => a.time === time);
            return (
              <div key={time} className="flex justify-between py-2 border-b text-sm">
                <span className="text-gray-500">{time}</span>
                {slot ? (
                  <span>{slot.patient} → {slot.doctor}</span>
                ) : (
                  <span className="text-gray-300">Empty</span>
                )}
              </div>
            );
          })}
        </Panel>

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

function Panel({ title, children }) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm"
    >
      <h3 className="font-semibold text-gray-700 mb-4">{title}</h3>
      <div className="space-y-3">{children}</div>
    </motion.div>
  );
}

function Item({ text, status }) {
  const colors = {
    Waiting: "text-yellow-500",
    "In Consultation": "text-blue-500",
    Assigned: "text-blue-500",
    Available: "text-green-500",
    Busy: "text-red-500",
    "In Surgery": "text-red-500",
    "On Duty": "text-blue-500",
    Completed: "text-green-500",
  };
  return (
    <div className="flex justify-between text-sm">
      <span>{text}</span>
      <span className={colors[status] || 'text-gray-500'}>{status}</span>
    </div>
  );
}

function Empty() {
  return <p className="text-sm text-gray-400 text-center py-2">No records.</p>;
}
