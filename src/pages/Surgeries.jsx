import React, { useState } from 'react';
import { Activity, Ban, CalendarClock, CheckCircle2, Download, LayoutList, Pencil, Play, Plus, Rows3, Scissors, Trash2 } from 'lucide-react';
import { useCreateIntent, useParamState } from '../hooks/useParams';
import { useSurgeryActions } from '../hooks/useWorkflows';
import { SurgeryForm } from '../components/editors';
import {
  Button, Card, ConfirmDialog, DataTable, DateNav, ExportButton, FilterBar, FilterSelect, IconButton, Page,
  PageHeader, PageLoader, Person, SearchInput, StatCard, StatGrid, StatusBadge, Tabs, useAction,
} from '../components/ui';
import { OT_ROOMS, SURGERY_STATUSES } from '../utils/formConfigs';
import { exportCsv, formatDate, formatTime, matches, todayISO } from '../utils/format';

const CSV = [
  { label: 'Patient', value: (s) => s.patient },
  { label: 'Procedure', value: (s) => s.type },
  { label: 'Surgeon', value: (s) => s.doctor },
  { label: 'OT Room', value: (s) => s.room },
  { label: 'Date', value: (s) => s.date },
  { label: 'Time', value: (s) => s.time },
  { label: 'Duration (h)', value: (s) => s.duration },
  { label: 'Status', value: (s) => s.status },
];

export default function Surgeries({ navigate, params }) {
  const store = useSurgeryActions();
  const { data: surgeries, loading, canWrite, canDelete } = store;
  const run = useAction();

  const [view, setView] = useState('list');
  const [date, setDate] = useState(todayISO());
  const [search, setSearch] = useParamState(params, 'q');
  const [status, setStatus] = useState('All');
  const [room, setRoom] = useState('');
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useCreateIntent({ params, navigate, page: 'surgeries', allowed: canWrite, open: () => setEditing({}) });

  if (loading) return <PageLoader />;

  const rows = surgeries
    .filter((s) => status === 'All' || s.status === status)
    .filter((s) => !room || s.room === room)
    .filter((s) => matches(search, s.patient, s.type, s.doctor, s.room));
  const count = (st) => surgeries.filter((s) => s.status === st).length;

  const actions = (s) => (
    <>
      {canWrite && s.status === 'Scheduled' && <IconButton label="Start surgery" icon={Play} tone="brand" onClick={() => run(() => store.setStatus(s, 'In Progress'), 'Surgery started')} />}
      {canWrite && s.status === 'In Progress' && <IconButton label="Complete surgery" icon={CheckCircle2} tone="green" onClick={() => run(() => store.setStatus(s, 'Completed'), 'Surgery completed')} />}
      {canWrite && s.status === 'Scheduled' && <IconButton label="Cancel surgery" icon={Ban} tone="red" onClick={() => run(() => store.setStatus(s, 'Cancelled'), 'Surgery cancelled')} />}
      {canWrite && <IconButton label="Edit" icon={Pencil} tone="brand" onClick={() => setEditing(s)} />}
      {canDelete && <IconButton label="Delete" icon={Trash2} tone="red" onClick={() => setDeleting({ rows: [s] })} />}
    </>
  );

  return (
    <Page>
      <PageHeader
        title="Surgeries"
        description="Operating theatre schedule and surgical workflow."
        actions={
          <>
            <ExportButton onClick={() => exportCsv('surgeries.csv', CSV, rows)} disabled={!rows.length} />
            {canWrite && <Button variant="primary" icon={Plus} onClick={() => setEditing(view === 'board' ? { date } : {})}>Schedule surgery</Button>}
          </>
        }
      />

      <StatGrid>
        <StatCard label="Total" value={surgeries.length} icon={Scissors} active={status === 'All'} onClick={() => setStatus('All')} />
        <StatCard label="Scheduled" value={count('Scheduled')} icon={CalendarClock} tone="blue" active={status === 'Scheduled'} onClick={() => setStatus('Scheduled')} />
        <StatCard label="In progress" value={count('In Progress')} icon={Activity} tone="violet" active={status === 'In Progress'} onClick={() => setStatus('In Progress')} />
        <StatCard label="Completed" value={count('Completed')} icon={CheckCircle2} tone="green" active={status === 'Completed'} onClick={() => setStatus('Completed')} />
      </StatGrid>

      <FilterBar right={<Tabs value={view} onChange={setView} options={[{ value: 'list', label: 'List', icon: LayoutList }, { value: 'board', label: 'Theatre board', icon: Rows3 }]} />}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search patient, procedure, surgeon…" />
        <FilterSelect label="All theatres" value={room} onChange={setRoom} options={OT_ROOMS} />
        <Tabs value={status} onChange={setStatus} options={['All', ...SURGERY_STATUSES]} />
      </FilterBar>

      {view === 'list' ? (
        <DataTable
          rows={rows}
          initialSort={{ key: 'date', dir: -1 }}
          columns={[
            { key: 'patient', header: 'Patient', render: (s) => <Person name={s.patient} size={32} /> },
            { key: 'type', header: 'Procedure', render: (s) => <span className="font-semibold text-fg">{s.type}</span> },
            { key: 'doctor', header: 'Surgeon', hide: 'lg' },
            { key: 'room', header: 'Theatre', hide: 'md' },
            { key: 'date', header: 'When', sortValue: (s) => `${s.date} ${s.time}`, render: (s) => <span className="whitespace-nowrap">{formatDate(s.date)} · {formatTime(s.time)}</span> },
            { key: 'status', header: 'Status', render: (s) => <StatusBadge status={s.status} /> },
          ]}
          rowActions={actions}
          bulkActions={(list) => <Button size="sm" icon={Download} onClick={() => exportCsv('surgeries-selected.csv', CSV, list)}>Export</Button>}
          onBulkDelete={canDelete ? (list, clear) => setDeleting({ rows: list, clear }) : undefined}
          empty={{ icon: Scissors, title: surgeries.length ? 'No surgeries match your filters' : 'No surgeries scheduled' }}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-bold text-fg">{formatDate(date, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            <DateNav value={date} onChange={setDate} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
            {OT_ROOMS.filter((r) => !room || r === room).map((r) => {
              const list = rows.filter((s) => s.room === r && s.date === date).sort((a, b) => String(a.time).localeCompare(String(b.time)));
              return (
                <Card key={r}>
                  <div className="flex items-center justify-between px-4 py-3 border-b border-line">
                    <h3 className="text-sm font-bold text-fg">{r}</h3>
                    {canWrite && <IconButton size="sm" label={`Schedule in ${r}`} icon={Plus} tone="brand" onClick={() => setEditing({ date, room: r })} />}
                  </div>
                  <ul className="p-3 space-y-3">
                    {list.map((s) => (
                      <li key={s.id} className="rounded-lg border border-line p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-brand-600 tabular">{formatTime(s.time)}{s.duration ? ` · ${s.duration}h` : ''}</span>
                          <StatusBadge status={s.status} />
                        </div>
                        <p className="text-sm font-bold text-fg mt-2">{s.type}</p>
                        <p className="text-xs text-fg-subtle">{s.patient} · {s.doctor}</p>
                        <div className="flex justify-end gap-0.5 mt-2">{actions(s)}</div>
                      </li>
                    ))}
                    {list.length === 0 && <li className="text-xs text-fg-subtle text-center py-6">Free all day</li>}
                  </ul>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {editing && <SurgeryForm record={editing} onClose={() => setEditing(null)} />}
      {deleting && (
        <ConfirmDialog
          title={deleting.rows.length > 1 ? `Delete ${deleting.rows.length} surgeries` : 'Delete surgery'}
          message={deleting.rows.length > 1 ? 'The selected surgeries will be permanently deleted.' : `Delete the ${deleting.rows[0].type || 'surgery'} scheduled for ${deleting.rows[0].patient}?`}
          onConfirm={async () => {
            await store.removeMany(deleting.rows.map((s) => s.id));
            deleting.clear?.();
          }}
          onClose={() => setDeleting(null)}
        />
      )}
    </Page>
  );
}
