import React, { useState } from 'react';
import { Activity, CheckCircle2, Clock, Eraser, ListPlus, PhoneCall, Receipt, Stethoscope, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCollection } from '../hooks/useCollection';
import { useActivityLog } from '../hooks/useActivityLog';
import { useCreateIntent, useParamState } from '../hooks/useParams';
import { BillForm, OpForm, PatientForm } from '../components/editors';
import QueueBoard from '../components/QueueBoard';
import {
  Badge, Button, ConfirmDialog, ExportButton, FilterBar, FilterSelect, IconButton, Page, PageHeader,
  PageLoader, Person, SearchInput, StatCard, StatGrid, useAction,
} from '../components/ui';
import { canEditPage, canWriteCollection } from '../utils/roles';
import { OP_STATUSES } from '../utils/formConfigs';
import { exportCsv, matches, relativeTime, sameText, uniqueNames } from '../utils/format';

// Urgent patients first, then by token number.
const queueOrder = (a, b) =>
  (a.priority === 'Urgent' ? 0 : 1) - (b.priority === 'Urgent' ? 0 : 1) ||
  String(a.token).localeCompare(String(b.token), undefined, { numeric: true });

export default function OPQueue({ navigate, params }) {
  const { profile } = useAuth();
  const canEdit = canEditPage(profile, 'opPatients');
  const { data: queue, loading, update, remove, removeMany, canDelete } = useCollection('opPatients');
  const doctors = useCollection('doctors');
  const { data: patients } = useCollection('patients');
  const log = useActivityLog();
  const run = useAction();

  const [search, setSearch] = useParamState(params, 'q');
  const [doctor, setDoctor] = useState('');
  const [editing, setEditing] = useState(null);
  const [registering, setRegistering] = useState(null);
  const [billing, setBilling] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [clearing, setClearing] = useState(null);

  useCreateIntent({ params, navigate, page: 'opPatients', allowed: canEdit, open: () => setEditing({}) });

  if (loading) return <PageLoader />;

  const visible = queue
    .filter((q) => !doctor || q.doctor === doctor)
    .filter((q) => matches(search, q.name, q.doctor, q.token, q.complaint))
    .sort(queueOrder);

  const waiting = queue.filter((q) => q.status === 'Waiting').sort(queueOrder);
  const nextUp = waiting.find((q) => !doctor || q.doctor === doctor);
  const count = (s) => queue.filter((q) => q.status === s).length;

  const move = (item, status) =>
    run(async () => {
      await update(item.id, { status });
      log(item.name, `OP status: ${status} (token ${item.token})`);
      // the doctor shows as busy while consulting
      const d = doctors.data.find((x) => sameText(x.name, item.doctor));
      if (d && doctors.canWrite) {
        if (status === 'In Consultation' && d.status === 'Available') await doctors.update(d.id, { status: 'On Duty' });
        const others = queue.some((q) => q.id !== item.id && q.status === 'In Consultation' && sameText(q.doctor, item.doctor));
        if (status !== 'In Consultation' && d.status === 'On Duty' && !others) await doctors.update(d.id, { status: 'Available' });
      }
    }, `${item.token} moved to ${status}`);

  const isRegistered = (name) => patients.some((p) => sameText(p.name, name));
  const canRegister = canWriteCollection(profile, 'patients');
  const canBill = canWriteCollection(profile, 'billing');

  return (
    <Page>
      <PageHeader
        title="OP Queue"
        description="Out-patient tokens from arrival to completed consultation."
        actions={
          <>
            <ExportButton
              disabled={!visible.length}
              onClick={() => exportCsv('op-queue.csv', [
                { label: 'Token', value: (p) => p.token },
                { label: 'Patient', value: (p) => p.name },
                { label: 'Doctor', value: (p) => p.doctor },
                { label: 'Priority', value: (p) => p.priority },
                { label: 'Complaint', value: (p) => p.complaint },
                { label: 'Status', value: (p) => p.status },
              ], visible)}
            />
            {canEdit && <Button icon={PhoneCall} disabled={!nextUp} onClick={() => move(nextUp, 'In Consultation')}>Call next{nextUp ? ` (${nextUp.token})` : ''}</Button>}
            {canEdit && <Button variant="primary" icon={ListPlus} onClick={() => setEditing({})}>Issue token</Button>}
          </>
        }
      />

      <StatGrid>
        <StatCard label="Total tokens" value={queue.length} icon={Activity} />
        <StatCard label="Waiting" value={count('Waiting')} hint={`${waiting.filter((q) => q.priority === 'Urgent').length} urgent`} icon={Clock} tone="amber" />
        <StatCard label="In consultation" value={count('In Consultation')} icon={Stethoscope} tone="violet" />
        <StatCard label="Completed" value={count('Completed')} icon={CheckCircle2} tone="green" />
      </StatGrid>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search token, patient, complaint…" />
        <FilterSelect label="All doctors" value={doctor} onChange={setDoctor} options={uniqueNames(queue, 'doctor')} />
      </FilterBar>

      <QueueBoard
        items={visible}
        statuses={OP_STATUSES}
        advanceLabel={{ Waiting: 'Start consultation', 'In Consultation': 'Complete' }}
        onMove={canEdit ? move : undefined}
        onEdit={canEdit ? setEditing : undefined}
        onDelete={canDelete ? setDeleting : undefined}
        columnAction={(status, list) =>
          status === 'Completed' && canDelete && list.length > 0 && (
            <Button size="xs" variant="ghost" icon={Eraser} onClick={() => setClearing(list)}>Clear</Button>
          )}
        extraAction={(q) => (
          <>
            {canRegister && !isRegistered(q.name) && (
              <IconButton size="sm" label="Register as patient" icon={UserPlus} tone="brand" onClick={() => setRegistering({ name: q.name, phone: q.phone || '', doctor: q.doctor, condition: q.complaint || '', status: 'Checkup' })} />
            )}
            {canBill && q.status === 'Completed' && (
              <Button size="xs" icon={Receipt} onClick={() => setBilling({ patient: q.name, service: 'Consultation' })}>Bill</Button>
            )}
          </>
        )}
        renderCard={(q) => (
          <>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="font-mono text-sm font-bold text-brand-600">{q.token}</span>
              <span className="flex items-center gap-1.5">
                {q.priority === 'Urgent' && <Badge tone="red" dot>Urgent</Badge>}
                <span className="text-2xs text-fg-subtle">{relativeTime(q.createdAt)}</span>
              </span>
            </div>
            <Person name={q.name} sub={q.doctor} size={32} />
            {q.complaint && <p className="text-xs text-fg-muted mt-2 line-clamp-2">{q.complaint}</p>}
          </>
        )}
      />

      {editing && <OpForm record={editing} onClose={() => setEditing(null)} />}
      {registering && <PatientForm record={registering} onClose={() => setRegistering(null)} />}
      {billing && <BillForm record={billing} onClose={() => setBilling(null)} />}
      {deleting && (
        <ConfirmDialog
          title="Remove from queue"
          message={`Remove ${deleting.name} (${deleting.token}) from the OP queue?`}
          confirmLabel="Remove"
          successMessage="Removed from queue"
          onConfirm={() => remove(deleting.id)}
          onClose={() => setDeleting(null)}
        />
      )}
      {clearing && (
        <ConfirmDialog
          title="Clear completed"
          message={`Remove ${clearing.length} completed consultation(s) from the board? The patient timeline keeps the history.`}
          confirmLabel="Clear"
          successMessage="Completed entries cleared"
          onConfirm={() => removeMany(clearing.map((q) => q.id))}
          onClose={() => setClearing(null)}
        />
      )}
    </Page>
  );
}
