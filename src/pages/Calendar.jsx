import React, { useMemo, useState } from 'react';
import { CalendarClock, CalendarDays, CalendarPlus, ChevronLeft, ChevronRight, HeartPulse, Pencil, Scissors, Trash2 } from 'lucide-react';
import { useCollection } from '../hooks/useCollection';
import { useAppointmentActions, useSurgeryActions } from '../hooks/useWorkflows';
import { AppointmentForm, CheckupForm, SurgeryForm } from '../components/editors';
import {
  Button, Card, CardHeader, ConfirmDialog, EmptyState, IconButton, IconTile, Page, PageHeader, PageLoader,
  StatCard, StatGrid, StatusBadge, Tabs, cx,
} from '../components/ui';
import { formatDate, formatTime, toISODate, todayISO } from '../utils/format';

const KINDS = {
  appointment: { label: 'Appointments', icon: CalendarClock, tone: 'brand', chip: 'bg-brand-50 text-brand-700 dark:bg-brand-500/20 dark:text-brand-200', dot: 'bg-brand-500' },
  surgery: { label: 'Surgeries', icon: Scissors, tone: 'red', chip: 'bg-red-50 text-red-700 dark:bg-red-500/20 dark:text-red-200', dot: 'bg-red-500' },
  checkup: { label: 'Checkups', icon: HeartPulse, tone: 'green', chip: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200', dot: 'bg-emerald-500' },
};
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Six weeks covering the month, starting on Sunday.
const monthGrid = (year, month) => {
  const start = new Date(year, month, 1 - new Date(year, month, 1).getDay());
  return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
};

export default function Calendar() {
  const appointments = useAppointmentActions();
  const surgeries = useSurgeryActions();
  const checkups = useCollection('checkupPatients');

  const today = todayISO();
  const [cursor, setCursor] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selected, setSelected] = useState(today);
  const [kind, setKind] = useState('all');
  const [editing, setEditing] = useState(null);     // { kind, record }
  const [deleting, setDeleting] = useState(null);   // event

  const stores = { appointment: appointments, surgery: surgeries, checkup: checkups };

  const events = useMemo(() => {
    const list = [
      ...appointments.data.map((a) => ({ record: a, kind: 'appointment', title: a.patient, sub: a.doctor })),
      ...surgeries.data.map((s) => ({ record: s, kind: 'surgery', title: s.type, sub: [s.patient, s.doctor, s.room].filter(Boolean).join(' · ') })),
      ...checkups.data.map((c) => ({ record: c, kind: 'checkup', title: c.name, sub: [c.checkupType, c.doctor].filter(Boolean).join(' · ') })),
    ];
    return list.sort((a, b) => String(a.record.time).localeCompare(String(b.record.time)));
  }, [appointments.data, surgeries.data, checkups.data]);

  if (appointments.loading || surgeries.loading) return <PageLoader />;

  const filtered = events.filter((e) => kind === 'all' || e.kind === kind);
  const byDate = filtered.reduce((map, e) => {
    if (e.record.date) (map[e.record.date] = map[e.record.date] || []).push(e);
    return map;
  }, {});
  const dayEvents = byDate[selected] || [];
  const monthKey = toISODate(cursor).slice(0, 7);
  const inMonth = filtered.filter((e) => (e.record.date || '').startsWith(monthKey));
  const undated = filtered.filter((e) => !e.record.date).length;

  const shift = (n) => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + n, 1));
  const goToday = () => {
    const d = new Date();
    setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
    setSelected(today);
  };
  const pick = (d) => {
    setSelected(toISODate(d));
    if (d.getMonth() !== cursor.getMonth()) setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
  };
  const create = (k) => setEditing({ kind: k, record: { date: selected } });
  const readable = Object.keys(KINDS).filter((k) => stores[k].canRead);

  return (
    <Page>
      <PageHeader
        title="Calendar"
        description="Appointments, surgeries and checkups on one schedule."
        actions={
          <>
            {checkups.canWrite && <Button icon={HeartPulse} onClick={() => create('checkup')}>Checkup</Button>}
            {surgeries.canWrite && <Button icon={Scissors} onClick={() => create('surgery')}>Surgery</Button>}
            {appointments.canWrite && <Button variant="primary" icon={CalendarPlus} onClick={() => create('appointment')}>Appointment</Button>}
          </>
        }
      />

      <StatGrid>
        <StatCard label="Events this month" value={inMonth.length} icon={CalendarDays} tone="violet" />
        {readable.map((k) => (
          <StatCard key={k} label={`${KINDS[k].label} this month`} value={inMonth.filter((e) => e.kind === k).length} icon={KINDS[k].icon} tone={KINDS[k].tone} />
        ))}
      </StatGrid>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        <Card className="xl:col-span-2 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-line">
            <div className="flex items-center gap-1">
              <IconButton label="Previous month" icon={ChevronLeft} onClick={() => shift(-1)} />
              <h2 className="w-40 text-center text-base font-bold text-fg">{cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
              <IconButton label="Next month" icon={ChevronRight} onClick={() => shift(1)} />
              <Button size="sm" onClick={goToday}>Today</Button>
            </div>
            <Tabs value={kind} onChange={setKind} options={[{ value: 'all', label: 'All' }, ...readable.map((k) => ({ value: k, label: KINDS[k].label }))]} />
          </div>

          <div className="grid grid-cols-7 border-b border-line bg-subtle/60">
            {WEEKDAYS.map((d) => <div key={d} className="py-2 text-center text-2xs font-bold uppercase tracking-wider text-fg-subtle">{d}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {monthGrid(cursor.getFullYear(), cursor.getMonth()).map((d, i) => {
              const iso = toISODate(d);
              const list = byDate[iso] || [];
              const muted = d.getMonth() !== cursor.getMonth();
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => pick(d)}
                  aria-label={`${formatDate(iso)}, ${list.length} events`}
                  aria-pressed={iso === selected}
                  className={cx(
                    'h-16 sm:h-28 p-1.5 text-left align-top border-b border-line flex flex-col gap-1 min-w-0 transition-colors hover:bg-subtle/60',
                    i % 7 !== 6 && 'border-r',
                    muted && 'bg-subtle/30',
                    iso === selected && '!bg-brand-50 ring-2 ring-inset ring-brand-500 dark:!bg-brand-500/10'
                  )}
                >
                  <span className={cx(
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                    iso === today ? 'bg-brand-600 text-white' : muted ? 'text-fg-subtle' : 'text-fg'
                  )}>{d.getDate()}</span>
                  <span className="hidden sm:flex flex-col gap-0.5 min-w-0">
                    {list.slice(0, 2).map((e) => (
                      <span key={`${e.kind}-${e.record.id}`} className={cx('block truncate rounded px-1.5 py-0.5 text-2xs font-semibold', KINDS[e.kind].chip)}>
                        {e.record.time} {e.title}
                      </span>
                    ))}
                    {list.length > 2 && <span className="text-2xs font-semibold text-fg-subtle px-1.5">+{list.length - 2} more</span>}
                  </span>
                  {list.length > 0 && (
                    <span className="flex sm:hidden gap-0.5 flex-wrap">
                      {list.slice(0, 4).map((e) => <span key={`${e.kind}-${e.record.id}`} className={cx('w-1.5 h-1.5 rounded-full', KINDS[e.kind].dot)} />)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {undated > 0 && <p className="text-xs text-fg-subtle text-center py-2">{undated} older event(s) have no date and are not shown on the calendar.</p>}
        </Card>

        <Card>
          <CardHeader
            title={selected === today ? 'Today' : formatDate(selected, { weekday: 'long', month: 'short', day: 'numeric' })}
            description={`${dayEvents.length} event(s)`}
          />
          {dayEvents.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="Nothing scheduled"
              action={appointments.canWrite && <Button size="sm" variant="primary" icon={CalendarPlus} onClick={() => create('appointment')}>Book appointment</Button>}
            />
          ) : (
            <ul className="divide-y divide-line max-h-[640px] overflow-y-auto scrollbar-thin">
              {dayEvents.map((e) => {
                const store = stores[e.kind];
                return (
                  <li key={`${e.kind}-${e.record.id}`} className="flex gap-3 p-4">
                    <IconTile icon={KINDS[e.kind].icon} tone={KINDS[e.kind].tone} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-fg truncate">{e.title}</p>
                      <p className="text-xs text-fg-subtle">{formatTime(e.record.time)} · {e.sub}</p>
                      <StatusBadge status={e.record.status} className="mt-2" />
                    </div>
                    <div className="flex items-start gap-0.5">
                      {store.canWrite && <IconButton size="sm" label="Edit" icon={Pencil} tone="brand" onClick={() => setEditing({ kind: e.kind, record: e.record })} />}
                      {store.canDelete && <IconButton size="sm" label="Delete" icon={Trash2} tone="red" onClick={() => setDeleting(e)} />}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      {editing?.kind === 'appointment' && <AppointmentForm record={editing.record} onClose={() => setEditing(null)} />}
      {editing?.kind === 'surgery' && <SurgeryForm record={editing.record} onClose={() => setEditing(null)} />}
      {editing?.kind === 'checkup' && <CheckupForm record={editing.record} onClose={() => setEditing(null)} />}
      {deleting && (
        <ConfirmDialog
          title={`Delete ${deleting.kind}`}
          message={`Delete "${deleting.title}" on ${formatDate(deleting.record.date)}?`}
          onConfirm={() => stores[deleting.kind].remove(deleting.record.id)}
          onClose={() => setDeleting(null)}
        />
      )}
    </Page>
  );
}
