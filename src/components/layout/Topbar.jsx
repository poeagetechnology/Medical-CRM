import React from 'react';
import { AlertTriangle, Bell, ChevronDown, LogOut, Menu, Moon, Plus, Search, Settings, Sun, UserCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCollection } from '../../hooks/useCollection';
import { useNotificationSeen } from '../../hooks/useNotificationSeen';
import { useTheme } from '../../hooks/useTheme';
import { PAGES, allowedQuickActions } from '../../config/navigation';
import { byNewest, relativeTime } from '../../utils/format';
import { DOTS, toneOf } from '../../utils/status';
import { Avatar, Badge, Button, EmptyState, IconButton, MenuItem, Popover, cx } from '../ui';

export default function Topbar({ activePage, onNavigate, onOpenMenu, onOpenSearch }) {
  const { user, profile, logout } = useAuth();
  const { isDark, setTheme } = useTheme();
  const { data: patients } = useCollection('patients');
  const { data: notifications } = useCollection('notifications');
  const { isUnread, markAllRead } = useNotificationSeen();

  const page = PAGES[activePage] || PAGES.dashboard;
  const name = profile?.name || user?.email?.split('@')[0] || 'User';
  const critical = patients.filter((p) => p.status === 'Critical').length;
  const latest = [...notifications].sort(byNewest).slice(0, 6);
  const unread = notifications.filter(isUnread).length;
  const actions = allowedQuickActions(profile);
  const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform);

  return (
    <header className="sticky top-0 z-20 h-16 flex items-center gap-2 sm:gap-3 px-3 sm:px-6 lg:px-8 bg-surface/90 backdrop-blur border-b border-line">
      <IconButton label="Open menu" icon={Menu} onClick={onOpenMenu} className="lg:hidden" />

      <nav aria-label="Breadcrumb" className="hidden md:flex items-center gap-2 text-sm min-w-0">
        {page.section !== page.label && (
          <>
            <span className="text-fg-subtle">{page.section}</span>
            <span className="text-fg-subtle">/</span>
          </>
        )}
        <span className="font-bold text-fg truncate">{page.label}</span>
      </nav>

      <button
        type="button"
        onClick={onOpenSearch}
        className="ml-auto flex items-center gap-2 h-9 w-full max-w-[18rem] px-3 rounded-lg border border-line bg-subtle/60 text-sm text-fg-subtle hover:border-brand-300 hover:bg-surface transition min-w-0"
      >
        <Search size={15} className="flex-shrink-0" />
        <span className="truncate">Search or jump to…</span>
        <kbd className="ml-auto hidden sm:inline font-mono text-2xs px-1.5 py-0.5 rounded border border-line bg-surface whitespace-nowrap">
          {isMac ? '⌘' : 'Ctrl'} K
        </kbd>
      </button>

      {critical > 0 && (
        <button
          type="button"
          onClick={() => onNavigate('patients', { status: 'Critical' })}
          className="hidden xl:flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-bold bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-300 whitespace-nowrap"
        >
          <AlertTriangle size={14} /> {critical} critical
        </button>
      )}

      {actions.length > 0 && (
        <Popover
          label="Create new"
          width="w-60"
          triggerClassName="rounded-lg"
          trigger={() => (
            <span className="inline-flex items-center gap-1.5 h-9 px-2.5 sm:px-3 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700">
              <Plus size={16} /> <span className="hidden sm:inline">New</span>
            </span>
          )}
        >
          {(close) => (
            <div className="p-1.5 max-h-[70vh] overflow-y-auto scrollbar-thin">
              {actions.map((a) => (
                <MenuItem key={a.page} icon={a.icon} onClick={() => { close(); onNavigate(a.page, { new: '1' }); }}>
                  {a.label}
                </MenuItem>
              ))}
            </div>
          )}
        </Popover>
      )}

      <IconButton
        label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
        icon={isDark ? Sun : Moon}
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        className="hidden sm:inline-flex"
      />

      {/* Notifications */}
      <Popover
        label="Notifications"
        width="w-80"
        triggerClassName="relative w-9 h-9 rounded-lg flex items-center justify-center text-fg-muted hover:bg-subtle flex-shrink-0"
        trigger={() => (
          <>
            <Bell size={17} />
            {unread > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </>
        )}
      >
        {(close) => (
          <>
            <div className="flex items-center justify-between px-4 py-3 border-b border-line">
              <p className="text-sm font-bold text-fg">Notifications</p>
              {unread > 0
                ? <Button size="xs" variant="ghost" onClick={markAllRead}>Mark all read</Button>
                : <Badge>All caught up</Badge>}
            </div>
            <div className="max-h-80 overflow-y-auto scrollbar-thin divide-y divide-line">
              {latest.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => { close(); onNavigate('notifications'); }}
                  className={cx('flex w-full text-left gap-3 px-4 py-3 hover:bg-subtle', isUnread(n) && 'bg-brand-50/60 dark:bg-brand-500/10')}
                >
                  <span className={cx('w-2 h-2 mt-1.5 rounded-full flex-shrink-0', DOTS[toneOf(n.type)])} />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-fg truncate">{n.title}</span>
                    <span className="block text-xs text-fg-muted line-clamp-2">{n.message}</span>
                    <span className="block text-2xs text-fg-subtle mt-1">{relativeTime(n.createdAt) || n.time}</span>
                  </span>
                </button>
              ))}
              {latest.length === 0 && <EmptyState compact icon={Bell} title="No notifications" />}
            </div>
            <button
              type="button"
              onClick={() => { close(); onNavigate('notifications'); }}
              className="w-full py-2.5 text-xs font-bold text-brand-600 hover:bg-subtle border-t border-line"
            >
              View all notifications
            </button>
          </>
        )}
      </Popover>

      {/* Account */}
      <Popover
        label="Account menu"
        width="w-64"
        triggerClassName="flex items-center gap-2 rounded-lg p-1 hover:bg-subtle flex-shrink-0"
        trigger={() => (
          <>
            <Avatar name={name} size={30} />
            <ChevronDown size={14} className="hidden sm:block text-fg-subtle" />
          </>
        )}
      >
        {(close) => (
          <>
            <div className="px-4 py-3 border-b border-line">
              <p className="text-sm font-bold text-fg truncate">{name}</p>
              <p className="text-xs text-fg-subtle truncate">{user?.email}</p>
              <Badge tone="brand" className="mt-2">{profile?.role}</Badge>
            </div>
            <div className="p-1.5">
              <MenuItem icon={UserCircle} onClick={() => { close(); onNavigate('profile'); }}>My profile</MenuItem>
              <MenuItem icon={Settings} onClick={() => { close(); onNavigate('settings'); }}>Settings</MenuItem>
              <MenuItem icon={isDark ? Sun : Moon} onClick={() => setTheme(isDark ? 'light' : 'dark')}>
                {isDark ? 'Light theme' : 'Dark theme'}
              </MenuItem>
              <MenuItem icon={LogOut} danger onClick={logout}>Sign out</MenuItem>
            </div>
          </>
        )}
      </Popover>
    </header>
  );
}
