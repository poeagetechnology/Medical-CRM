import React, { useState } from 'react';
import { CalendarPlus, CheckCircle2, Eye, LayoutGrid, LayoutList, Pencil, Phone, Mail, Scissors, Stethoscope, Trash2, UserPlus, Users, Plane } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCollection } from '../hooks/useCollection';
import { useActivityLog } from '../hooks/useActivityLog';
import { useCreateIntent, useParamState } from '../hooks/useParams';
import { AppointmentForm, DoctorForm } from '../components/editors';
import {
  Badge, Button, Card, ConfirmDialog, DataTable, DefinitionList, Drawer, EmptyState, ExportButton, FilterBar,
  FilterSelect, IconButton, Modal, Page, PageHeader, PageLoader, Person, SearchInput, StatCard, StatGrid,
  StatusBadge, Tabs, useAction,
} from '../components/ui';
import { canReadCollection, canWriteCollection } from '../utils/roles';
import { DOCTOR_STATUSES } from '../utils/formConfigs';
import { exportCsv, formatDate, formatMoney, formatTime, matches, sameText, todayISO, uniqueNames } from '../utils/format';

const years = (v) => (v || v === 0 ? (String(v).match(/[a-z]/i) ? v : `${v} yrs`) : '');

export default function Doctors({ navigate, params }) {
  const { profile } = useAuth();
  const store = useCollection('doctors');
  const { data: doctors, loading, update, remove, removeMany, canWrite, canDelete } = store;
  const queue = useCollection('opPatients');
  const { data: appointments } = useCollection('appointments');
  const { data: surgeries } = useCollection('surgeries');
  const log = useActivityLog();
  const run = useAction();

  const [view, setView] = useState('grid');
  const [search, setSearch] = useParamState(params, 'q');
  const [status, setStatus] = useState('All');
  const [dept, setDept] = useState('');
  const [editing, setEditing] = useState(null);
  const [booking, setBooking] = useState(null);
  const [viewingId, setViewingId] = useState(null);
  const [assigningId, setAssigningId] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useCreateIntent({ params, navigate, page: 'doctors', allowed: canWrite, open: () => setEditing({}) });

  if (loading) return <PageLoader />;

  const today = todayISO();
  const rows = doctors
    .filter((d) => status === 'All' || d.status === status)
    .filter((d) => !dept || d.dept === dept)
    .filter((d) => matches(search, d.name, d.dept, d.specialization));

  const queueOf = (d) => queue.data.filter((q) => sameText(q.doctor, d.name) && q.status !== 'Completed');
  const todayOf = (d) => appointments
    .filter((a) => sameText(a.doctor, d.name) && a.date === today && a.status !== 'Cancelled')
    .sort((a, b) => String(a.time).localeCompare(String(b.time)));
  const count = (s) => doctors.filter((d) => d.status === s).length;

  const viewing = doctors.find((d) => d.id === viewingId);
  const assigning = doctors.find((d) => d.id === assigningId);
  const canBook = canWriteCollection(profile, 'appointments');

  const assign = async (patient) => {
    const ok = await run(async () => {
      await queue.update(patient.id, { doctor: assigning.name });
      log(patient.name, `Assigned to ${assigning.name}`);
    }, `${patient.name} assigned to ${assigning.name}`);
    if (ok) setAssigningId(null);
  };

  const statusPicker = (d) =>
    canWrite ? (
      <select
        aria-label={`Status of ${d.name}`}
        value={d.status || ''}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => run(() => update(d.id, { status: e.target.value }), `${d.name} is now ${e.target.value}`)}
        className="h-7 rounded-md border border-line bg-surface px-2 text-xs font-semibold text-fg"
      >
        {!DOCTOR_STATUSES.includes(d.status) && <option value={d.status || ''}>{d.status || 'Unknown'}</option>}
        {DOCTOR_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
    ) : <StatusBadge status={d.status} />;

  const actions = (d) => (
    <>
      <IconButton label="View schedule" icon={Eye} onClick={() => setViewingId(d.id)} />
      {queue.canWrite && <IconButton label="Assign patient" icon={UserPlus} tone="brand" onClick={() => setAssigningId(d.id)} />}
      {canBook && <IconButton label="Book appointment" icon={CalendarPlus} tone="brand" onClick={() => setBooking({ doctor: d.name })} />}
      {canWrite && <IconButton label="Edit" icon={Pencil} tone="brand" onClick={() => setEditing(d)} />}
      {canDelete && <IconButton label="Delete" icon={Trash2} tone="red" onClick={() => setDeleting({ rows: [d] })} />}
    </>
  );

  return (
    <Page>
      <PageHeader
        title="Doctors"
        description="Directory, availability and daily workload."
        actions={
          <>
            <ExportButton
              disabled={!rows.length}
              onClick={() => exportCsv('doctors.csv', [
                { label: 'Name', value: (d) => d.name },
                { label: 'Department', value: (d) => d.dept },
                { label: 'Specialization', value: (d) => d.specialization },
                { label: 'Experience', value: (d) => d.experience },
                { label: 'Phone', value: (d) => d.phone },
                { label: 'Email', value: (d) => d.email },
                { label: 'Fee', value: (d) => d.fee },
                { label: 'Status', value: (d) => d.status },
              ], rows)}
            />
            {canWrite && <Button variant="primary" icon={Stethoscope} onClick={() => setEditing({})}>Add doctor</Button>}
          </>
        }
      />

      <StatGrid>
        <StatCard label="Total doctors" value={doctors.length} icon={Users} active={status === 'All'} onClick={() => setStatus('All')} />
        <StatCard label="Available" value={count('Available')} icon={CheckCircle2} tone="green" active={status === 'Available'} onClick={() => setStatus('Available')} />
        <StatCard label="In surgery" value={count('In Surgery')} icon={Scissors} tone="red" active={status === 'In Surgery'} onClick={() => setStatus('In Surgery')} />
        <StatCard label="On leave" value={count('On Leave')} icon={Plane} tone="amber" active={status === 'On Leave'} onClick={() => setStatus('On Leave')} />
      </StatGrid>

      <FilterBar right={<Tabs value={view} onChange={setView} options={[{ value: 'grid', label: 'Cards', icon: LayoutGrid }, { value: 'table', label: 'Table', icon: LayoutList }]} />}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search name or specialty…" />
        <FilterSelect label="All departments" value={dept} onChange={setDept} options={uniqueNames(doctors, 'dept')} />
        <Tabs value={status} onChange={setStatus} options={['All', ...DOCTOR_STATUSES]} />
      </FilterBar>

      {view === 'table' ? (
        <DataTable
          rows={rows}
          initialSort={{ key: 'name', dir: 1 }}
          onRowClick={(d) => setViewingId(d.id)}
          columns={[
            { key: 'name', header: 'Doctor', render: (d) => <Person name={d.name} sub={d.specialization || d.email} /> },
            { key: 'dept', header: 'Department', hide: 'md' },
            { key: 'experience', header: 'Experience', hide: 'lg', sortValue: (d) => parseInt(d.experience, 10) || 0, render: (d) => years(d.experience) || '—' },
            { key: 'queue', header: 'In queue', hide: 'lg', align: 'center', sortValue: (d) => queueOf(d).length, render: (d) => queueOf(d).length },
            { key: 'status', header: 'Status', render: statusPicker },
          ]}
          rowActions={actions}
          onBulkDelete={canDelete ? (list, clear) => setDeleting({ rows: list, clear }) : undefined}
          empty={{ icon: Stethoscope, title: doctors.length ? 'No doctors match your filters' : 'No doctors added yet' }}
        />
      ) : rows.length === 0 ? (
        <Card>
          <EmptyState
            icon={Stethoscope}
            title={doctors.length ? 'No doctors match your filters' : 'No doctors added yet'}
            action={!doctors.length && canWrite && <Button variant="primary" onClick={() => setEditing({})}>Add first doctor</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {rows.map((d) => (
            <Card key={d.id} className="p-5 flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <button type="button" onClick={() => setViewingId(d.id)} className="min-w-0 text-left">
                  <Person name={d.name} sub={d.specialization || d.dept} size={44} />
                </button>
                {statusPicker(d)}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-4">
                {d.dept && <Badge tone="brand">{d.dept}</Badge>}
                {years(d.experience) && <Badge>{years(d.experience)}</Badge>}
                {(d.fee || d.fee === 0) && d.fee !== '' && <Badge>{formatMoney(d.fee)} fee</Badge>}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4 text-center">
                <div className="rounded-lg bg-subtle py-2">
                  <p className="text-lg font-extrabold text-fg tabular">{todayOf(d).length}</p>
                  <p className="text-2xs text-fg-subtle">Appointments today</p>
                </div>
                <div className="rounded-lg bg-subtle py-2">
                  <p className="text-lg font-extrabold text-fg tabular">{queueOf(d).length}</p>
                  <p className="text-2xs text-fg-subtle">In OP queue</p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-line">
                <span className="flex gap-1">
                  {d.phone && <a href={`tel:${d.phone}`} title={d.phone} aria-label={`Call ${d.name}`} className="w-8 h-8 rounded-lg flex items-center justify-center text-fg-subtle hover:bg-subtle hover:text-fg"><Phone size={15} /></a>}
                  {d.email && <a href={`mailto:${d.email}`} title={d.email} aria-label={`Email ${d.name}`} className="w-8 h-8 rounded-lg flex items-center justify-center text-fg-subtle hover:bg-subtle hover:text-fg"><Mail size={15} /></a>}
                </span>
                <span className="flex items-center">{actions(d)}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {viewing && (
        <Drawer
          title={viewing.name}
          description={viewing.dept}
          onClose={() => setViewingId(null)}
          footer={
            <>
              {canDelete && <Button variant="danger-soft" icon={Trash2} className="mr-auto" onClick={() => setDeleting({ rows: [viewing] })}>Delete</Button>}
              {canWrite && <Button icon={Pencil} onClick={() => setEditing(viewing)}>Edit</Button>}
              {canBook && <Button variant="primary" icon={CalendarPlus} onClick={() => setBooking({ doctor: viewing.name })}>Book</Button>}
            </>
          }
        >
          <DefinitionList items={[
            ['Status', <StatusBadge status={viewing.status} />], ['Department', viewing.dept],
            ['Specialization', viewing.specialization], ['Experience', years(viewing.experience)],
            ['Phone', viewing.phone], ['Email', viewing.email],
          ]} />

          <Section title={`Today's appointments (${todayOf(viewing).length})`}>
            {todayOf(viewing).map((a) => <Line key={a.id} left={`${formatTime(a.time)} · ${a.patient}`} right={<StatusBadge status={a.status} />} />)}
          </Section>
          <Section title={`OP queue (${queueOf(viewing).length})`}>
            {queueOf(viewing).map((q) => <Line key={q.id} left={`${q.token} · ${q.name}`} right={<StatusBadge status={q.status} />} />)}
          </Section>
          {canReadCollection(profile, 'surgeries') && (
            <Section title="Upcoming surgeries">
              {surgeries
                .filter((s) => sameText(s.doctor, viewing.name) && s.date >= today && s.status !== 'Cancelled' && s.status !== 'Completed')
                .map((s) => <Line key={s.id} left={`${formatDate(s.date, { month: 'short', day: 'numeric' })} · ${s.type}`} right={s.room} />)}
            </Section>
          )}
        </Drawer>
      )}

      {assigning && (
        <Modal title={`Assign a patient to ${assigning.name}`} description="Waiting patients in the OP queue" onClose={() => setAssigningId(null)}>
          {queue.data.filter((q) => q.status === 'Waiting' && !sameText(q.doctor, assigning.name)).length === 0 ? (
            <EmptyState compact title="No other patients are waiting" description="Issue a token from the OP Queue to add someone." />
          ) : (
            <ul className="space-y-2">
              {queue.data.filter((q) => q.status === 'Waiting' && !sameText(q.doctor, assigning.name)).map((q) => (
                <li key={q.id}>
                  <button type="button" onClick={() => assign(q)} className="flex w-full items-center justify-between gap-3 px-4 py-3 rounded-lg border border-line text-left hover:border-brand-400 hover:bg-brand-50/50 dark:hover:bg-brand-500/10">
                    <span className="text-sm text-fg"><b className="font-mono text-brand-600">{q.token}</b> · {q.name}</span>
                    <span className="text-xs text-fg-subtle">{q.doctor ? `Now: ${q.doctor}` : 'Unassigned'}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Modal>
      )}

      {editing && <DoctorForm record={editing} onClose={() => setEditing(null)} />}
      {booking && <AppointmentForm record={booking} onClose={() => setBooking(null)} />}
      {deleting && (
        <ConfirmDialog
          title={deleting.rows.length > 1 ? `Delete ${deleting.rows.length} doctors` : 'Delete doctor'}
          message={`${deleting.rows.length > 1 ? 'The selected doctors' : deleting.rows[0].name} will be removed from the directory. Existing appointments and patient records keep the name.`}
          onConfirm={async () => {
            if (deleting.rows.length > 1) await removeMany(deleting.rows.map((d) => d.id));
            else await remove(deleting.rows[0].id);
            deleting.clear?.();
            setViewingId(null);
          }}
          onClose={() => setDeleting(null)}
        />
      )}
    </Page>
  );
}

function Section({ title, children }) {
  const empty = React.Children.count(children) === 0;
  return (
    <div className="mt-6">
      <p className="label">{title}</p>
      {empty ? <p className="text-sm text-fg-subtle">Nothing scheduled.</p> : <ul className="divide-y divide-line rounded-lg border border-line">{children}</ul>}
    </div>
  );
}

function Line({ left, right }) {
  return (
    <li className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
      <span className="text-fg truncate">{left}</span>
      <span className="text-xs text-fg-subtle flex-shrink-0">{right}</span>
    </li>
  );
}
