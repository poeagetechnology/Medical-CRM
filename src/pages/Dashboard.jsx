import React, { useState } from 'react';
import {
  AlertTriangle, ArrowRight, BedDouble, CalendarClock, CheckCircle2, CreditCard, FileText,
  LogIn, Pill, ShieldCheck, Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCollection } from '../hooks/useCollection';
import { useAppointmentActions } from '../hooks/useWorkflows';
import { allowedQuickActions } from '../config/navigation';
import { AppointmentForm } from '../components/editors';
import { DonutChart, TrendChart } from '../components/charts';
import {
  Button, Card, CardHeader, EmptyState, IconButton, IconTile, Page, PageHeader, PageLoader,
  Person, Progress, StatCard, StatGrid, StatusBadge, Tabs, useAction,
} from '../components/ui';
import { USER_STATUS, canViewPage } from '../utils/roles';
import { PATIENT_STATUSES } from '../utils/formConfigs';
import { byNewest, formatMoney, formatMoneyShort, formatTime, greeting, todayISO } from '../utils/format';
import { dailySeries, dayKey, lastNDays, paidDay, sumAmounts } from '../utils/stats';

export default function Dashboard({ navigate }) {
  const { profile } = useAuth();
  const patients = useCollection('patients');
  const appointments = useAppointmentActions();
  const billing = useCollection('billing');
  const beds = useCollection('beds');
  const medicines = useCollection('medicines');
  const queue = useCollection('opPatients');
  const reports = useCollection('patientReports');
  const users = useCollection('users');
  const activity = useCollection('activityLogs');
  const run = useAction();

  const [range, setRange] = useState('14');
  const [editing, setEditing] = useState(null);

  if (patients.loading || appointments.loading) return <PageLoader />;

  const today = todayISO();
  const can = (page) => canViewPage(profile, page);
  const showRevenue = billing.canRead;

  const todays = appointments.data
    .filter((a) => a.date === today && a.status !== 'Cancelled')
    .sort((a, b) => String(a.time).localeCompare(String(b.time)));
  const week = new Set(lastNDays(7));
  const newThisWeek = patients.data.filter((p) => week.has(dayKey(p, 'createdAt'))).length;
  const paid = billing.data.filter((b) => b.status === 'Paid');
  const pendingBills = billing.data.filter((b) => b.status === 'Pending');
  const monthRevenue = sumAmounts(paid.filter((b) => paidDay(b).startsWith(today.slice(0, 7))));
  const occupied = beds.data.filter((b) => b.status === 'Occupied').length;
  const occupancy = beds.data.length ? Math.round((occupied / beds.data.length) * 100) : 0;
  const waiting = queue.data.filter((q) => q.status === 'Waiting').length;

  const trend = showRevenue
    ? dailySeries(paid, Number(range), paidDay, (b) => sumAmounts([b]))
    : dailySeries(appointments.data.filter((a) => a.status !== 'Cancelled'), Number(range), (a) => a.date || '');

  const statusData = [
    ...PATIENT_STATUSES.map((s) => ({ name: s, value: patients.data.filter((p) => p.status === s).length })),
    { name: 'Unspecified', value: patients.data.filter((p) => !PATIENT_STATUSES.includes(p.status)).length },
  ];

  const critical = patients.data.filter((p) => p.status === 'Critical');
  const attention = [
    can('patients') && critical.length && {
      icon: AlertTriangle, tone: 'red', title: `${critical.length} critical patient${critical.length > 1 ? 's' : ''}`,
      text: critical.slice(0, 3).map((p) => p.name).join(', '), to: ['patients', { status: 'Critical' }],
    },
    can('admin') && users.data.some((u) => u.status === USER_STATUS.PENDING) && {
      icon: ShieldCheck, tone: 'amber', title: `${users.data.filter((u) => u.status === USER_STATUS.PENDING).length} account(s) awaiting approval`,
      text: 'Review and approve new staff', to: ['admin'],
    },
    can('medicalCenter') && medicines.data.some((m) => m.status !== 'In Stock') && {
      icon: Pill, tone: 'amber', title: `${medicines.data.filter((m) => m.status !== 'In Stock').length} medicine(s) low or out of stock`,
      text: medicines.data.filter((m) => m.status !== 'In Stock').slice(0, 3).map((m) => m.name).join(', '), to: ['medicalCenter', { status: 'attention' }],
    },
    can('billing') && pendingBills.length && {
      icon: CreditCard, tone: 'violet', title: `${pendingBills.length} unpaid invoice(s)`,
      text: `${formatMoney(sumAmounts(pendingBills))} outstanding`, to: ['billing', { status: 'Pending' }],
    },
    can('patientReports') && reports.data.some((r) => r.status === 'Pending') && {
      icon: FileText, tone: 'blue', title: `${reports.data.filter((r) => r.status === 'Pending').length} report(s) pending`,
      text: 'Waiting for results', to: ['patientReports', { status: 'Pending' }],
    },
    can('beds') && beds.data.length > 0 && occupancy >= 85 && {
      icon: BedDouble, tone: 'red', title: `Bed occupancy at ${occupancy}%`, text: 'Capacity is running low', to: ['beds'],
    },
  ].filter(Boolean);

  const recentPatients = [...patients.data].sort(byNewest).slice(0, 5);
  const recentActivity = [...activity.data].sort(byNewest).slice(0, 7);
  const actions = allowedQuickActions(profile).slice(0, 3);

  return (
    <Page>
      <PageHeader
        title={`${greeting()}, ${profile?.name || 'there'}`}
        description={new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        actions={actions.map((a, i) => (
          <Button key={a.page} icon={a.icon} variant={i === 0 ? 'primary' : 'secondary'} onClick={() => navigate(a.page, { new: '1' })}>
            {a.label}
          </Button>
        ))}
      />

      <StatGrid>
        <StatCard label="Total patients" value={patients.data.length} hint={`${newThisWeek} registered this week`} icon={Users} onClick={() => navigate('patients')} />
        <StatCard label="Appointments today" value={todays.length} hint={`${todays.filter((a) => a.status === 'Completed').length} completed`} icon={CalendarClock} tone="violet" onClick={can('appointments') ? () => navigate('appointments') : undefined} />
        {beds.canRead
          ? <StatCard label="Bed occupancy" value={`${occupancy}%`} hint={`${occupied} of ${beds.data.length} beds in use`} icon={BedDouble} tone="amber" onClick={() => navigate('beds')} />
          : <StatCard label="Critical patients" value={critical.length} hint="Need immediate attention" icon={AlertTriangle} tone="red" />}
        {showRevenue
          ? <StatCard label="Revenue this month" value={formatMoneyShort(monthRevenue)} hint={`${formatMoneyShort(sumAmounts(pendingBills))} outstanding`} icon={CreditCard} tone="green" onClick={() => navigate('billing')} />
          : <StatCard label="Waiting in OP queue" value={waiting} hint={`${queue.data.filter((q) => q.status === 'In Consultation').length} in consultation`} icon={Users} tone="green" />}
      </StatGrid>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHeader
            title={showRevenue ? 'Revenue collected' : 'Appointment volume'}
            description={showRevenue
              ? `${formatMoney(trend.reduce((t, d) => t + d.value, 0))} in the last ${range} days`
              : `${trend.reduce((t, d) => t + d.value, 0)} appointments in the last ${range} days`}
            actions={<Tabs value={range} onChange={setRange} options={[{ value: '7', label: '7D' }, { value: '14', label: '14D' }, { value: '30', label: '30D' }]} />}
          />
          <div className="p-4">
            <TrendChart data={trend} format={showRevenue ? formatMoneyShort : undefined} name={showRevenue ? '' : 'appointments'} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Patient status" description="Current distribution" />
          <div className="p-5"><DonutChart data={statusData} totalLabel="patients" /></div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Today's schedule"
            description={`${todays.length} appointment${todays.length === 1 ? '' : 's'}`}
            actions={can('appointments') && <Button size="sm" variant="ghost" iconRight={ArrowRight} onClick={() => navigate('appointments')}>Open</Button>}
          />
          {todays.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="No appointments today"
              action={appointments.canWrite && <Button variant="primary" size="sm" onClick={() => setEditing({ date: today })}>Book appointment</Button>}
            />
          ) : (
            <ul className="divide-y divide-line max-h-[360px] overflow-y-auto scrollbar-thin">
              {todays.map((a) => (
                <li key={a.id} className="flex items-center gap-4 px-5 py-3">
                  <span className="w-16 text-xs font-bold text-fg tabular flex-shrink-0">{formatTime(a.time)}</span>
                  <div className="flex-1 min-w-0"><Person name={a.patient} sub={[a.doctor, a.type].filter(Boolean).join(' · ')} size={32} /></div>
                  <StatusBadge status={a.checkedIn && a.status !== 'Completed' ? 'Waiting' : a.status} className="hidden sm:inline-flex" />
                  <div className="flex items-center gap-1">
                    {appointments.isCheckInDue(a) && (
                      <IconButton label="Check in to OP queue" icon={LogIn} tone="brand" onClick={() => run(() => appointments.checkIn(a), `${a.patient} checked in`)} />
                    )}
                    {appointments.canWrite && a.status !== 'Completed' && (
                      <IconButton label="Mark completed" icon={CheckCircle2} tone="green" onClick={() => run(() => appointments.setStatus(a, 'Completed'), 'Appointment completed')} />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Needs attention" description="Items that need action" />
          {attention.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="All clear" description="Nothing needs your attention right now." />
          ) : (
            <ul className="p-2">
              {attention.map((a) => (
                <li key={a.title}>
                  <button type="button" onClick={() => navigate(...a.to)} className="flex w-full items-center gap-3 p-3 rounded-lg text-left hover:bg-subtle">
                    <IconTile icon={a.icon} tone={a.tone} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-fg">{a.title}</span>
                      <span className="block text-xs text-fg-subtle truncate">{a.text}</span>
                    </span>
                    <ArrowRight size={14} className="text-fg-subtle flex-shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHeader title="Recently registered" actions={<Button size="sm" variant="ghost" iconRight={ArrowRight} onClick={() => navigate('patients')}>All patients</Button>} />
          {recentPatients.length === 0 ? (
            <EmptyState icon={Users} title="No patients yet" />
          ) : (
            <ul className="divide-y divide-line">
              {recentPatients.map((p) => (
                <li key={p.id}>
                  <button type="button" onClick={() => navigate('patientDetails', { patientId: p.id })} className="flex w-full items-center gap-4 px-5 py-3 text-left hover:bg-subtle/60">
                    <div className="flex-1 min-w-0"><Person name={p.name} sub={[p.condition, p.doctor].filter(Boolean).join(' · ') || 'No details yet'} /></div>
                    <span className="hidden md:block text-xs text-fg-subtle w-20">{p.room ? `Room ${p.room}` : ''}</span>
                    <StatusBadge status={p.status} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Activity" description="Latest updates across the team" />
          <div className="p-5 space-y-5">
            {beds.canRead && beds.data.length > 0 && (
              <div className="pb-4 border-b border-line">
                <div className="flex justify-between text-xs mb-2">
                  <span className="font-semibold text-fg-muted">Beds available</span>
                  <span className="font-bold text-fg tabular">{beds.data.filter((b) => b.status === 'Available').length} / {beds.data.length}</span>
                </div>
                <Progress value={occupancy} tone={occupancy >= 85 ? 'red' : occupancy >= 60 ? 'amber' : 'green'} />
              </div>
            )}
            {recentActivity.length === 0 ? (
              <p className="text-sm text-fg-subtle text-center py-4">No activity yet.</p>
            ) : (
              <ol className="space-y-4">
                {recentActivity.map((l) => (
                  <li key={l.id} className="flex gap-3">
                    <span className="w-2 h-2 mt-1.5 rounded-full bg-brand-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-fg"><b>{l.patient}</b> — {l.text}</p>
                      <p className="text-2xs text-fg-subtle mt-0.5">{l.time}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </Card>
      </div>

      {editing && <AppointmentForm record={editing} onClose={() => setEditing(null)} />}
    </Page>
  );
}
