import React from 'react';
import { Ban, Clock, Lock, LogOut, ShieldAlert, UserX } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { USER_STATUS } from '../utils/roles';
import { Button, EmptyState, IconTile } from './ui';

// Full-screen notice shown to signed-in users who may not use the app yet
// (awaiting approval, suspended, or without a profile record).
export function AccountBlocked({ profile, profileError }) {
  const { user, logout } = useAuth();

  let Icon = UserX;
  let tone = 'gray';
  let title = 'Account not set up';
  let message =
    'Your sign-in works, but no staff profile exists for this account. Please contact your administrator.';

  if (profileError) {
    Icon = ShieldAlert;
    tone = 'red';
    title = 'Unable to load your profile';
    message =
      profileError.code === 'permission-denied'
        ? 'Access to your profile was denied by the server. Ask your administrator to check the Firestore security rules.'
        : 'We could not load your profile. Check your connection and try again.';
  } else if (profile?.status === USER_STATUS.PENDING) {
    Icon = Clock;
    tone = 'amber';
    title = 'Waiting for approval';
    message = `Your ${profile.role} account has been created and is waiting for a Super Admin to approve it. You will get access automatically as soon as it is approved.`;
  } else if (profile?.status === USER_STATUS.SUSPENDED) {
    Icon = Ban;
    tone = 'red';
    title = 'Account suspended';
    message = 'Your account has been suspended. Please contact your administrator to restore access.';
  } else if (profile) {
    title = 'Account unavailable';
    message = 'Your account role or status is not recognised. Please contact your administrator.';
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas px-4">
      <div className="card w-full max-w-md p-8 text-center">
        <div className="flex justify-center mb-4"><IconTile icon={Icon} tone={tone} size={56} /></div>
        <h1 className="text-xl font-extrabold text-fg">{title}</h1>
        <p className="text-sm text-fg-muted mt-2 leading-relaxed">{message}</p>
        {user?.email && <p className="text-xs text-fg-subtle mt-4">Signed in as {user.email}</p>}
        <Button variant="primary" size="lg" icon={LogOut} onClick={logout} className="mt-6 w-full">Sign out</Button>
      </div>
    </div>
  );
}

// Shown inside the layout when a role opens a page it is not allowed to see.
export function AccessDenied({ role, onBack }) {
  return (
    <div className="p-8">
      <div className="card">
        <EmptyState
          icon={Lock}
          title="Access denied"
          description={`Your role${role ? ` (${role})` : ''} does not have permission to view this page.`}
          action={onBack && <Button variant="primary" onClick={onBack}>Back to Dashboard</Button>}
        />
      </div>
    </div>
  );
}
