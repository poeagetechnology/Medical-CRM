import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Clock, Download, Eraser, FileSpreadsheet, Sparkles, Stethoscope, Wand2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCollection } from '../hooks/useCollection';
import { useActivityLog } from '../hooks/useActivityLog';
import {
  Button, Card, CardHeader, ConfirmDialog, EmptyState, IconButton, IconTile, Notice, Page, PageHeader, PageLoader,
  Person, StatCard, StatGrid, StatusBadge, Tabs, useAction,
} from '../components/ui';
import { canEditPage } from '../utils/roles';
import { TIME_SLOTS } from '../utils/formConfigs';
import { addDays, exportCsv, formatTime, sameText, todayISO } from '../utils/format';
import { dayKey } from '../utils/stats';

/*
 * Proposes a doctor and time slot for every unscheduled waiting patient:
 * urgent patients first, each to the free doctor with the lightest load,
 * keeping their preferred doctor when that doctor is available.
 */
function buildPlan(queue, doctors) {
  const available = doctors.filter((d) => d.status === 'Available' || d.status === 'On Duty');
  if (!available.length) return [];
  const today = todayISO();
  const booked = queue.filter((q) => q.slot && q.slotDate === today && q.status !== 'Completed');
  const load = new Map(available.map((d) => [d.name, booked.filter((q) => sameText(q.doctor, d.name)).map((q) => q.slot)]));
  const now = new Date();
  const nowSlot = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const upcoming = TIME_SLOTS.filter((t) => t >= nowSlot);
  const slots = upcoming.length ? upcoming : TIME_SLOTS;

  const waiting = queue
    .filter((q) => q.status === 'Waiting' && !(q.slot && q.slotDate === today))
    .sort((a, b) => (a.priority === 'Urgent' ? 0 : 1) - (b.priority === 'Urgent' ? 0 : 1)
      || String(a.token).localeCompare(String(b.token), undefined, { numeric: true }));

  const plan = [];
  for (const patient of waiting) {
    const candidates = available
      .map((d) => ({ d, taken: load.get(d.name), slot: slots.find((t) => !load.get(d.name).includes(t)) }))
      .filter((c) => c.slot)
      .sort((a, b) => a.slot.localeCompare(b.slot) || a.taken.length - b.taken.length);
    if (!candidates.length) break;
    const preferred = candidates.find((c) => sameText(c.d.name, patient.doctor));
    const pick = preferred || candidates[0];
    pick.taken.push(pick.slot);
    plan.push({ id: patient.id, token: patient.token, name: patient.name, priority: patient.priority, from: patient.doctor, doctor: pick.d.name, slot: pick.slot });
  }
  return plan;
}

const REPORTS = [
  { key: 'patients', title: 'Patient register', dateField: 'createdAt', columns: ['name', 'age', 'gender', 'status', 'doctor', 'room', 'condition'] },
  { key: 'appointments', title: 'Appointments', dateField: 'date', columns: ['date', 'time', 'patient', 'doctor', 'type', 'status'] },
  { key: 'billing', title: 'Billing & revenue', dateField: 'date', columns: ['invoiceNo', 'date', 'patient', 'service', 'amount', 'status', 'method'] },
  { key: 'surgeries', title: 'Surgery log', dateField: 'date', columns: ['date', 'time', 'patient', 'type', 'doctor', 'room', 'status'] },
  { key: 'patientReports', title: 'Diagnostic reports', dateField: 'date', columns: ['date', 'patient', 'type', 'doctor', 'status'] },
  { key: 'opPatients', title: 'OP queue', dateField: 'createdAt', columns: ['token', 'name', 'doctor', 'priority', 'status'] },
  { key: 'checkupPatients', title: 'Checkups', dateField: 'date', columns: ['date', 'time', 'name', 'checkupType', 'doctor', 'status'] },
  { key: 'doctors', title: 'Doctor directory', columns: ['name', 'dept', 'specialization', 'phone', 'status'] },
  { key: 'beds', title: 'Bed census', columns: ['number', 'ward', 'status', 'patient'] },
  { key: 'medicines', title: 'Pharmacy inventory', columns: ['name', 'category', 'stock', 'price', 'status', 'expiry'] },
];
const label = (key) => key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
const RANGES = [{ value: '7', label: 'Last 7 days' }, { value: '30', label: 'Last 30 days' }, { value: '365', label: 'Last year' }, { value: 'all', label: 'All time' }];

export default function SmartReports() {
  const [tab, setTab] = useState('schedule');
  return (
    <Page>
      <PageHeader
        title="Smart Reports"
        description="Automatic OP scheduling and downloadable operational reports."
        actions={<Tabs value={tab} onChange={setTab} options={[{ value: 'schedule', label: 'Smart scheduling', icon: Sparkles }, { value: 'reports', label: 'Report centre', icon: FileSpreadsheet }]} />}
      />
      {tab === 'schedule' ? <Scheduling /> : <ReportCentre />}
    </Page>
  );
}

function Scheduling() {
  const { profile } = useAuth();
  const canEdit = canEditPage(profile, 'report');
  const doctors = useCollection('doctors');
  const queue = useCollection('opPatients');
  const log = useActivityLog();
  const run = useAction();
  const [plan, setPlan] = useState(null);
  const [applying, setApplying] = useState(false);
  const [clearing, setClearing] = useState(false);

  if (doctors.loading || queue.loading) return <PageLoader />;

  const today = todayISO();
  const schedule = queue.data
    .filter((q) => q.slot && q.slotDate === today)
    .sort((a, b) => a.slot.localeCompare(b.slot));
  const waiting = queue.data.filter((q) => q.status === 'Waiting');
  const available = doctors.data.filter((d) => d.status === 'Available' || d.status === 'On Duty');

  const propose = () => setPlan(buildPlan(queue.data, doctors.data));

  const apply = async () => {
    setApplying(true);
    const ok = await run(async () => {
      for (const item of plan) {
        await queue.update(item.id, { doctor: item.doctor, slot: item.slot, slotDate: today });
        log(item.name, `Scheduled with ${item.doctor} at ${formatTime(item.slot)}`);
      }
    }, `${plan.length} patient(s) scheduled`);
    setApplying(false);
    if (ok) setPlan(null);
  };

  return (
    <>
      <StatGrid>
        <StatCard label="Waiting patients" value={waiting.length} icon={Clock} tone="amber" />
        <StatCard label="Doctors taking patients" value={available.length} icon={Stethoscope} tone="green" />
        <StatCard label="Scheduled today" value={schedule.length} icon={CheckCircle2} />
        <StatCard label="Unscheduled" value={waiting.filter((q) => !(q.slot && q.slotDate === today)).length} icon={Sparkles} tone="violet" />
      </StatGrid>

      {!available.length && <Notice icon={Stethoscope}>No doctor is currently available. Update availability on the Doctors page to generate a schedule.</Notice>}

      {plan && (
        <Card>
          <CardHeader
            title="Proposed schedule"
            description="Review the plan. Nothing is saved until you apply it."
            actions={
              <>
                <Button size="sm" onClick={() => setPlan(null)} disabled={applying}>Discard</Button>
                <Button size="sm" variant="primary" icon={CheckCircle2} onClick={apply} loading={applying} disabled={!plan.length}>Apply {plan.length || ''}</Button>
              </>
            }
          />
          {plan.length === 0 ? (
            <EmptyState compact title="Nothing to schedule" description="Every waiting patient already has a slot, or no slots are free." />
          ) : (
            <ul className="divide-y divide-line">
              {plan.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <span className="w-20 text-sm font-bold text-fg tabular">{formatTime(p.slot)}</span>
                  <div className="flex-1 min-w-[180px]"><Person name={p.name} sub={`${p.token}${p.priority === 'Urgent' ? ' · Urgent' : ''}`} size={32} /></div>
                  <ArrowRight size={14} className="text-fg-subtle" />
                  <span className="text-sm font-semibold text-fg">{p.doctor}</span>
                  {p.from && !sameText(p.from, p.doctor) && <span className="text-xs text-amber-600">reassigned from {p.from}</span>}
                  <IconButton label="Remove from plan" icon={X} tone="red" onClick={() => setPlan((list) => list.filter((x) => x.id !== p.id))} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Today's schedule"
            description="Saved slots, visible to the whole team"
            actions={
              <>
                <Button size="sm" icon={Download} disabled={!schedule.length} onClick={() => exportCsv('schedule.csv', [
                  { label: 'Time', value: (q) => q.slot }, { label: 'Token', value: (q) => q.token },
                  { label: 'Patient', value: (q) => q.name }, { label: 'Doctor', value: (q) => q.doctor }, { label: 'Status', value: (q) => q.status },
                ], schedule)}>Export</Button>
                {canEdit && <Button size="sm" variant="danger-soft" icon={Eraser} disabled={!schedule.length} onClick={() => setClearing(true)}>Clear</Button>}
                {canEdit && <Button size="sm" variant="primary" icon={Wand2} onClick={propose} disabled={!available.length}>Auto-assign</Button>}
              </>
            }
          />
          {schedule.length === 0 ? (
            <EmptyState icon={Sparkles} title="No slots assigned yet" description={canEdit ? 'Choose Auto-assign to build a balanced schedule.' : 'A manager has not built today’s schedule yet.'} />
          ) : (
            <ul className="divide-y divide-line">
              {schedule.map((q) => (
                <li key={q.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <span className="w-20 text-sm font-bold text-fg tabular">{formatTime(q.slot)}</span>
                  <div className="flex-1 min-w-[180px]"><Person name={q.name} sub={`${q.token} · ${q.doctor}`} size={32} /></div>
                  <StatusBadge status={q.status} />
                  {canEdit && <IconButton label="Release slot" icon={X} tone="red" onClick={() => run(() => queue.update(q.id, { slot: '', slotDate: '' }), 'Slot released')} />}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Doctor workload" description="Open queue entries per doctor" />
          {doctors.data.length === 0 ? <EmptyState compact title="No doctors" /> : (
            <ul className="divide-y divide-line max-h-[480px] overflow-y-auto scrollbar-thin">
              {doctors.data.map((d) => (
                <li key={d.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex-1 min-w-0"><Person name={d.name} sub={d.dept} size={32} /></div>
                  <span className="text-sm font-bold text-fg tabular">{queue.data.filter((q) => sameText(q.doctor, d.name) && q.status !== 'Completed').length}</span>
                  <StatusBadge status={d.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {clearing && (
        <ConfirmDialog
          title="Clear today's schedule"
          message="Remove all assigned time slots for today? Patients stay in the queue."
          confirmLabel="Clear schedule"
          successMessage="Schedule cleared"
          onConfirm={() => queue.updateMany(schedule.map((q) => q.id), { slot: '', slotDate: '' })}
          onClose={() => setClearing(false)}
        />
      )}
    </>
  );
}

function ReportCentre() {
  const [range, setRange] = useState('30');
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-fg-subtle">Download CSV files (opens in Excel). The period applies to dated records.</p>
        <Tabs value={range} onChange={setRange} options={RANGES} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {REPORTS.map((r) => <ReportTile key={r.key} report={r} range={range} />)}
      </div>
    </>
  );
}

// Only shown for data this role may read.
function ReportTile({ report, range }) {
  const { data, loading, canRead } = useCollection(report.key);
  if (!canRead) return null;

  const from = range === 'all' || !report.dateField ? '' : addDays(todayISO(), -Number(range) + 1);
  const rows = from ? data.filter((r) => dayKey(r, report.dateField) >= from) : data;

  return (
    <Card className="p-5 flex items-center gap-4">
      <IconTile icon={FileSpreadsheet} size={44} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-fg truncate">{report.title}</p>
        <p className="text-xs text-fg-subtle">{loading ? 'Loading…' : `${rows.length} record(s)${report.dateField ? '' : ' · current'}`}</p>
      </div>
      <Button
        size="sm"
        icon={Download}
        disabled={loading || !rows.length}
        onClick={() => exportCsv(
          `${report.key}-${todayISO()}.csv`,
          report.columns.map((c) => ({ label: label(c), value: (r) => r[c] })),
          rows
        )}
      >CSV</Button>
    </Card>
  );
}
