import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity, ArrowLeft, CalendarClock, CalendarPlus, CheckCircle2, ChevronDown, CreditCard, FilePlus2,
  FileText, Pencil, Phone, Plus, Printer, Receipt, Scissors, Send, Trash2, UserRound, AlertTriangle,
} from 'lucide-react';
import { useCollection } from '../hooks/useCollection';
import { useActivityLog } from '../hooks/useActivityLog';
import { useAppointmentActions, useSurgeryActions } from '../hooks/useWorkflows';
import { AppointmentForm, BillForm, PatientForm, ReportForm, SurgeryForm } from '../components/editors';
import { printInvoice, printPatientSummary, printReport, invoiceNumber } from '../services/documents';
import {
  Avatar, Button, Card, CardHeader, ConfirmDialog, DataTable, DefinitionList, EmptyState, IconButton,
  MenuItem, Notice, Page, PageLoader, Popover, StatCard, StatGrid, StatusBadge, Tabs, useAction, useToast,
} from '../components/ui';
import { byNewest, formatDate, formatMoney, formatTime, parseAmount, sameText, shortId, todayISO } from '../utils/format';
import { sumAmounts } from '../utils/stats';

// Everything about one patient, in one place.
export default function PatientProfile({ params, navigate }) {
  const patients = useCollection('patients');
  const appointments = useAppointmentActions();
  const reports = useCollection('patientReports');
  const billing = useCollection('billing');
  const surgeries = useSurgeryActions();
  const activity = useCollection('activityLogs');
  const beds = useCollection('beds');
  const log = useActivityLog();
  const run = useAction();
  const toast = useToast();

  const [tab, setTab] = useState('overview');
  const [editing, setEditing] = useState(null);      // { kind, record }
  const [deleting, setDeleting] = useState(null);    // { title, message, action }
  const [note, setNote] = useState('');

  const sorted = useMemo(
    () => [...patients.data].sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    [patients.data]
  );

  const selectedId = params?.patientId;
  const patient = sorted.find((p) => p.id === selectedId) || sorted[0];

  // Keep the URL pointing at the patient being shown.
  useEffect(() => {
    if (patient && patient.id !== selectedId) navigate('patientDetails', { patientId: patient.id }, { replace: true });
  }, [patient, selectedId, navigate]);

  if (patients.loading) return <PageLoader />;

  if (!patient) {
    return (
      <Page>
        <div className="card">
          <EmptyState
            icon={UserRound}
            title="No patient records yet"
            description="Register a patient to see their profile here."
            action={<Button variant="primary" onClick={() => navigate('patients', patients.canWrite ? { new: '1' } : null)}>{patients.canWrite ? 'Register patient' : 'Go to Patients'}</Button>}
          />
        </div>
      </Page>
    );
  }

  const mine = (list, field = 'patient') => list.filter((x) => sameText(x[field], patient.name));
  const myAppointments = mine(appointments.data).sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
  const myReports = mine(reports.data);
  const myBills = mine(billing.data);
  const mySurgeries = mine(surgeries.data);
  const myLogs = mine(activity.data).sort(byNewest);
  const bed = mine(beds.data)[0];
  const outstanding = sumAmounts(myBills.filter((b) => b.status === 'Pending'));
  const prefill = { patient: patient.name, doctor: patient.doctor || '' };
  const open = (kind, record) => setEditing({ kind, record });
  const confirmDelete = (noun, action) =>
    setDeleting({ title: `Delete ${noun}`, message: `This permanently deletes the ${noun}.`, action });

  const create = [
    appointments.canWrite && { label: 'Book appointment', icon: CalendarPlus, run: () => open('appointment', prefill) },
    reports.canWrite && { label: 'Add medical report', icon: FilePlus2, run: () => open('report', prefill) },
    billing.canWrite && { label: 'Create invoice', icon: Receipt, run: () => open('bill', { patient: patient.name }) },
    surgeries.canWrite && { label: 'Schedule surgery', icon: Scissors, run: () => open('surgery', prefill) },
  ].filter(Boolean);

  const tabs = [
    { value: 'overview', label: 'Overview', icon: UserRound },
    appointments.canRead && { value: 'appointments', label: 'Appointments', icon: CalendarClock, count: myAppointments.length },
    reports.canRead && { value: 'reports', label: 'Reports', icon: FileText, count: myReports.length },
    billing.canRead && { value: 'billing', label: 'Billing', icon: CreditCard, count: myBills.length },
    surgeries.canRead && { value: 'surgeries', label: 'Surgeries', icon: Scissors, count: mySurgeries.length },
    { value: 'timeline', label: 'Timeline', icon: Activity, count: myLogs.length },
  ].filter(Boolean);
  const activeTab = tabs.some((t) => t.value === tab) ? tab : 'overview';

  const addNote = async (e) => {
    e.preventDefault();
    const text = note.trim();
    if (!text) return;
    setNote('');
    await log(patient.name, text);
    toast.success('Note added');
  };

  const print = (ok) => { if (!ok) toast.error('Allow pop-ups for this site to print.'); };

  const rowButtons = (store, noun, kind, row, extra) => (
    <>
      {extra}
      {store.canWrite && <IconButton label="Edit" icon={Pencil} tone="brand" onClick={() => open(kind, row)} />}
      {store.canDelete && <IconButton label="Delete" icon={Trash2} tone="red" onClick={() => confirmDelete(noun, () => store.remove(row.id))} />}
    </>
  );

  const addButton = (store, label, kind, record) =>
    store.canWrite && <div className="flex justify-end"><Button variant="primary" size="sm" icon={Plus} onClick={() => open(kind, record)}>{label}</Button></div>;

  return (
    <Page>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => navigate('patients')}>All patients</Button>
        <label className="flex items-center gap-2 text-xs font-semibold text-fg-subtle">
          Switch patient
          <select
            className="input !w-64"
            value={patient.id}
            onChange={(e) => navigate('patientDetails', { patientId: e.target.value })}
          >
            {sorted.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
      </div>

      {/* Identity header */}
      <Card className="p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-5">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <Avatar name={patient.name} size={64} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-extrabold tracking-tight text-fg">{patient.name}</h1>
                <StatusBadge status={patient.status} />
              </div>
              <p className="text-sm text-fg-subtle mt-1">
                {[shortId(patient.id), patient.age || patient.age === 0 ? `${patient.age} yrs` : null, patient.gender, patient.bloodGroup].filter(Boolean).join(' · ')}
              </p>
              {patient.phone && (
                <a href={`tel:${patient.phone}`} className="inline-flex items-center gap-1.5 text-sm text-brand-600 font-semibold mt-1 hover:underline">
                  <Phone size={13} /> {patient.phone}
                </a>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button icon={Printer} onClick={() => print(printPatientSummary(patient, { appointments: myAppointments, reports: myReports }))}>Print summary</Button>
            {patients.canWrite && <Button icon={Pencil} onClick={() => open('patient', patient)}>Edit</Button>}
            {patients.canDelete && (
              <Button variant="danger-soft" icon={Trash2} onClick={() => setDeleting({
                title: 'Delete patient',
                message: `The record for ${patient.name} will be removed permanently. Appointments, bills and reports are kept for audit.`,
                action: async () => {
                  await patients.remove(patient.id);
                  if (bed && beds.canWrite) await beds.update(bed.id, { status: 'Cleaning', patient: '', occupiedAt: '' });
                  navigate('patients');
                },
              })}>Delete</Button>
            )}
            {create.length > 0 && (
              <Popover
                label="Add record"
                triggerClassName="rounded-lg"
                trigger={() => (
                  <span className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700">
                    <Plus size={15} /> Add <ChevronDown size={14} />
                  </span>
                )}
              >
                {(close) => (
                  <div className="p-1.5">
                    {create.map((c) => <MenuItem key={c.label} icon={c.icon} onClick={() => { close(); c.run(); }}>{c.label}</MenuItem>)}
                  </div>
                )}
              </Popover>
            )}
          </div>
        </div>
      </Card>

      {patient.allergies && !/^(none|no|nil|-)$/i.test(patient.allergies.trim()) && (
        <Notice tone="red" icon={AlertTriangle}><b>Allergies:</b> {patient.allergies}</Notice>
      )}

      <StatGrid>
        <StatCard label="Attending doctor" value={patient.doctor || '—'} icon={UserRound} />
        <StatCard label="Room / bed" value={bed ? bed.number || bed.id : patient.room || '—'} hint={bed?.ward ? `${bed.ward} ward` : undefined} icon={Activity} tone="violet" />
        <StatCard label="Next appointment" value={nextAppointment(myAppointments)} icon={CalendarClock} tone="blue" />
        {billing.canRead
          ? <StatCard label="Outstanding balance" value={formatMoney(outstanding)} icon={CreditCard} tone={outstanding ? 'red' : 'green'} />
          : <StatCard label="Reports on file" value={myReports.length} icon={FileText} tone="green" />}
      </StatGrid>

      <Tabs options={tabs} value={activeTab} onChange={setTab} />

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader title="Personal information" />
            <div className="p-5">
              <DefinitionList items={[
                ['Full name', patient.name], ['Age', patient.age], ['Gender', patient.gender], ['Blood group', patient.bloodGroup],
                ['Phone', patient.phone], ['Address', patient.address], ['Emergency contact', patient.emergencyContact],
                ['Registered', patient.createdAt ? formatDate(patient.createdAt) : ''],
              ]} />
            </div>
          </Card>
          <Card>
            <CardHeader title="Clinical information" />
            <div className="p-5">
              <DefinitionList items={[
                ['Status', patient.status], ['Attending doctor', patient.doctor], ['Room', patient.room],
                ['Last checkup', patient.lastCheckup ? formatDate(patient.lastCheckup) : ''],
                ['Condition / diagnosis', patient.condition], ['Allergies', patient.allergies],
              ]} />
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'appointments' && (
        <div className="space-y-3">
          {addButton(appointments, 'Book appointment', 'appointment', prefill)}
          <DataTable
            rows={myAppointments}
            columns={[
              { key: 'date', header: 'Date', render: (a) => <span className="font-semibold text-fg">{formatDate(a.date)}</span> },
              { key: 'time', header: 'Time', render: (a) => formatTime(a.time) },
              { key: 'doctor', header: 'Doctor' },
              { key: 'reason', header: 'Reason', hide: 'md' },
              { key: 'status', header: 'Status', render: (a) => <StatusBadge status={a.status} /> },
            ]}
            rowActions={(a) => rowButtons(appointments, 'appointment', 'appointment', a,
              appointments.canWrite && a.status !== 'Completed' && a.status !== 'Cancelled' && (
                <IconButton label="Mark completed" icon={CheckCircle2} tone="green" onClick={() => run(() => appointments.setStatus(a, 'Completed'), 'Appointment completed')} />
              ))}
            empty={{ icon: CalendarClock, title: 'No appointments' }}
          />
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-3">
          {addButton(reports, 'Add report', 'report', prefill)}
          <DataTable
            rows={myReports}
            initialSort={{ key: 'date', dir: -1 }}
            columns={[
              { key: 'type', header: 'Report', render: (r) => <span className="font-semibold text-fg">{r.type}</span> },
              { key: 'date', header: 'Date', render: (r) => formatDate(r.date) },
              { key: 'doctor', header: 'Doctor', hide: 'md' },
              { key: 'findings', header: 'Findings', hide: 'lg', render: (r) => <span className="block max-w-xs truncate">{r.findings || '—'}</span> },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            ]}
            rowActions={(r) => rowButtons(reports, 'report', 'report', r,
              <IconButton label="Print" icon={Printer} onClick={() => print(printReport(r))} />)}
            empty={{ icon: FileText, title: 'No reports' }}
          />
        </div>
      )}

      {activeTab === 'billing' && (
        <div className="space-y-3">
          {addButton(billing, 'Create invoice', 'bill', { patient: patient.name })}
          <DataTable
            rows={myBills}
            initialSort={{ key: 'date', dir: -1 }}
            columns={[
              { key: 'invoiceNo', header: 'Invoice', render: (b) => <span className="font-mono text-xs font-semibold text-fg">{invoiceNumber(b)}</span> },
              { key: 'service', header: 'Service' },
              { key: 'date', header: 'Date', render: (b) => formatDate(b.date) },
              { key: 'amount', header: 'Amount', align: 'right', sortValue: (b) => parseAmount(b.amount), render: (b) => <span className="font-bold text-fg tabular">{b.amount}</span> },
              { key: 'status', header: 'Status', render: (b) => <StatusBadge status={b.status} /> },
            ]}
            rowActions={(b) => rowButtons(billing, 'invoice', 'bill', b,
              <>
                <IconButton label="Print invoice" icon={Printer} onClick={() => print(printInvoice(b))} />
                {billing.canWrite && b.status === 'Pending' && (
                  <IconButton label="Mark paid" icon={CheckCircle2} tone="green" onClick={() => run(async () => {
                    await billing.update(b.id, { status: 'Paid', paidAt: new Date().toISOString() });
                    log(patient.name, `Invoice ${invoiceNumber(b)} (${b.amount}) marked Paid`);
                  }, 'Invoice marked paid')} />
                )}
              </>)}
            empty={{ icon: CreditCard, title: 'No invoices' }}
          />
        </div>
      )}

      {activeTab === 'surgeries' && (
        <div className="space-y-3">
          {addButton(surgeries, 'Schedule surgery', 'surgery', prefill)}
          <DataTable
            rows={mySurgeries}
            initialSort={{ key: 'date', dir: -1 }}
            columns={[
              { key: 'type', header: 'Procedure', render: (s) => <span className="font-semibold text-fg">{s.type}</span> },
              { key: 'doctor', header: 'Surgeon', hide: 'md' },
              { key: 'date', header: 'Date', render: (s) => `${formatDate(s.date)} · ${formatTime(s.time)}` },
              { key: 'room', header: 'Theatre', hide: 'md' },
              { key: 'status', header: 'Status', render: (s) => <StatusBadge status={s.status} /> },
            ]}
            rowActions={(s) => rowButtons(surgeries, 'surgery', 'surgery', s)}
            empty={{ icon: Scissors, title: 'No surgeries' }}
          />
        </div>
      )}

      {activeTab === 'timeline' && (
        <Card>
          <CardHeader title="Care timeline" description="Notes and every change recorded for this patient" />
          <div className="p-5">
            {activity.canWrite && (
              <form onSubmit={addNote} className="flex gap-2 mb-6">
                <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a clinical or admin note…" aria-label="Note" className="input" />
                <Button type="submit" variant="primary" icon={Send} disabled={!note.trim()}>Add note</Button>
              </form>
            )}
            {myLogs.length === 0 ? (
              <EmptyState compact icon={Activity} title="Nothing recorded yet" />
            ) : (
              <ol className="relative ml-1.5 border-l border-line space-y-5">
                {myLogs.map((l) => (
                  <li key={l.id} className="pl-5 relative group flex items-start justify-between gap-3">
                    <span className="absolute -left-[5px] top-1.5 w-[9px] h-[9px] rounded-full bg-brand-500 ring-4 ring-surface" />
                    <div>
                      <p className="text-sm text-fg">{l.text}</p>
                      <p className="text-2xs text-fg-subtle mt-0.5">{l.time}</p>
                    </div>
                    {activity.canDelete && (
                      <IconButton size="sm" label="Delete entry" icon={Trash2} tone="red" onClick={() => confirmDelete('timeline entry', () => activity.remove(l.id))} />
                    )}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </Card>
      )}

      {editing?.kind === 'patient' && <PatientForm record={editing.record} onClose={() => setEditing(null)} />}
      {editing?.kind === 'appointment' && <AppointmentForm record={editing.record} onClose={() => setEditing(null)} />}
      {editing?.kind === 'report' && <ReportForm record={editing.record} onClose={() => setEditing(null)} />}
      {editing?.kind === 'bill' && <BillForm record={editing.record} onClose={() => setEditing(null)} />}
      {editing?.kind === 'surgery' && <SurgeryForm record={editing.record} onClose={() => setEditing(null)} />}

      {deleting && (
        <ConfirmDialog title={deleting.title} message={deleting.message} onConfirm={deleting.action} onClose={() => setDeleting(null)} />
      )}
    </Page>
  );
}

// Earliest upcoming booking, e.g. "Nov 27".
function nextAppointment(list) {
  const today = todayISO();
  const next = list
    .filter((a) => a.date >= today && (a.status === 'Scheduled' || a.status === 'Pending'))
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))[0];
  return next ? formatDate(next.date, { month: 'short', day: 'numeric' }) : '—';
}
