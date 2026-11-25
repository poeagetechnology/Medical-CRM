import React, { useCallback, useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import CommandPalette from './CommandPalette';
import { Button, Notice, cx } from '../ui';
import { CloudOff } from 'lucide-react';
import { READ_ERROR } from '../../hooks/useCollection';

const KEY = 'medcrm_sidebar_collapsed';
const readCollapsed = () => {
  try { return localStorage.getItem(KEY) === '1'; } catch { return false; }
};

export default function AppShell({ activePage, onNavigate, children }) {
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [readError, setReadError] = useState(null);

  useEffect(() => {
    const onError = (e) => setReadError(e.detail);
    window.addEventListener(READ_ERROR, onError);
    return () => window.removeEventListener(READ_ERROR, onError);
  }, []);

  const toggle = () =>
    setCollapsed((c) => {
      try { localStorage.setItem(KEY, c ? '0' : '1'); } catch { /* storage blocked */ }
      return !c;
    });

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearching((s) => !s);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const closeSearch = useCallback(() => setSearching(false), []);

  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar
        activePage={activePage}
        onNavigate={onNavigate}
        collapsed={collapsed}
        onToggle={toggle}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className={cx('flex flex-col min-h-screen min-w-0 transition-[padding] duration-200', collapsed ? 'lg:pl-[72px]' : 'lg:pl-64')}>
        <Topbar
          activePage={activePage}
          onNavigate={onNavigate}
          onOpenMenu={() => setMobileOpen(true)}
          onOpenSearch={() => setSearching(true)}
        />
        <main className="flex-1 min-w-0">
          {readError && (
            <div className="px-4 sm:px-6 lg:px-8 pt-4">
              <Notice tone="red" icon={CloudOff} action={<Button size="sm" onClick={() => window.location.reload()}>Reload</Button>}>
                Some data ({readError.name}) could not be loaded.{' '}
                {readError.code === 'permission-denied'
                  ? 'The server denied access: ask your administrator to deploy the latest Firestore rules.'
                  : 'Check your connection and reload.'}
              </Notice>
            </div>
          )}
          {children}
        </main>
      </div>
      {searching && <CommandPalette onClose={closeSearch} onNavigate={onNavigate} />}
    </div>
  );
}
