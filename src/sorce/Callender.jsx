import React from 'react';
import { useCollection } from '../hooks/useCollection';
import { FiLoader } from 'react-icons/fi';

export default function Calendar() {
  const { data: appointments, loading: aLoad } = useCollection('appointments');
  const { data: surgeries, loading: sLoad } = useCollection('surgeries');

  if (aLoad || sLoad) return <Loader />;

  return (
    <div className="p-6 space-y-5">

      <div className="grid grid-cols-3 gap-4">
        <Card title="Total Events" value={appointments.length + surgeries.length} />
        <Card title="Appointments" value={appointments.length} color="text-blue-500" />
        <Card title="Surgeries" value={surgeries.length} color="text-red-500" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4">
        <h3 className="font-semibold mb-4">Today's Schedule</h3>
        <div className="space-y-3 text-sm">

          {appointments.map((a) => (
            <div key={a.id} className="flex justify-between p-3 border rounded-lg hover:bg-gray-50">
              <div>
                <p className="font-medium">{a.patient}</p>
                <p className="text-xs text-gray-500">{a.doctor} · {a.time}</p>
              </div>
              <span className={`text-sm font-medium ${
                a.status === 'Completed' ? 'text-green-500' :
                a.status === 'Pending' ? 'text-yellow-500' : 'text-blue-500'
              }`}>{a.status}</span>
            </div>
          ))}

          {surgeries.map((s) => (
            <div key={s.id} className="flex justify-between p-3 border rounded-lg hover:bg-gray-50 bg-red-50/30">
              <div>
                <p className="font-medium">{s.type}</p>
                <p className="text-xs text-gray-500">{s.doctor} · {s.room}</p>
              </div>
              <span className={`text-sm font-medium ${
                s.status === 'Completed' ? 'text-green-500' :
                s.status === 'In Progress' ? 'text-red-500' : 'text-blue-500'
              }`}>{s.status}</span>
            </div>
          ))}

          {appointments.length === 0 && surgeries.length === 0 && (
            <p className="text-center text-gray-400 py-4">No events today.</p>
          )}
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

function Card({ title, value, color }) {
  return (
    <div className="bg-white p-4 rounded-xl border shadow-sm">
      <p className="text-xs text-gray-500">{title}</p>
      <h2 className={`text-xl font-semibold ${color || ''}`}>{value}</h2>
    </div>
  );
}
