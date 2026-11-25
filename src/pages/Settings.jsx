import React, { useState } from 'react';
import { Check, DatabaseBackup, KeyRound, LogOut, Monitor, Moon, ShieldCheck, Sun, Trash2, UserCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';
import ChangePassword from '../components/ChangePassword';
import { downloadBackup, resetCrmData } from '../services/dataAdmin';
import { Button, Card, CardHeader, ConfirmDialog, IconTile, Page, PageHeader, cx, useAction, useToast } from '../components/ui';
import { canViewPage, isSuperAdmin } from '../utils/roles';

const THEMES = [
  { value: 'light', label: 'Light', icon: Sun, preview: 'bg-slate-100' },
  { value: 'dark', label: 'Dark', icon: Moon, preview: 'bg-slate-900' },
  { value: 'system', label: 'System', icon: Monitor, preview: 'bg-gradient-to-r from-slate-100 from-50% to-slate-900 to-50%' },
];

function Row({ icon, title, text, children }) {
  return (
    <div className="flex flex-wrap items-center gap-4 px-5 py-4">
      <IconTile icon={icon} tone="gray" />
      <div className="flex-1 min-w-[200px]">
        <p className="text-sm font-bold text-fg">{title}</p>
        <p className="text-xs text-fg-subtle">{text}</p>
      </div>
      {children}
    </div>
  );
}

export default function Settings({ navigate }) {
  const { user, profile, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const run = useAction();
  const toast = useToast();
  const [password, setPassword] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [backingUp, setBackingUp] = useState(false);

  const backup = async () => {
    setBackingUp(true);
    await run(async () => {
      const total = await downloadBackup();
      toast.success(`Backup downloaded (${total} records)`);
    });
    setBackingUp(false);
  };

  return (
    <Page className="!max-w-4xl">
      <PageHeader title="Settings" description="Appearance, account security and system tools." />

      <Card>
        <CardHeader title="Appearance" description="Saved on this device." />
        <div className="p-5 grid grid-cols-3 gap-3" role="radiogroup" aria-label="Theme">
          {THEMES.map((t) => {
            const on = theme === t.value;
            return (
              <button
                key={t.value}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setTheme(t.value)}
                className={cx('rounded-xl border p-3 text-left transition', on ? 'border-brand-500 ring-4 ring-brand-500/10' : 'border-line hover:border-brand-300')}
              >
                <span className={cx('block h-16 rounded-lg border border-line', t.preview)} />
                <span className="flex items-center gap-2 mt-3 text-sm font-bold text-fg">
                  <t.icon size={15} /> {t.label}
                  {on && <Check size={15} className="ml-auto text-brand-600" />}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      <Card>
        <CardHeader title="Account" description={`Signed in as ${user?.email}`} />
        <div className="divide-y divide-line">
          <Row icon={UserCircle} title="Profile" text="Your name, department and permissions.">
            <Button onClick={() => navigate('profile')}>Open profile</Button>
          </Row>
          <Row icon={KeyRound} title="Password" text="Change the password you sign in with.">
            <Button onClick={() => setPassword(true)}>Change password</Button>
          </Row>
          {canViewPage(profile, 'admin') && (
            <Row icon={ShieldCheck} title="Users & access" text="Approve accounts and manage roles.">
              <Button onClick={() => navigate('admin')}>Manage users</Button>
            </Row>
          )}
          <Row icon={LogOut} title="Sign out" text="End your session on this device.">
            <Button variant="danger-soft" onClick={logout}>Sign out</Button>
          </Row>
        </div>
      </Card>

      {isSuperAdmin(profile) && (
        <Card>
          <CardHeader title="System" description="Super Admin only." />
          <div className="divide-y divide-line">
            <Row icon={DatabaseBackup} title="Backup data" text="Download every record as a JSON file.">
              <Button icon={DatabaseBackup} loading={backingUp} onClick={backup}>Download backup</Button>
            </Row>
            <Row icon={Trash2} title="Reset CRM data" text="Permanently delete all CRM records. User accounts are kept.">
              <Button variant="danger-soft" onClick={() => setResetting(true)}>Reset data</Button>
            </Row>
          </div>
        </Card>
      )}

      {password && <ChangePassword onClose={() => setPassword(false)} />}

      {resetting && (
        <ConfirmDialog
          title="Reset all CRM data"
          message="This deletes every patient, doctor, appointment, invoice, bed, medicine and log record for everyone. It cannot be undone. A backup file is downloaded first."
          requireText="DELETE"
          confirmLabel="Delete everything"
          successMessage="All CRM data was deleted"
          onConfirm={async () => {
            await downloadBackup();
            await resetCrmData();
          }}
          onClose={() => setResetting(false)}
        />
      )}
    </Page>
  );
}
