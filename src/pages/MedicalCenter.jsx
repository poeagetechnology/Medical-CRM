import React from 'react';
import { useCollection } from '../hooks/useCollection';
import { FiLoader } from 'react-icons/fi';

export default function MedicalCenter() {
  const { data: medicines, loading } = useCollection('medicines');

  if (loading) return <Loader />;

  return (
    <div className="p-6 space-y-5">

      <div className="grid grid-cols-3 gap-4">
        <Card title="Total Medicines" value={medicines.length} />
        <Card title="In Stock" value={medicines.filter(m => m.status === 'In Stock').length} color="text-green-500" />
        <Card title="Low / Out" value={medicines.filter(m => m.status !== 'In Stock').length} color="text-red-500" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4">
        <h3 className="font-semibold mb-4">Medicine Inventory</h3>
        <table className="w-full text-sm">
          <thead className="text-gray-500 border-b">
            <tr>
              <th className="text-left py-2">Medicine</th>
              <th>Stock</th>
              <th>Price</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {medicines.map((m) => (
              <tr key={m.id} className="border-b hover:bg-gray-50 transition">
                <td className="py-2">{m.name}</td>
                <td className="text-center">{m.stock}</td>
                <td className="text-center">{m.price}</td>
                <td className={`font-medium text-center
                  ${m.status === 'In Stock' ? 'text-green-500' : ''}
                  ${m.status === 'Low Stock' ? 'text-yellow-500' : ''}
                  ${m.status === 'Out of Stock' ? 'text-red-500' : ''}
                `}>
                  {m.status}
                </td>
              </tr>
            ))}
            {medicines.length === 0 && (
              <tr><td colSpan={4} className="py-6 text-center text-gray-400">No medicines found.</td></tr>
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
