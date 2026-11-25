import React, { useState } from 'react';
import { Activity, Check, KeyRound, Pencil } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCollection } from '../hooks/useCollection';
import ChangePassword from '../components/ChangePassword';
import { Avatar, Badge, Button, Card, CardHeader, DefinitionList, EmptyState, Page, PageHeader, RecordForm, StatusBadge } from '../components/ui';
import { SECTIONS } from '../config/navigation';
import { canViewPage } from '../utils/roles';
import { DEPARTMENTS } from '../utils/formConfigs';
import { byNewest, formatDate } from '../utils/format';

export default function Profile({ navigate }) {
  const { user, profile, updateOwnProfile } = useAuth();
  const { data: activity } = useCollection('activityLogs');
  const [editing, setEditing] = useState(false);
  const [password, setPassword] = useState(false);

  const name = profile?.name || user?.displayName || 'User';
  const mine = activity.filter((l) => l.createdBy === user?.uid).sort(byNewest).slice(0, 8);
  const screens = SECTIONS.flatMap((s) => s.items).filter((i) => canViewPage(profile, i.id));

  return (
    <Page className="!max-w-5xl">
      <PageHeader
        title="My Profile"
        description="Your account details and recent work."
        actions={
          <>
            <Button icon={KeyRound} onClick={() => setPassword(true)}>Change password</Button>
            <Button variant="primary" icon={Pencil} onClick={() => setEditing(true)}>Edit profile</Button>
          </>
        }
      />

      <Card className="overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-[#0b1220] via-brand-900 to-brand-600" />
        <div className="px-6 pb-6">
          <div className="flex flex-wrap items-end gap-4 -mt-8">
            <Avatar name={name} size={72} className="ring-4 ring-surface" />
            <div className="flex-1 min-w-0 pb-1">
              <h2 className="text-xl font-extrabold text-fg truncate">{name}</h2>
              <p className="text-sm text-fg-subtle truncate">{user?.email}</p>
            </div>
            <div className="flex gap-2 pb-2">
              <Badge tone="brand">{profile?.role}</Badge>
              <StatusBadge status={profile?.status} />
            </div>
          </div>
          <div className="mt-6">
            <DefinitionList columns={3} items={[
              ['Full name', name],
              ['Email', user?.email],
              ['Department', profile?.department],
              ['Role', profile?.role],
              ['Member since', profile?.createdAt ? formatDate(profile.createdAt) : ''],
              ['User ID', <span className="font-mono text-xs break-all">{user?.uid}</span>],
            ]} />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <Card>
          <CardHeader title="My access" description={`${screens.length} screens available to your role`} />
          <div className="p-4 grid grid-cols-2 gap-2">
            {screens.map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" onClick={() => navigate(id)} className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-line text-left text-xs font-semibold text-fg-muted hover:border-brand-300 hover:text-brand-600">
                <Icon size={15} /> <span className="truncate flex-1">{label}</span> <Check size={13} className="text-emerald-500" />
              </button>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader title="My recent activity" />
          {mine.length === 0 ? <EmptyState icon={Activity} title="No activity yet" /> : (
            <ul className="divide-y divide-line">
              {mine.map((l) => (
                <li key={l.id} className="px-5 py-3">
                  <p className="text-sm text-fg"><b>{l.patient}</b> — {l.text}</p>
                  <p className="text-2xs text-fg-subtle mt-0.5">{l.time}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {editing && (
        <RecordForm
          width="max-w-md"
          title="Edit profile"
          description="Role and email are managed by your administrator."
          fields={[
            { name: 'name', label: 'Full name', required: true, full: true },
            { name: 'department', label: 'Department', type: 'combo', suggestions: DEPARTMENTS, full: true },
          ]}
          initial={profile}
          successMessage="Profile updated"
          onSubmit={updateOwnProfile}
          onClose={() => setEditing(false)}
        />
      )}
      {password && <ChangePassword onClose={() => setPassword(false)} />}
    </Page>
  );
}
