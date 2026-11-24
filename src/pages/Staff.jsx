import React, { useState } from 'react';
import { useCollection } from '../hooks/useCollection';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { FiUserPlus, FiLoader, FiUser } from 'react-icons/fi';

export default function Staff() {
  const { data: staff, loading, add } = useCollection('staff');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', role: 'Nurse', dept: '', phone: '', shift: 'Morning', status: 'Active' });

  const addStaff = async () => {
    if (!form.name || !form.dept) return;
    await add(form);
    setForm({ name: '', role: 'Nurse', dept: '', phone: '', shift: 'Morning', status: 'Active' });
    setShowForm(false);
  };

  if (loading) return <Loader />;

  return (
    <div className="p-6 space-y-5">

      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition text-sm font-medium"
        >
          <FiUserPlus size={15} /> Add Staff
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl shadow p-5 border border-blue-100">
          <h3 className="font-semibold mb-4 text-gray-700">Add New Staff Member</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <input placeholder="Full Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
              className="border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-sm">
              <option>Nurse</option>
              <option>Head Nurse</option>
              <option>Receptionist</option>
              <option>Lab Technician</option>
              <option>Pharmacist</option>
              <option>Ward Boy</option>
            </select>
            <input placeholder="Department" value={form.dept} onChange={e => setForm({ ...form, dept: e.target.value })}
              className="border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            <input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
              className="border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            <select value={form.shift} onChange={e => setForm({ ...form, shift: e.target.value })}
              className="border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-sm">
              <option>Morning</option>
              <option>Evening</option>
              <option>Night</option>
            </select>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
              className="border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-sm">
              <option>Active</option>
              <option>On Leave</option>
              <option>Inactive</option>
            </select>
          </div>
          <button onClick={addStaff} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm">
            Save
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <KpiCard title="Total Staff" value={staff.length} />
        <KpiCard title="Active" value={staff.filter(s => s.status === 'Active').length} color="text-green-600" />
        <KpiCard title="On Leave" value={staff.filter(s => s.status === 'On Leave').length} color="text-yellow-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {staff.map((s) => <StaffCard key={s.id} member={s} />)}
        {staff.length === 0 && (
          <p className="col-span-3 text-center text-gray-400 py-8">No staff records found.</p>
        )}
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

function KpiCard({ title, value, color }) {
  return (
    <div className="bg-white p-4 rounded-xl border shadow-sm">
      <p className="text-xs text-gray-500">{title}</p>
      <h2 className={`text-xl font-semibold ${color || ''}`}>
        <CountUp end={value} duration={1} />
      </h2>
    </div>
  );
}

function StaffCard({ member }) {
  const shiftColors = { Morning: 'bg-yellow-100 text-yellow-600', Evening: 'bg-orange-100 text-orange-600', Night: 'bg-indigo-100 text-indigo-600' };
  const statusColors = { Active: 'bg-green-100 text-green-600', 'On Leave': 'bg-yellow-100 text-yellow-600', Inactive: 'bg-gray-100 text-gray-500' };
  return (
    <motion.div whileHover={{ y: -4 }} className="bg-white rounded-2xl border shadow-sm p-5 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
          <FiUser />
        </div>
        <div>
          <p className="font-semibold text-gray-800">{member.name}</p>
          <p className="text-xs text-gray-400">{member.role}</p>
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        <span className={`text-xs px-2 py-1 rounded-full ${statusColors[member.status] || 'bg-gray-100 text-gray-500'}`}>
          {member.status}
        </span>
        <span className={`text-xs px-2 py-1 rounded-full ${shiftColors[member.shift] || 'bg-gray-100'}`}>
          {member.shift} Shift
        </span>
      </div>
      <div className="text-xs text-gray-500 space-y-1">
        <p>Dept: <span className="font-medium text-gray-700">{member.dept}</span></p>
        {member.phone && <p>Phone: <span className="font-medium text-gray-700">{member.phone}</span></p>}
      </div>
    </motion.div>
  );
}
