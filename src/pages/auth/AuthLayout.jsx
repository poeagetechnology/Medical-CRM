import React, { useState } from 'react';
import { BedDouble, CalendarClock, Eye, EyeOff, HeartPulse, ShieldCheck, Users } from 'lucide-react';

const HIGHLIGHTS = [
  { icon: Users, title: 'Complete patient records', text: 'Admissions, reports, billing and history in one profile.' },
  { icon: CalendarClock, title: 'Conflict-free scheduling', text: 'Appointments, theatres and queues that stay in sync.' },
  { icon: BedDouble, title: 'Live operations', text: 'Beds, ambulances and pharmacy updated in real time.' },
  { icon: ShieldCheck, title: 'Role-based security', text: 'Every account is approved and limited to its role.' },
];

const Brand = ({ light }) => (
  <div className="flex items-center gap-3">
    <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg">
      <HeartPulse size={21} className="text-white" />
    </span>
    <div>
      <p className={`text-lg font-extrabold leading-tight ${light ? 'text-white' : 'text-fg'}`}>MedCRM</p>
      <p className={`text-2xs leading-tight ${light ? 'text-slate-400' : 'text-fg-subtle'}`}>Hospital Management</p>
    </div>
  </div>
);

// Split screen: product panel on large screens, form on the right.
export default function AuthLayout({ title, subtitle, children, footer, wide }) {
  return (
    <div className="min-h-screen flex bg-canvas">
      <aside className="hidden lg:flex lg:w-[44%] xl:w-[40%] flex-col justify-between p-12 bg-[#0b1220] relative overflow-hidden sticky top-0 h-screen">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-brand-600/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-24 w-96 h-96 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="relative"><Brand light /></div>
        <div className="relative max-w-md">
          <h2 className="text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Run your hospital from one clear workspace.
          </h2>
          <ul className="mt-10 space-y-5">
            {HIGHLIGHTS.map(({ icon: Icon, title: t, text }) => (
              <li key={t} className="flex gap-4">
                <span className="w-10 h-10 rounded-lg bg-white/5 ring-1 ring-white/10 flex items-center justify-center flex-shrink-0">
                  <Icon size={18} className="text-brand-300" />
                </span>
                <span>
                  <span className="block text-sm font-bold text-white">{t}</span>
                  <span className="block text-sm text-slate-400">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-slate-500">© {new Date().getFullYear()} MedCRM · Hospital Management System</p>
      </aside>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className={`w-full ${wide ? 'max-w-2xl' : 'max-w-sm'}`}>
          <div className="lg:hidden mb-8"><Brand /></div>
          <h1 className="text-2xl font-extrabold tracking-tight text-fg">{title}</h1>
          <p className="text-sm text-fg-subtle mt-1.5">{subtitle}</p>
          <div className="mt-7">{children}</div>
          {footer && <div className="mt-6 text-sm text-center text-fg-muted">{footer}</div>}
        </div>
      </main>
    </div>
  );
}

export function PasswordInput({ id, value, onChange, ...props }) {
  const [shown, setShown] = useState(false);
  const Icon = shown ? EyeOff : Eye;
  return (
    <div className="relative">
      <input id={id} type={shown ? 'text' : 'password'} value={value} onChange={onChange} className="input !pr-10" {...props} />
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        aria-label={shown ? 'Hide password' : 'Show password'}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-subtle hover:text-fg"
      >
        <Icon size={16} />
      </button>
    </div>
  );
}
