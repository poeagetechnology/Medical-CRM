import React from 'react';
import { HeartPulse, LogOut, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCollection } from '../../hooks/useCollection';
import { useNotificationSeen } from '../../hooks/useNotificationSeen';
import { SECTIONS } from '../../config/navigation';
import { USER_STATUS, canViewPage } from '../../utils/roles';
import { Avatar, cx } from '../ui';

// Live counters shown next to menu items.
function useBadges() {
  const { data: users } = useCollection('users');
  const { data: queue } = useCollection('opPatients');
  const { data: notifications } = useCollection('notifications');
  const { isUnread } = useNotificationSeen();

  return {
    admin: users.filter((u) => u.status === USER_STATUS.PENDING).length,
    opPatients: queue.filter((q) => q.status === 'Waiting').length,
    notifications: notifications.filter(isUnread).length,
  };
}

export default function Sidebar({ activePage, onNavigate, collapsed, onToggle, mobileOpen, onCloseMobile }) {
  const { user, profile, logout } = useAuth();
  const badges = useBadges();
  const name = profile?.name || user?.email?.split('@')[0] || 'User';

  // Only show pages this role may open, and drop sections left empty.
  const sections = SECTIONS
    .map((s) => ({ ...s, items: s.items.filter((i) => canViewPage(profile, i.id)) }))
    .filter((s) => s.items.length);

  const go = (id) => { onNavigate(id); onCloseMobile(); };
  // The icon-only rail applies to desktop; the mobile drawer is always full.
  const rail = collapsed && !mobileOpen;

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-30 bg-slate-950/60 lg:hidden" onClick={onCloseMobile} />}

      <aside
        className={cx(
          'fixed inset-y-0 left-0 z-40 flex flex-col bg-[#0b1220] text-slate-300 border-r border-white/5',
          'transition-[width,transform] duration-200 ease-out',
          rail ? 'w-[72px]' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand */}
        <div className={cx('h-16 flex items-center gap-3 border-b border-white/5 flex-shrink-0', rail ? 'justify-center' : 'px-4')}>
          <span className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-900/50">
            <HeartPulse size={19} className="text-white" />
          </span>
          {!rail && (
            <div className="min-w-0">
              <p className="text-[15px] font-extrabold text-white leading-tight tracking-tight">MedCRM</p>
              <p className="text-2xs text-slate-500 leading-tight">Hospital Management</p>
            </div>
          )}
          {mobileOpen && (
            <button onClick={onCloseMobile} aria-label="Close menu" className="ml-auto text-slate-400 hover:text-white lg:hidden">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav aria-label="Main" className="flex-1 overflow-y-auto scrollbar-thin py-3 px-3 [scrollbar-color:#1e293b_transparent]">
          {sections.map((section, index) => (
            <div key={section.title} className={index ? 'mt-5' : ''}>
              {rail
                ? index > 0 && <div className="mx-2 mb-3 border-t border-white/10" />
                : <p className="px-3 mb-1.5 text-2xs font-bold uppercase tracking-[0.12em] text-slate-500">{section.title}</p>}
              <ul className="space-y-0.5">
                {section.items.map(({ id, label, icon: Icon }) => {
                  const active = activePage === id;
                  const count = badges[id] || 0;
                  return (
                    <li key={id}>
                      <button
                        onClick={() => go(id)}
                        title={rail ? label : undefined}
                        aria-current={active ? 'page' : undefined}
                        className={cx(
                          'relative flex items-center gap-3 w-full h-9 rounded-lg text-[13px] font-semibold transition-colors',
                          rail ? 'justify-center' : 'px-3',
                          active ? 'bg-brand-600 text-white shadow-md shadow-brand-950/50' : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                        )}
                      >
                        <Icon size={17} className="flex-shrink-0" />
                        {!rail && <span className="truncate flex-1 text-left">{label}</span>}
                        {count > 0 && (rail
                          ? <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-amber-400" />
                          : <span className={cx('min-w-[20px] px-1.5 rounded-full text-2xs font-bold tabular', active ? 'bg-white/20 text-white' : 'bg-amber-400/15 text-amber-300')}>{count}</span>)}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* User + collapse */}
        <div className="border-t border-white/5 p-3 flex-shrink-0 space-y-1">
          <div className={cx('flex items-center gap-2.5', rail ? 'flex-col' : 'px-1')}>
            <button onClick={() => go('profile')} title="My profile" className="flex items-center gap-2.5 min-w-0 flex-1 text-left">
              <Avatar name={name} size={34} />
              {!rail && (
                <span className="min-w-0">
                  <span className="block text-xs font-bold text-slate-100 truncate">{name}</span>
                  <span className="block text-2xs text-slate-500 truncate">{profile?.role}</span>
                </span>
              )}
            </button>
            <button onClick={logout} title="Sign out" aria-label="Sign out" className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-red-500/10 hover:text-red-400">
              <LogOut size={16} />
            </button>
          </div>
          <button
            onClick={onToggle}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cx('hidden lg:flex items-center gap-3 w-full h-8 rounded-lg text-xs font-semibold text-slate-500 hover:bg-white/5 hover:text-slate-200', rail ? 'justify-center' : 'px-3')}
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <><PanelLeftClose size={16} /> Collapse</>}
          </button>
        </div>
      </aside>
    </>
  );
}
