import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [emailNotif, setEmailNotif] = useState(true);

  return (
    <div className="p-6 space-y-5">

      {/* GENERAL SETTINGS */}
      <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
        <h3 className="font-semibold">General Settings</h3>

        {/* Dark Mode */}
        <div className="flex justify-between items-center">
          <span className="text-sm">Dark Mode</span>
          <input
            type="checkbox"
            checked={darkMode}
            onChange={() => setDarkMode(!darkMode)}
          />
        </div>

        {/* Notifications */}
        <div className="flex justify-between items-center">
          <span className="text-sm">Email Notifications</span>
          <input
            type="checkbox"
            checked={emailNotif}
            onChange={() => setEmailNotif(!emailNotif)}
          />
        </div>
      </div>

      {/* ACCOUNT SETTINGS */}
      <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
        <h3 className="font-semibold">Account Settings</h3>
        {user && (
          <p className="text-sm text-gray-500">Signed in as <b>{user.email}</b></p>
        )}
        <button className="text-sm border px-4 py-2 rounded-lg hover:bg-gray-100">
          Change Password
        </button>
        <button className="text-sm border px-4 py-2 rounded-lg hover:bg-gray-100">
          Manage Users
        </button>
        <button
          onClick={logout}
          className="text-sm border border-red-200 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 block"
        >
          Sign Out
        </button>
      </div>

      {/* SYSTEM SETTINGS */}
      <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
        <h3 className="font-semibold">System Settings</h3>

        <button className="text-sm border px-4 py-2 rounded-lg hover:bg-gray-100">
          Backup Data
        </button>

        <button className="text-sm border px-4 py-2 rounded-lg hover:bg-gray-100">
          Reset System
        </button>
      </div>

    </div>
  );
}