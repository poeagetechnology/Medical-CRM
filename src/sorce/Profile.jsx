import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, profile } = useAuth();

  const name = profile?.name || user?.displayName || 'User';
  const role = profile?.role || 'Admin';
  const email = user?.email || '';
  const phone = profile?.phone || '-';
  const department = profile?.department || '-';
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="p-6 space-y-5">

      <div className="bg-white rounded-xl shadow-sm border p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-lg font-semibold text-blue-600">
            {initials}
          </div>
          <div>
            <h3 className="text-lg font-semibold">{name}</h3>
            <p className="text-sm text-gray-500">{role}</p>
          </div>
        </div>
        <button className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          Edit Profile
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-xl border">
          <h4 className="font-semibold mb-3">Personal Info</h4>
          <p className="text-sm mb-2"><b>Email:</b> {email}</p>
          <p className="text-sm"><b>Phone:</b> {phone}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <h4 className="font-semibold mb-3">Professional Info</h4>
          <p className="text-sm mb-2"><b>Role:</b> {role}</p>
          <p className="text-sm"><b>Department:</b> {department}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border">
        <h4 className="font-semibold mb-3">Account</h4>
        <p className="text-xs text-gray-400 mb-3">UID: {user?.uid}</p>
        <button className="text-sm border px-4 py-2 rounded-lg hover:bg-gray-100">
          Change Password
        </button>
      </div>

    </div>
  );
}
