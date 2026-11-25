import React, { useState } from 'react';
import { Ban, Check, Clock, Minus, Pencil, RotateCcw, ShieldCheck, Trash2, UserCheck, Users, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCollection } from '../hooks/useCollection';
import { useParamState } from '../hooks/useParams';
import {
  Badge, Button, Card, CardHeader, ConfirmDialog, DataTable, ExportButton, FilterBar, FilterSelect, IconButton,
  Notice, Page, PageHeader, PageLoader, Person, RecordForm, SearchInput, StatCard, StatGrid, StatusBadge, Tabs, useAction,
} from '../components/ui';
import { ALL_ROLES, PAGE_ACCESS, USER_STATUS, canEditPage, canViewPage } from '../utils/roles';
import { DEPARTMENTS } from '../utils/formConfigs';
import { PAGES } from '../config/navigation';
import { exportCsv, formatDate, matches } from '../utils/format';

const { ACTIVE, PENDING, SUSPENDED } = USER_STATUS;

export default function Admin() {
  const { profile } = useAuth();
  const [tab, setTab] = useState('users');
  return (
    <Page>
      <PageHeader
        title="Users & Access"
        description="Approve accounts, assign roles and review what each role can do."
        actions={<Tabs value={tab} onChange={setTab} options={[{ value: 'users', label: 'Accounts', icon: Users }, { value: 'roles', label: 'Role permissions', icon: ShieldCheck }]} />}
      />
      {tab === 'users' ? <Accounts canEdit={canEditPage(profile, 'admin')} /> : <Permissions />}
    </Page>
  );
}

function Accounts({ canEdit }) {
  const { user } = useAuth();
  const { data: users, loading, update, updateMany, remove, removeMany, canDelete } = useCollection('users');
  const run = useAction();
  const [search, setSearch] = useParamState(undefined, 'q');
  const [status, setStatus] = useState('All');
  const [role, setRole] = useState('');
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);

  if (loading) return <PageLoader />;

  const isSelf = (u) => u.id === user?.uid;
  const count = (s) => users.filter((u) => u.status === s).length;
  const rank = (u) => (u.status === PENDING ? 0 : u.status === ACTIVE ? 1 : 2);

  const rows = users
    .filter((u) => status === 'All' || u.status === status)
    .filter((u) => !role || u.role === role)
    .filter((u) => matches(search, u.name, u.email, u.role, u.department))
    // pending approvals first, then by name
    .sort((a, b) => rank(a) - rank(b) || (a.name || '').localeCompare(b.name || ''));

  const setUserStatus = (u, next, message) => run(() => update(u.id, { status: next }), message);

  const askSuspend = (u) => setConfirm({
    title: 'Suspend account',
    message: `${u.name || u.email} will immediately lose access until reactivated.`,
    confirmLabel: 'Suspend',
    successMessage: 'Account suspended',
    action: () => update(u.id, { status: SUSPENDED }),
  });
  const askRemove = (list, clear) => setConfirm({
    title: list.length > 1 ? `Remove ${list.length} accounts` : list[0].status === PENDING ? 'Reject request' : 'Remove account',
    message: `${list.length > 1 ? 'These people' : list[0].name || list[0].email} will lose all access to MedCRM. Their sign-in still exists in Firebase Authentication; delete it there to free the email address.`,
    confirmLabel: list.length > 1 || list[0].status !== PENDING ? 'Remove' : 'Reject',
    successMessage: 'Access removed',
    action: async () => {
      if (list.length > 1) await removeMany(list.map((u) => u.id));
      else await remove(list[0].id);
      clear?.();
    },
  });

  const pending = users.filter((u) => u.status === PENDING);

  return (
    <>
      <StatGrid>
        <StatCard label="Total accounts" value={users.length} icon={Users} active={status === 'All'} onClick={() => setStatus('All')} />
        <StatCard label="Active" value={count(ACTIVE)} icon={UserCheck} tone="green" active={status === ACTIVE} onClick={() => setStatus(ACTIVE)} />
        <StatCard label="Pending approval" value={count(PENDING)} icon={Clock} tone="amber" active={status === PENDING} onClick={() => setStatus(PENDING)} />
        <StatCard label="Suspended" value={count(SUSPENDED)} icon={Ban} tone="red" active={status === SUSPENDED} onClick={() => setStatus(SUSPENDED)} />
      </StatGrid>

      {pending.length > 0 && status !== PENDING && (
        <Notice icon={Clock} action={<Button size="sm" onClick={() => setStatus(PENDING)}>Review</Button>}>
          <b>{pending.length}</b> account request(s) are waiting for your approval.
        </Notice>
      )}

      <FilterBar right={
        <ExportButton
          disabled={!rows.length}
          onClick={() => exportCsv('accounts.csv', [
            { label: 'Name', value: (u) => u.name }, { label: 'Email', value: (u) => u.email },
            { label: 'Role', value: (u) => u.role }, { label: 'Department', value: (u) => u.department },
            { label: 'Status', value: (u) => u.status }, { label: 'Created', value: (u) => u.createdAt },
          ], rows)}
        />
      }>
        <SearchInput value={search} onChange={setSearch} placeholder="Search name, email, role…" />
        <FilterSelect label="All roles" value={role} onChange={setRole} options={ALL_ROLES} />
        <Tabs value={status} onChange={setStatus} options={['All', ACTIVE, PENDING, SUSPENDED]} />
      </FilterBar>

      <DataTable
        rows={rows}
        pageSize={25}
        columns={[
          { key: 'name', header: 'User', render: (u) => (
            <div className="flex items-center gap-2">
              <Person name={u.name} sub={u.email} />
              {isSelf(u) && <Badge tone="brand">You</Badge>}
            </div>
          ) },
          { key: 'role', header: 'Role', render: (u) => (
            canEdit && !isSelf(u) ? (
              <select
                aria-label={`Role of ${u.name || u.email}`}
                value={u.role}
                onChange={(e) => {
                  const next = e.target.value;
                  setConfirm({
                    title: 'Change role',
                    message: `Change ${u.name || u.email} from ${u.role} to ${next}? Their permissions update immediately.`,
                    confirmLabel: 'Change role',
                    successMessage: 'Role updated',
                    tone: 'primary',
                    action: () => update(u.id, { role: next }),
                  });
                }}
                className="h-8 rounded-lg border border-line bg-surface px-2 text-xs font-semibold text-fg"
              >
                {!ALL_ROLES.includes(u.role) && <option value={u.role}>{u.role || '—'}</option>}
                {ALL_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            ) : u.role
          ) },
          { key: 'department', header: 'Department', hide: 'lg' },
          { key: 'createdAt', header: 'Requested', hide: 'xl', render: (u) => formatDate(u.createdAt) },
          { key: 'status', header: 'Status', render: (u) => <StatusBadge status={u.status} /> },
        ]}
        rowActions={canEdit ? (u) => (
          <>
            {!isSelf(u) && u.status === PENDING && (
              <>
                <Button size="xs" variant="success" icon={Check} onClick={() => setUserStatus(u, ACTIVE, `${u.name || u.email} approved`)}>Approve</Button>
                <Button size="xs" variant="danger-soft" icon={X} onClick={() => askRemove([u])}>Reject</Button>
              </>
            )}
            {!isSelf(u) && u.status === ACTIVE && <IconButton label="Suspend" icon={Ban} tone="red" onClick={() => askSuspend(u)} />}
            {!isSelf(u) && u.status === SUSPENDED && <IconButton label="Reactivate" icon={RotateCcw} tone="green" onClick={() => setUserStatus(u, ACTIVE, 'Account reactivated')} />}
            <IconButton label="Edit name and department" icon={Pencil} tone="brand" onClick={() => setEditing(u)} />
            {!isSelf(u) && u.status !== PENDING && canDelete && <IconButton label="Remove account" icon={Trash2} tone="red" onClick={() => askRemove([u])} />}
          </>
        ) : undefined}
        bulkActions={canEdit ? (list, clear) => {
          const waiting = list.filter((u) => u.status === PENDING && !isSelf(u));
          const others = list.filter((u) => !isSelf(u));
          return (
            <>
              {waiting.length > 0 && (
                <Button size="sm" variant="success" icon={Check} onClick={async () => {
                  if (await run(() => updateMany(waiting.map((u) => u.id), { status: ACTIVE }), `${waiting.length} account(s) approved`)) clear();
                }}>Approve {waiting.length}</Button>
              )}
              {canDelete && others.length > 0 && <Button size="sm" variant="danger" icon={Trash2} onClick={() => askRemove(others, clear)}>Remove {others.length}</Button>}
            </>
          );
        } : undefined}
        empty={{ icon: Users, title: 'No accounts match' }}
      />

      {editing && (
        <RecordForm
          title="Edit account"
          description={editing.email}
          fields={[
            { name: 'name', label: 'Full name', required: true, full: true },
            { name: 'department', label: 'Department', type: 'combo', suggestions: DEPARTMENTS, full: true },
          ]}
          initial={editing}
          successMessage="Account updated"
          onSubmit={(v) => update(editing.id, v)}
          onClose={() => setEditing(null)}
        />
      )}

      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          message={confirm.message}
          confirmLabel={confirm.confirmLabel}
          successMessage={confirm.successMessage}
          tone={confirm.tone}
          onConfirm={confirm.action}
          onClose={() => setConfirm(null)}
        />
      )}
    </>
  );
}

// Generated from utils/roles.js, so it always matches what the app enforces.
function Permissions() {
  const pages = Object.keys(PAGE_ACCESS).filter((p) => PAGES[p]);
  return (
    <Card className="overflow-hidden">
      <CardHeader title="What each role can open" description="Server-side rules (firestore.rules) enforce the matching data permissions." />
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-subtle/60 border-b border-line">
              <th className="text-left px-5 py-3 text-2xs font-bold uppercase tracking-wider text-fg-subtle">Screen</th>
              {ALL_ROLES.map((r) => <th key={r} className="px-3 py-3 text-2xs font-bold uppercase tracking-wider text-fg-subtle whitespace-nowrap">{r}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {pages.map((p) => (
              <tr key={p} className="hover:bg-subtle/50">
                <td className="px-5 py-2.5 font-semibold text-fg whitespace-nowrap">{PAGES[p].label}</td>
                {ALL_ROLES.map((r) => {
                  const allowed = canViewPage({ role: r, status: ACTIVE }, p);
                  return (
                    <td key={r} className="px-3 py-2.5 text-center">
                      {allowed
                        ? <Check size={16} className="inline text-emerald-600" aria-label="Allowed" />
                        : <Minus size={14} className="inline text-fg-subtle opacity-50" aria-label="Not allowed" />}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
