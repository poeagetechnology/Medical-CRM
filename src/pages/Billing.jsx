import React from 'react';
import { useCollection } from '../hooks/useCollection';
import { FiLoader } from 'react-icons/fi';

export default function Billing() {
  const { data: billing, loading } = useCollection('billing');

  if (loading) return <Loader />;

  return (
    <div className="p-6 space-y-5">

      <div className="grid grid-cols-3 gap-4">
        <Card title="Total Bills" value={billing.length} />
        <Card title="Paid" value={billing.filter(b => b.status === 'Paid').length} color="text-green-500" />
        <Card title="Pending" value={billing.filter(b => b.status === 'Pending').length} color="text-red-500" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4">
        <h3 className="font-semibold mb-4">Billing Records</h3>
        <table className="w-full text-sm">
          <thead className="text-gray-500 border-b">
            <tr>
              <th className="text-left py-2">Patient</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {billing.map((b) => (
              <tr key={b.id} className="border-b hover:bg-gray-50 transition">
                <td className="py-2">{b.patient}</td>
                <td className="font-medium text-center">{b.amount}</td>
                <td className="text-center text-gray-400">{b.date || '-'}</td>
                <td className={`font-medium text-center
                  ${b.status === 'Paid' ? 'text-green-500' : ''}
                  ${b.status === 'Pending' ? 'text-red-500' : ''}
                `}>
                  {b.status}
                </td>
              </tr>
            ))}
            {billing.length === 0 && (
              <tr><td colSpan={4} className="py-6 text-center text-gray-400">No billing records.</td></tr>
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
