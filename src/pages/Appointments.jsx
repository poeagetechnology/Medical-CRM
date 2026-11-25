import React, { useState } from 'react';
import { Ban, CalendarCheck, CalendarClock, CalendarPlus, CheckCircle2, Clock, Download, LayoutList, LogIn, Pencil, Plus, Receipt, Rows3, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCreateIntent, useParamState } from '../hooks/useParams';
import { useAppointmentActions } from '../hooks/useWorkflows';
import { AppointmentForm, BillForm } from '../components/editors';
import {
  Badge, Button, Card, ConfirmDialog, DataTable, DateNav, ExportButton, FilterBar, FilterSelect,
  IconButton, Page, PageHeader, PageLoader, Person, SearchInput, StatCard, StatGrid, StatusBadge, Tabs,
  useAction, cx,
} from '../components/ui';
import { canEditPage, canWriteCollection } from '../utils/roles';
import { APPOINTMENT_STATUSES, TIME_SLOTS } from '../utils/formConfigs';
import { exportCsv, formatDate, formatTime, matches, todayISO, uniqueNames } from '../utils/format';

const CSV = [
  { label: 'Patient', value: (a) => a.patient },
  { label: 'Doctor', value: (a) => a.doctor },
  { label: 'Date', value: (a) => a.date },
  { label: 'Time', value: (a) => a.time },
  { label: 'Type', value: (a) => a.type },
  { label: 'Status', value: (a) => a.status },
  { label: 'Reason', value: (a) => a.reason },
];

// Hour of "09:30" or "2:00 PM" (24h), or null.
const hourOf = (time) => {
  const m = String(time || '').match(/^(\d{1,2})/);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  if (/pm/i.test(time) && h < 12) h += 12;
  if (/am/i.test(time) && h === 12) h = 0;
  return h;
};
const HOURS = [...new Set(TIME_SLOTS.map(hourOf))];
const pad = (n) => String(n).padStart(2, '0');

export default function Appointments({ navigate, params }) {
  const { profile } = useAuth();
  const canEdit = canEditPage(profile, 'appointments');
  const store = useAppointmentActions();
  const { data: appointments, loading, canDelete } = store;
  const run = useAction();

  const [view, setView] = useParamState(params, 'view', 'day');
  const [date, setDate] = useState(todayISO());
  const [search, setSearch] = useParamState(params, 'q');
  const [status, setStatus] = useState('All');
  const [doctor, setDoctor] = useState('');
  const [editing, setEditing] = useState(null);
  const [billing, setBilling] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useCreateIntent({ params, navigate, page: 'appointments', allowed: canEdit, open: () => setEditing({}) });

  if (loading) return <PageLoader />;

  const today = todayISO();
  const filtered = appointments
    .filter((a) => status === 'All' || a.status === status)
    .filter((a) => !doctor || a.doctor === doctor)
    .filter((a) => matches(search, a.patient, a.doctor, a.reason, a.type));
  const dayList = filtered
    .filter((a) => a.date === date)
    .sort((a, b) => String(a.time).localeCompare(String(b.time)));
  const shown = view === 'day' ? dayList : filtered;
  const canBill = canWriteCollection(profile, 'billing');
  const active = (a) => a.status === 'Scheduled' || a.status === 'Pending';

  const actions = (a) => (
    <>
      {canEdit && store.isCheckInDue(a) && (
        <IconButton label="Check in to OP queue" icon={LogIn} tone="brand" onClick={() => run(() => store.checkIn(a), `${a.patient} checked in`)} />
      )}
      {canEdit && active(a) && (
        <>
          <IconButton label="Mark completed" icon={CheckCircle2} tone="green" onClick={() => run(() => store.setStatus(a, 'Completed'), 'Appointment completed')} />
          <IconButton label="Cancel appointment" icon={Ban} tone="red" onClick={() => run(() => store.setStatus(a, 'Cancelled'), 'Appointment cancelled')} />
        </>
      )}
      {canBill && a.status === 'Completed' && (
        <IconButton label="Create invoice" icon={Receipt} tone="brand" onClick={() => setBilling({ patient: a.patient, service: 'Consultation' })} />
      )}
      {canEdit && <IconButton label="Edit" icon={Pencil} tone="brand" onClick={() => setEditing(a)} />}
      {canEdit && canDelete && <IconButton label="Delete" icon={Trash2} tone="red" onClick={() => setDeleting({ rows: [a] })} />}
    </>
  );

  const slotRow = (a) => (
    <div key={a.id} className={cx('flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-line bg-surface px-3 py-2.5', a.status === 'Cancelled' && 'opacity-60')}>
      <span className="w-16 text-xs font-bold text-fg tabular">{formatTime(a.time)}</span>
      <div className="flex-1 min-w-[180px]"><Person name={a.patient} sub={[a.doctor, a.reason].filter(Boolean).join(' · ')} size={32} /></div>
      {a.type && <Badge className="hidden md:inline-flex">{a.type}</Badge>}
      {a.checkedIn && a.status !== 'Completed' && <Badge tone="violet">Checked in</Badge>}
      <StatusBadge status={a.status} />
      <div className="flex items-center gap-0.5 ml-auto">{actions(a)}</div>
    </div>
  );

  // Appointments whose time falls outside the displayed hours (legacy data).
  const unscheduled = dayList.filter((a) => !HOURS.includes(hourOf(a.time)));

  return (
    <Page>
      <PageHeader
        title="Appointments"
        description="Book, check in and track patient visits."
        actions={
          <>
            <ExportButton onClick={() => exportCsv('appointments.csv', CSV, shown)} disabled={!shown.length} />
            {canEdit && <Button variant="primary" icon={CalendarPlus} onClick={() => setEditing(view === 'day' ? { date } : {})}>Book appointment</Button>}
          </>
        }
      />

      <StatGrid>
        <StatCard label="Today" value={appointments.filter((a) => a.date === today && a.status !== 'Cancelled').length} icon={CalendarClock} />
        <StatCard label="Upcoming" value={appointments.filter((a) => a.date > today && active(a)).length} icon={Clock} tone="violet" />
        <StatCard label="Completed" value={appointments.filter((a) => a.status === 'Completed').length} icon={CheckCircle2} tone="green" />
        <StatCard label="Awaiting confirmation" value={appointments.filter((a) => a.status === 'Pending').length} icon={CalendarCheck} tone="amber" />
      </StatGrid>

      <FilterBar
        right={<Tabs value={view} onChange={setView} options={[{ value: 'day', label: 'Day view', icon: Rows3 }, { value: 'list', label: 'All appointments', icon: LayoutList }]} />}
      >
        <SearchInput value={search} onChange={setSearch} placeholder="Search patient, doctor, reason…" />
        <FilterSelect label="All doctors" value={doctor} onChange={setDoctor} options={uniqueNames(appointments, 'doctor')} />
        <Tabs value={status} onChange={setStatus} options={['All', ...APPOINTMENT_STATUSES]} />
      </FilterBar>

      {view === 'day' ? (
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-line">
            <div>
              <p className="text-sm font-bold text-fg">{formatDate(date, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
              <p className="text-xs text-fg-subtle">{dayList.length} appointment(s)</p>
            </div>
            <DateNav value={date} onChange={setDate} />
          </div>
          <div className="divide-y divide-line">
            {HOURS.map((hour) => {
              const list = dayList.filter((a) => hourOf(a.time) === hour);
              return (
                <div key={hour} className="flex group">
                  <div className="w-16 sm:w-24 flex-shrink-0 px-3 sm:px-4 py-3 text-xs font-semibold text-fg-subtle border-r border-line tabular">
                    {formatTime(`${pad(hour)}:00`)}
                  </div>
                  <div className="flex-1 p-2 space-y-2 min-w-0 min-h-[52px]">
                    {list.map(slotRow)}
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => setEditing({ date, time: `${pad(hour)}:${list.some((a) => a.time === `${pad(hour)}:00`) ? '30' : '00'}` })}
                        className={cx(
                          'flex items-center gap-1.5 w-full h-8 px-3 rounded-lg text-xs font-semibold text-brand-600 border border-dashed border-brand-300/60 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-opacity',
                          'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
                          list.length > 0 && 'hidden group-hover:flex'
                        )}
                      >
                        <Plus size={13} /> Book this hour
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {unscheduled.length > 0 && (
              <div className="flex">
                <div className="w-16 sm:w-24 flex-shrink-0 px-3 sm:px-4 py-3 text-xs font-semibold text-fg-subtle border-r border-line">Other</div>
                <div className="flex-1 p-2 space-y-2 min-w-0">{unscheduled.map(slotRow)}</div>
              </div>
            )}
          </div>
        </Card>
      ) : (
        <DataTable
          rows={filtered}
          initialSort={{ key: 'date', dir: -1 }}
          columns={[
            { key: 'patient', header: 'Patient', render: (a) => <Person name={a.patient} sub={a.reason} size={32} /> },
            { key: 'doctor', header: 'Doctor', hide: 'md' },
            { key: 'date', header: 'When', sortValue: (a) => `${a.date} ${a.time}`, render: (a) => <span className="whitespace-nowrap"><b className="text-fg">{formatDate(a.date)}</b> · {formatTime(a.time)}</span> },
            { key: 'type', header: 'Type', hide: 'xl' },
            { key: 'status', header: 'Status', render: (a) => <StatusBadge status={a.status} /> },
          ]}
          rowActions={actions}
          bulkActions={(list) => <Button size="sm" icon={Download} onClick={() => exportCsv('appointments-selected.csv', CSV, list)}>Export</Button>}
          onBulkDelete={canEdit && canDelete ? (list, clear) => setDeleting({ rows: list, clear }) : undefined}
          empty={{ icon: CalendarClock, title: appointments.length ? 'No appointments match your filters' : 'No appointments yet' }}
        />
      )}

      {canEdit && editing && <AppointmentForm record={editing} onClose={() => setEditing(null)} />}
      {billing && <BillForm record={billing} onClose={() => setBilling(null)} />}
      {deleting && (
        <ConfirmDialog
          title={deleting.rows.length > 1 ? `Delete ${deleting.rows.length} appointments` : 'Delete appointment'}
          message={deleting.rows.length > 1 ? 'The selected appointments will be permanently deleted.' : `Delete ${deleting.rows[0].patient}'s appointment with ${deleting.rows[0].doctor}?`}
          onConfirm={async () => {
            await store.removeMany(deleting.rows.map((a) => a.id));
            deleting.clear?.();
          }}
          onClose={() => setDeleting(null)}
        />
      )}
    </Page>
  );
}
