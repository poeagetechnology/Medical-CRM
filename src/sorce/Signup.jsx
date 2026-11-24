import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  { value: 'Super Admin', label: 'Super Admin', desc: 'Full system access & all permissions', icon: '🛡️' },
  { value: 'Manager', label: 'Manager', desc: 'Manage staff, reports & operations', icon: '👔' },
  { value: 'Doctor', label: 'Doctor', desc: 'Patient care, prescriptions & checkups', icon: '🩺' },
  { value: 'Nurse', label: 'Nurse', desc: 'Patient monitoring & bedside care', icon: '💉' },
  { value: 'Receptionist', label: 'Receptionist', desc: 'Patient registration & appointments', icon: '📋' },
  { value: 'Lab Technician', label: 'Lab Technician', desc: 'Lab tests & diagnostic reports', icon: '🔬' },
  { value: 'Viewer', label: 'Viewer', desc: 'Read-only access to reports & data', icon: '👁️' },
];

const DEPARTMENTS = [
  'Cardiology', 'Orthopedic', 'General', 'Neurology', 'Pediatrics',
  'Oncology', 'ICU', 'OPD', 'Emergency', 'Lab', 'Pharmacy', 'Administration',
];

export default function Signup({ onSwitchToLogin }) {
  const { signup } = useAuth();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    department: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const validate = () => {
    if (!form.name.trim()) return 'Full name is required.';
    if (!form.email) return 'Email is required.';
    if (form.password.length < 6) return 'Password must be at least 6 characters.';
    if (form.password !== form.confirmPassword) return 'Passwords do not match.';
    if (!form.role) return 'Please select a role.';
    return null;
  };

  const handleSignup = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setLoading(true);
    try {
      await signup(form.email, form.password, form.name, form.role, form.department);
    } catch (err) {
      const messages = {
        'auth/email-already-in-use': 'This email is already registered.',
        'auth/invalid-email': 'Invalid email address.',
        'auth/weak-password': 'Password is too weak.',
      };
      setError(messages[err.code] || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const needsDept = ['Doctor', 'Nurse', 'Lab Technician'].includes(form.role);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 py-10 px-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg border p-8">

        {/* HEADER */}
        <div className="mb-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-3 text-2xl">
            🏥
          </div>
          <h1 className="text-xl font-semibold text-gray-800">Create Account</h1>
          <p className="text-sm text-gray-500">Register to access Hospital CRM</p>
        </div>

        {error && (
          <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">
            {error}
          </div>
        )}

        {/* BASIC INFO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm text-gray-600">Full Name</label>
            <input
              type="text"
              placeholder="Dr. John Smith"
              value={form.name}
              onChange={set('name')}
              className="w-full mt-1 px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Email</label>
            <input
              type="email"
              placeholder="you@hospital.com"
              value={form.email}
              onChange={set('email')}
              className="w-full mt-1 px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Password</label>
            <input
              type="password"
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={set('password')}
              className="w-full mt-1 px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Confirm Password</label>
            <input
              type="password"
              placeholder="Re-enter password"
              value={form.confirmPassword}
              onChange={set('confirmPassword')}
              className="w-full mt-1 px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
        </div>

        {/* ROLE SELECTION */}
        <div className="mb-4">
          <label className="text-sm text-gray-600 block mb-2">Select Your Role</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setForm({ ...form, role: r.value })}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition
                  ${form.role === r.value
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-200 hover:bg-gray-50'
                  }`}
              >
                <span className="text-2xl">{r.icon}</span>
                <div>
                  <p className={`text-sm font-medium ${form.role === r.value ? 'text-indigo-700' : 'text-gray-800'}`}>
                    {r.label}
                  </p>
                  <p className="text-xs text-gray-400">{r.desc}</p>
                </div>
                {form.role === r.value && (
                  <span className="ml-auto text-indigo-500 text-lg">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* DEPARTMENT (conditional) */}
        {(needsDept || form.role === 'Manager') && (
          <div className="mb-4">
            <label className="text-sm text-gray-600">Department</label>
            <select
              value={form.department}
              onChange={set('department')}
              className="w-full mt-1 px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              <option value="">Select department</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        )}

        {/* SUBMIT */}
        <button
          onClick={handleSignup}
          disabled={loading}
          className="w-full mt-2 bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>

        {/* SWITCH TO LOGIN */}
        <p className="text-sm text-center text-gray-500 mt-4">
          Already have an account?{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-indigo-600 font-medium hover:underline"
          >
            Sign In
          </button>
        </p>

        <p className="text-xs text-gray-400 text-center mt-3">
          © 2026 Hospital Management System
        </p>

      </div>
    </div>
  );
}
