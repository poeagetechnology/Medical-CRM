import React, { useState } from 'react';
import { Download, Moon, Pencil, Plane, Trash2, UserCheck, UserPlus, Users, UsersRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCollection } from '../hooks/useCollection';
import { useCreateIntent, useParamState } from '../hooks/useParams';
import EntityEditor from '../components/editors/EntityEditor';
import {
  Badge, Button, ConfirmDialog, DataTable, ExportButton, FilterBar, FilterSelect, IconButton, Page, PageHeader,
  PageLoader, Person, SearchInput, StatCard, StatGrid, StatusBadge, Tabs, useAction,
} from '../components/ui';
import { canEditPage } from '../utils/roles';
import { SHIFTS, STAFF_STATUSES, staffFields } from '../utils/formConfigs';
import { exportCsv, formatDate, matches, uniqueNames } from '../utils/format';

const CSV = [
  { label: 'Name', value: (s) => s.name },
  { label: 'Role', value: (s) => s.role },
  { label: 'Department', value: (s) => s.dept },
  { label: 'Shift', value: (s) => s.shift },
  { label: 'Phone', value: (s) => s.phone },
  { label: 'Email', value: (s) => s.email },
  { label: 'Joined', value: (s) => s.joined },
  { label: 'Status', value: (s) => s.status },
];
const SHIFT_TONE = { Morning: 'amber', Evening: 'violet', Night: 'blue' };

export default function Staff({ navigate, params }) {
  const { profile } = useAuth();
  const canEdit = canEditPage(profile, 'staff');
  const store = useCollection('staff');
  const { data: staff, loading, update, updateMany, remove, removeMany, canDelete } = store;
  const run = useAction();

  const [search, setSearch] = useParamState(params, 'q');
  const [status, setStatus] = useState('All');
  const [shift, setShift] = useState('');
  const [dept, setDept] = useState('');
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useCreateIntent({ params, navigate, page: 'staff', allowed: canEdit, open: () => setEditing({}) });

  if (loading) return <PageLoader />;

  const rows = staff
    .filter((s) => status === 'All' || s.status === status)
    .filter((s) => !shift || s.shift === shift)
    .filter((s) => !dept || s.dept === dept)
    .filter((s) => matches(search, s.name, s.role, s.dept, s.phone, s.email));
  const count = (st) => staff.filter((s) => s.status === st).length;

  return (
    <Page>
      <PageHeader
        title="Staff"
        description="Employee directory, shifts and availability."
        actions={
          <>
            <ExportButton onClick={() => exportCsv('staff.csv', CSV, rows)} disabled={!rows.length} />
            {canEdit && <Button variant="primary" icon={UserPlus} onClick={() => setEditing({})}>Add staff</Button>}
          </>
        }
      />

      <StatGrid>
        <StatCard label="Total staff" value={staff.length} icon={Users} active={status === 'All'} onClick={() => setStatus('All')} />
        <StatCard label="Active" value={count('Active')} icon={UserCheck} tone="green" active={status === 'Active'} onClick={() => setStatus('Active')} />
        <StatCard label="On leave" value={count('On Leave')} icon={Plane} tone="amber" active={status === 'On Leave'} onClick={() => setStatus('On Leave')} />
        <StatCard label="Night shift" value={staff.filter((s) => s.shift === 'Night' && s.status === 'Active').length} icon={Moon} tone="violet" />
      </StatGrid>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search name, role, department…" />
        <FilterSelect label="All departments" value={dept} onChange={setDept} options={uniqueNames(staff, 'dept')} />
        <FilterSelect label="All shifts" value={shift} onChange={setShift} options={SHIFTS} />
        <Tabs value={status} onChange={setStatus} options={['All', ...STAFF_STATUSES]} />
      </FilterBar>

      <DataTable
        rows={rows}
        initialSort={{ key: 'name', dir: 1 }}
        columns={[
          { key: 'name', header: 'Employee', render: (s) => <Person name={s.name} sub={s.email || s.phone} /> },
          { key: 'role', header: 'Role', render: (s) => <span className="font-semibold text-fg">{s.role}</span> },
          { key: 'dept', header: 'Department', hide: 'md' },
          { key: 'shift', header: 'Shift', hide: 'lg', render: (s) => (s.shift ? <Badge tone={SHIFT_TONE[s.shift]}>{s.shift}</Badge> : '—') },
          { key: 'joined', header: 'Joined', hide: 'xl', render: (s) => (s.joined ? formatDate(s.joined) : '—') },
          { key: 'status', header: 'Status', render: (s) => <StatusBadge status={s.status} /> },
        ]}
        rowActions={(s) => (
          <>
            {canEdit && s.status === 'Active' && <IconButton label="Mark on leave" icon={Plane} onClick={() => run(() => update(s.id, { status: 'On Leave' }), `${s.name} marked on leave`)} />}
            {canEdit && s.status !== 'Active' && <IconButton label="Mark active" icon={UserCheck} tone="green" onClick={() => run(() => update(s.id, { status: 'Active' }), `${s.name} is active`)} />}
            {canEdit && <IconButton label="Edit" icon={Pencil} tone="brand" onClick={() => setEditing(s)} />}
            {canDelete && <IconButton label="Delete" icon={Trash2} tone="red" onClick={() => setDeleting({ rows: [s] })} />}
          </>
        )}
        bulkActions={(list, clear) => (
          <>
            <Button size="sm" icon={Download} onClick={() => exportCsv('staff-selected.csv', CSV, list)}>Export</Button>
            {canEdit && SHIFTS.map((sh) => (
              <Button key={sh} size="sm" onClick={async () => {
                if (await run(() => updateMany(list.map((s) => s.id), { shift: sh }), `${list.length} moved to ${sh} shift`)) clear();
              }}>{sh}</Button>
            ))}
          </>
        )}
        onBulkDelete={canDelete ? (list, clear) => setDeleting({ rows: list, clear }) : undefined}
        empty={{ icon: UsersRound, title: staff.length ? 'No staff match your filters' : 'No staff records yet' }}
      />

      {canEdit && editing && (
        <EntityEditor noun="Staff member" record={editing} store={store} fields={staffFields()} onClose={() => setEditing(null)} />
      )}

      {deleting && (
        <ConfirmDialog
          title={deleting.rows.length > 1 ? `Remove ${deleting.rows.length} staff members` : 'Remove staff member'}
          message={deleting.rows.length > 1 ? 'The selected records will be permanently deleted.' : `Remove ${deleting.rows[0].name} from the staff list?`}
          confirmLabel="Remove"
          successMessage="Staff record removed"
          onConfirm={async () => {
            if (deleting.rows.length > 1) await removeMany(deleting.rows.map((s) => s.id));
            else await remove(deleting.rows[0].id);
            deleting.clear?.();
          }}
          onClose={() => setDeleting(null)}
        />
      )}
    </Page>
  );
}
