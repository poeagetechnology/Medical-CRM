import React from 'react';
import { useCollection } from '../hooks/useCollection';
import { FiLoader } from 'react-icons/fi';

export default function Beds() {
  const { data: beds, loading } = useCollection('beds');

  if (loading) return <Loader />;

  return (
    <div className="p-6 space-y-5">

      <div className="grid grid-cols-3 gap-4">
        <Card title="Total Beds" value={beds.length} />
        <Card title="Occupied" value={beds.filter(b => b.status === 'Occupied').length} color="text-red-500" />
        <Card title="Available" value={beds.filter(b => b.status === 'Available').length} color="text-green-500" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4">
        <h3 className="font-semibold mb-4">Bed Status</h3>
        <div className="grid grid-cols-4 gap-4">
          {beds.map((b) => (
            <div
              key={b.id}
              className={`p-4 rounded-lg border text-sm
                ${b.status === 'Occupied' ? 'bg-red-100' : ''}
                ${b.status === 'Available' ? 'bg-green-100' : ''}
                ${b.status === 'Cleaning' ? 'bg-yellow-100' : ''}
              `}
            >
              <p className="font-medium">{b.id}</p>
              <p className="text-xs">{b.status}</p>
              <p className="text-xs text-gray-600 mt-1">{b.patient}</p>
            </div>
          ))}
          {beds.length === 0 && (
            <p className="col-span-4 text-center text-gray-400 py-4">No beds found.</p>
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
