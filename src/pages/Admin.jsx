import React, { useState } from "react";
import { useCollection } from "../hooks/useCollection";
import { UserPlus, ShieldCheck, Loader } from "lucide-react";

export default function Admin() {
  const { data: admins, loading, add } = useCollection('admins');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "Manager" });

  const addAdmin = async () => {
    if (!form.name || !form.email) return;
    await add({ ...form, status: "Active" });
    setForm({ name: "", email: "", role: "Manager" });
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 gap-2">
        <Loader size={16} className="animate-spin" /> Loading...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">

      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition text-sm font-medium"
        >
          <UserPlus size={16} /> Add Admin
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl shadow p-5 border border-green-100">
          <h3 className="font-semibold mb-4 text-gray-700">Add New Admin</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              placeholder="Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-green-500"
            />
            <input
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-green-500"
            />
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-green-500"
            >
              <option>Manager</option>
              <option>Super Admin</option>
              <option>Viewer</option>
            </select>
          </div>
          <button
            onClick={addAdmin}
            className="mt-4 px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700"
          >
            Save
          </button>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl shadow p-5 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <h4 className="text-gray-500 text-sm">Total Admins</h4>
            <ShieldCheck className="text-green-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-gray-800">{admins.length}</p>
        </div>
        <div className="bg-white rounded-2xl shadow p-5 hover:shadow-lg transition">
          <h4 className="text-gray-500 text-sm">Active</h4>
          <p className="text-2xl font-bold mt-2 text-blue-600">
            {admins.filter(a => a.status === "Active").length}
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow p-5 hover:shadow-lg transition">
          <h4 className="text-gray-500 text-sm">Pending</h4>
          <p className="text-2xl font-bold mt-2 text-red-500">
            {admins.filter(a => a.status === "Pending").length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-5">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">Admin List</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="py-2">Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => (
              <tr key={a.id} className="border-b hover:bg-gray-50 transition">
                <td className="py-3">{a.name}</td>
                <td>{a.email}</td>
                <td>{a.role}</td>
                <td className={a.status === "Active" ? "text-green-500" : "text-yellow-500"}>
                  {a.status}
                </td>
              </tr>
            ))}
            {admins.length === 0 && (
              <tr><td colSpan={4} className="py-6 text-center text-gray-400">No admins found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
