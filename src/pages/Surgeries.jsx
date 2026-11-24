import React from 'react';
import { useCollection } from '../hooks/useCollection';
import { FiLoader } from 'react-icons/fi';

export default function Surgeries() {
  const { data: surgeries, loading } = useCollection('surgeries');

  if (loading) return <Loader />;

  return (
    <div className="p-6 space-y-5">

      <div className="grid grid-cols-3 gap-4">
        <Card title="Total Surgeries" value={surgeries.length} />
        <Card title="In Progress" value={surgeries.filter(s => s.status === 'In Progress').length} color="text-red-500" />
        <Card title="Completed" value={surgeries.filter(s => s.status === 'Completed').length} color="text-green-500" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4">
        <h3 className="font-semibold mb-4">Surgery Schedule</h3>
        <table className="w-full text-sm">
          <thead className="text-gray-500 border-b">
            <tr>
              <th className="text-left py-2">Patient</th>
              <th>Procedure</th>
              <th>Doctor</th>
              <th>OT Room</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {surgeries.map((s) => (
              <tr key={s.id} className="border-b hover:bg-gray-50 transition">
                <td className="font-medium py-2">{s.patient}</td>
                <td className="text-center">{s.type}</td>
                <td className="text-center">{s.doctor}</td>
                <td className="text-center">{s.room}</td>
                <td className={`font-medium text-center
                  ${s.status === 'In Progress' ? 'text-red-500' : ''}
                  ${s.status === 'Completed' ? 'text-green-500' : ''}
                  ${s.status === 'Scheduled' ? 'text-blue-500' : ''}
                `}>
                  {s.status}
                </td>
              </tr>
            ))}
            {surgeries.length === 0 && (
              <tr><td colSpan={5} className="py-6 text-center text-gray-400">No surgeries found.</td></tr>
            )}
          </tbody>
        </table>
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
