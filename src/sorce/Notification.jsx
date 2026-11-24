import React from 'react';
import { useCollection } from '../hooks/useCollection';
import { FiLoader } from 'react-icons/fi';

export default function Notification() {
  const { data: notifications, loading } = useCollection('notifications');

  if (loading) return <Loader />;

  return (
    <div className="p-6 space-y-5">

      <div className="grid grid-cols-3 gap-4">
        <Card title="Total Alerts" value={notifications.length} />
        <Card title="Critical" value={notifications.filter(n => n.type === 'critical').length} color="text-red-500" />
        <Card title="Updates" value={notifications.filter(n => n.type !== 'critical').length} color="text-blue-500" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4">
        <h3 className="font-semibold mb-4">Recent Notifications</h3>
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-lg border flex justify-between items-start
                ${n.type === 'critical' ? 'bg-red-50 border-red-200' : ''}
                ${n.type === 'info' ? 'bg-blue-50 border-blue-200' : ''}
                ${n.type === 'success' ? 'bg-green-50 border-green-200' : ''}
              `}
            >
              <div>
                <p className="font-medium">{n.title}</p>
                <p className="text-sm text-gray-600">{n.message}</p>
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap ml-4">{n.time}</span>
            </div>
          ))}
          {notifications.length === 0 && (
            <p className="text-center text-gray-400 py-4">No notifications.</p>
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
