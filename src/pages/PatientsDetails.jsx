import React from "react";
import { motion } from "framer-motion";
import { useCollection } from "../hooks/useCollection";
import { FiUser, FiActivity, FiClipboard, FiEdit, FiLoader } from "react-icons/fi";

export default function PatientsDetails() {
  const { data: patients, loading: pLoad } = useCollection('patients');
  const { data: activityLogs, loading: aLoad } = useCollection('activityLogs');

  if (pLoad || aLoad) return <Loader />;

  const patient = patients[0];
  if (!patient) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        No patient records found.
      </div>
    );
  }

  const logs = activityLogs.filter(l => l.patient === patient.name);

  return (
    <div className="p-6 space-y-5">

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex justify-between items-center"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 text-xl">
            <FiUser />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-800">{patient.name}</h3>
            <p className="text-sm text-gray-400">Patient ID: #{patient.id?.slice(0, 6).toUpperCase()}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={patient.status} />
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm">
            <FiEdit /> Edit
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        <div className="xl:col-span-2 space-y-6">

          <Card title="Basic Information" icon={<FiUser />}>
            <InfoGrid items={[
              ["Doctor", patient.doctor || '-'],
              ["Room", patient.room || '-'],
              ["Age", patient.age ? `${patient.age} yrs` : '-'],
              ["Gender", patient.gender || '-'],
              ["Phone", patient.phone || '-'],
              ["Blood Group", patient.bloodGroup || '-'],
            ]} />
          </Card>

          <Card title="Medical Information" icon={<FiClipboard />}>
            <InfoGrid items={[
              ["Condition", patient.condition || '-'],
              ["Allergies", patient.allergies || '-'],
              ["Last Checkup", patient.lastCheckup || '-'],
              ["Status", patient.status || '-'],
            ]} />
          </Card>

        </div>

        <div className="space-y-6">
          <Card title="Recent Activity" icon={<FiActivity />}>
            {logs.length > 0 ? (
              <div className="space-y-4">
                {logs.map((item) => (
                  <div key={item.id} className="flex gap-3 items-start">
                    <div className="w-2.5 h-2.5 mt-2 rounded-full bg-blue-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-700">{item.text}</p>
                      <span className="text-xs text-gray-400">{item.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No recent activity.</p>
            )}
          </Card>
        </div>

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

function Card({ title, icon, children }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6"
    >
      <div className="flex items-center gap-2 mb-5 text-gray-700 font-semibold">
        {icon} {title}
      </div>
      {children}
    </motion.div>
  );
}

function InfoGrid({ items }) {
  return (
    <div className="grid grid-cols-2 gap-4 text-sm">
      {items.map(([label, value], i) => (
        <div key={i}>
          <p className="text-gray-400">{label}</p>
          <p className="font-medium text-gray-800">{value}</p>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    Critical: "bg-red-100 text-red-600",
    Stable: "bg-green-100 text-green-600",
    Checkup: "bg-yellow-100 text-yellow-600",
  };
  return (
    <span className={`px-4 py-1.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}
