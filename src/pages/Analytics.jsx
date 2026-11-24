import React from 'react';
import { useCollection } from '../hooks/useCollection';
import { FiLoader } from 'react-icons/fi';

export default function Analytics() {
  const { data: patients, loading: pLoad } = useCollection('patients');
  const { data: billing, loading: bLoad } = useCollection('billing');
  const { data: beds, loading: bedLoad } = useCollection('beds');

  const loading = pLoad || bLoad || bedLoad;

  if (loading) return <Loader />;

  const totalPatients = patients.length;
  const emergency = patients.filter(p => p.status === 'Critical').length;
  const parseAmount = (str) => parseInt((str || '0').replace(/[^0-9]/g, ''), 10) || 0;
  const paidBilling = billing.filter(b => b.status === 'Paid');
  const revenue = `$${paidBilling.reduce((sum, b) => sum + parseAmount(b.amount), 0).toLocaleString()}`;
  const occupiedBeds = beds.filter(b => b.status === 'Occupied').length;
  const bedPct = beds.length > 0 ? Math.round((occupiedBeds / beds.length) * 100) : 0;

  const critical = patients.filter(p => p.status === 'Critical').length;
  const stable = patients.filter(p => p.status === 'Stable').length;
  const checkup = patients.filter(p => p.status === 'Checkup').length;
  const total = patients.length || 1;

  return (
    <div className="p-6 space-y-5">

      <div className="grid grid-cols-4 gap-4">
        <Card title="Total Patients" value={totalPatients} />
        <Card title="Emergency Cases" value={emergency} danger />
        <Card title="Revenue (Paid)" value={revenue} success />
        <Card title="Bed Occupancy" value={`${bedPct}%`} warning />
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border">
        <h3 className="font-semibold mb-4">Patient Status Overview</h3>
        <div className="space-y-3">
          <Bar label="Critical" value={Math.round((critical / total) * 100)} color="bg-red-500" />
          <Bar label="Stable" value={Math.round((stable / total) * 100)} color="bg-green-500" />
          <Bar label="Checkup" value={Math.round((checkup / total) * 100)} color="bg-yellow-500" />
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border">
        <h3 className="font-semibold mb-4">Billing Overview</h3>
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
              <tr key={b.id} className="border-b">
                <td className="py-2">{b.patient}</td>
                <td className="text-center">{b.amount}</td>
                <td className="text-center text-gray-400">{b.date || '-'}</td>
                <td className={`text-center font-medium ${b.status === 'Paid' ? 'text-green-500' : 'text-red-500'}`}>
                  {b.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border">
        <h3 className="font-semibold mb-4">Recent Patients</h3>
        <div className="space-y-2 text-sm">
          {patients.map((p) => (
            <div key={p.id} className="flex justify-between border-b pb-2">
              <span>{p.name}</span>
              <span className={
                p.status === 'Critical' ? 'text-red-500' :
                p.status === 'Stable' ? 'text-green-500' : 'text-yellow-500'
              }>
                {p.status}
              </span>
            </div>
          ))}
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

function Card({ title, value, danger, success, warning }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border">
      <p className="text-xs text-gray-500">{title}</p>
      <h2 className="text-xl font-semibold">{value}</h2>
      <div className={`text-xs mt-1 ${danger ? 'text-red-500' : success ? 'text-green-500' : warning ? 'text-yellow-500' : ''}`}>
        Live Data
      </div>
    </div>
  );
}

function Bar({ label, value, color }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="w-full bg-gray-200 h-2 rounded">
        <div className={`${color} h-2 rounded`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
