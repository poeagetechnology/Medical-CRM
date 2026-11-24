import React from 'react';
import { useCollection } from '../hooks/useCollection';
import { FiLoader } from 'react-icons/fi';

export default function Ambulance() {
  const { data: ambulances, loading } = useCollection('ambulances');

  if (loading) return <Loader />;

  return (
    <div className="p-6 space-y-5">

      <div className="grid grid-cols-3 gap-4">
        <Card title="Total Ambulances" value={ambulances.length} />
        <Card title="Active" value={ambulances.filter(a => a.status === 'On Route').length} color="text-blue-500" />
        <Card title="Available" value={ambulances.filter(a => a.status === 'Available').length} color="text-green-500" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4">
        <h3 className="font-semibold mb-4">Live Ambulance Status</h3>
        <div className="space-y-3">
          {ambulances.map((a) => (
            <div key={a.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition">
              <div>
                <p className="font-medium">{a.id}</p>
                <p className="text-xs text-gray-500">ETA: {a.eta}</p>
                {a.driver && <p className="text-xs text-gray-400">Driver: {a.driver}</p>}
              </div>
              <div className={`text-sm font-medium
                ${a.status === 'On Route' ? 'text-blue-500' : ''}
                ${a.status === 'Available' ? 'text-green-500' : ''}
              `}>
                {a.status}
              </div>
            </div>
          ))}
          {ambulances.length === 0 && (
            <p className="text-center text-gray-400 py-4">No ambulances found.</p>
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
