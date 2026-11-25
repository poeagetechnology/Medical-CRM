import React, { useState } from 'react';
import { Briefcase, Check, ClipboardList, Eye, FlaskConical, ShieldCheck, Stethoscope, Syringe, UserRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DEPARTMENT_ROLES, ROLE, ROLE_OPTIONS } from '../../utils/roles';
import { DEPARTMENTS } from '../../utils/formConfigs';
import { errorMessage } from '../../utils/errors';
import { Button, Notice, cx } from '../../components/ui';
import AuthLayout, { PasswordInput } from './AuthLayout';

const ROLE_ICONS = {
  [ROLE.MANAGER]: Briefcase,
  [ROLE.DOCTOR]: Stethoscope,
  [ROLE.NURSE]: Syringe,
  [ROLE.RECEPTIONIST]: ClipboardList,
  [ROLE.LAB_TECH]: FlaskConical,
  [ROLE.VIEWER]: Eye,
};

export default function Signup({ onSwitchToLogin }) {
  const { signup } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: '', department: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const needsDept = DEPARTMENT_ROLES.includes(form.role);

  const validate = () => {
    if (!form.name.trim()) return 'Full name is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return 'Enter a valid email address.';
    if (form.password.length < 6) return 'Password must be at least 6 characters.';
    if (form.password !== form.confirmPassword) return 'Passwords do not match.';
    if (!form.role) return 'Please select a role.';
    if (needsDept && !form.department) return 'Please select your department.';
    return null;
  };

  const submit = async (e) => {
    e.preventDefault();
    const problem = validate();
    if (problem) { setError(problem); return; }
    setError('');
    setLoading(true);
    try {
      await signup(form.email, form.password, form.name, form.role, needsDept ? form.department : '');
    } catch (err) {
      setError(
        err?.code === 'permission-denied'
          ? 'The server refused to create your profile. Ask your administrator to deploy the Firestore security rules.'
          : errorMessage(err, 'Sign up failed. Please try again.')
      );
      setLoading(false);
    }
  };

  const text = (id, label, props) => (
    <div>
      <label htmlFor={`signup-${id}`} className="label">{label}</label>
      <input id={`signup-${id}`} className="input" value={form[id]} onChange={set(id)} {...props} />
    </div>
  );
  const password = (id, label, placeholder) => (
    <div>
      <label htmlFor={`signup-${id}`} className="label">{label}</label>
      <PasswordInput id={`signup-${id}`} autoComplete="new-password" placeholder={placeholder} value={form[id]} onChange={set(id)} />
    </div>
  );

  return (
    <AuthLayout
      wide
      title="Create your account"
      subtitle="Request access to your hospital workspace."
      footer={
        <>
          Already have an account?{' '}
          <button type="button" onClick={onSwitchToLogin} className="font-bold text-brand-600 hover:underline">Sign in</button>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="space-y-5">
        {error && <Notice tone="red"><span role="alert">{error}</span></Notice>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {text('name', 'Full name', { autoComplete: 'name', placeholder: 'Dr. John Smith', autoFocus: true })}
          {text('email', 'Work email', { type: 'email', autoComplete: 'email', placeholder: 'you@hospital.com' })}
          {password('password', 'Password', 'At least 6 characters')}
          {password('confirmPassword', 'Confirm password', 'Re-enter password')}
        </div>

        <fieldset>
          <legend className="label">Your role</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {ROLE_OPTIONS.map((r) => {
              const on = form.role === r.value;
              const Icon = ROLE_ICONS[r.value] || UserRound;
              return (
                <button
                  key={r.value}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setForm((f) => ({ ...f, role: r.value }))}
                  className={cx(
                    'flex items-center gap-3 p-3 rounded-xl border text-left transition bg-surface',
                    on ? 'border-brand-500 ring-4 ring-brand-500/10' : 'border-line hover:border-brand-300'
                  )}
                >
                  <span className={cx('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', on ? 'bg-brand-600 text-white' : 'bg-subtle text-fg-muted')}>
                    <Icon size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-fg">{r.label}</span>
                    <span className="block text-xs text-fg-subtle">{r.desc}</span>
                  </span>
                  {on && <Check size={16} className="text-brand-600 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </fieldset>

        {needsDept && (
          <div>
            <label htmlFor="signup-department" className="label">Department</label>
            <select id="signup-department" className="input" value={form.department} onChange={set('department')}>
              <option value="">Select department</option>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        )}

        <Notice tone="amber" icon={ShieldCheck}>All accounts need approval from a Super Admin before you can sign in.</Notice>

        <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
          {loading ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </AuthLayout>
  );
}
