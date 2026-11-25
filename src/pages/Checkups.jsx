import React, { useState } from 'react';
import { CalendarDays, CheckCircle2, ClipboardCheck, Clock, Eraser, HeartPulse, Receipt } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCollection } from '../hooks/useCollection';
import { useActivityLog } from '../hooks/useActivityLog';
import { useCreateIntent, useParamState } from '../hooks/useParams';
import { BillForm, CheckupForm } from '../components/editors';
import QueueBoard from '../components/QueueBoard';
import {
  Badge, Button, ConfirmDialog, ExportButton, FilterBar, FilterSelect, Page, PageHeader, PageLoader,
  Person, SearchInput, StatCard, StatGrid, useAction,
} from '../components/ui';
import { canEditPage, canWriteCollection } from '../utils/roles';
import { CHECKUP_STATUSES, CHECKUP_TYPES } from '../utils/formConfigs';
import { exportCsv, formatDate, formatTime, matches, sameText, todayISO } from '../utils/format';

export default function Checkups({ navigate, params }) {
  const { profile } = useAuth();
  const canEdit = canEditPage(profile, 'checkupPatients');
  const { data: checkups, loading, update, remove, removeMany, canDelete } = useCollection('checkupPatients');
  const patients = useCollection('patients');
  const log = useActivityLog();
  const run = useAction();

  const [search, setSearch] = useParamState(params, 'q');
  const [type, setType] = useState('');
  const [editing, setEditing] = useState(null);
  const [billing, setBilling] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [clearing, setClearing] = useState(null);

  useCreateIntent({ params, navigate, page: 'checkupPatients', allowed: canEdit, open: () => setEditing({}) });

  if (loading) return <PageLoader />;

  const visible = checkups
    .filter((c) => !type || c.checkupType === type)
    .filter((c) => matches(search, c.name, c.doctor, c.checkupType, c.notes))
    .sort((a, b) => `${a.date || ''} ${a.time || ''}`.localeCompare(`${b.date || ''} ${b.time || ''}`));
  const count = (s) => checkups.filter((c) => c.status === s).length;
  const today = todayISO();

  const move = (item, status) =>
    run(async () => {
      await update(item.id, { status });
      log(item.name, `${item.checkupType || 'Checkup'}: ${status}`);
      // a completed checkup updates the patient's "last checkup" date
      if (status === 'Completed' && patients.canWrite) {
        const p = patients.data.find((x) => sameText(x.name, item.name));
        if (p) await patients.update(p.id, { lastCheckup: todayISO() });
      }
    }, `${item.name} moved to ${status}`);

  return (
    <Page>
      <PageHeader
        title="Checkups"
        description="Preventive and routine health checkups."
        actions={
          <>
            <ExportButton
              disabled={!visible.length}
              onClick={() => exportCsv('checkups.csv', [
                { label: 'Patient', value: (p) => p.name },
                { label: 'Checkup', value: (p) => p.checkupType },
                { label: 'Doctor', value: (p) => p.doctor },
                { label: 'Date', value: (p) => p.date },
                { label: 'Time', value: (p) => p.time },
                { label: 'Status', value: (p) => p.status },
                { label: 'Notes', value: (p) => p.notes },
              ], visible)}
            />
            {canEdit && <Button variant="primary" icon={ClipboardCheck} onClick={() => setEditing({})}>Book checkup</Button>}
          </>
        }
      />

      <StatGrid>
        <StatCard label="Total checkups" value={checkups.length} icon={HeartPulse} />
        <StatCard label="Due today" value={checkups.filter((c) => c.date === today && c.status !== 'Completed').length} icon={CalendarDays} tone="violet" />
        <StatCard label="Waiting" value={count('Waiting')} icon={Clock} tone="amber" />
        <StatCard label="Completed" value={count('Completed')} icon={CheckCircle2} tone="green" />
      </StatGrid>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search patient, doctor, notes…" />
        <FilterSelect label="All checkup types" value={type} onChange={setType} options={CHECKUP_TYPES} />
      </FilterBar>

      <QueueBoard
        items={visible}
        statuses={CHECKUP_STATUSES}
        advanceLabel={{ Waiting: 'Start checkup', 'In Progress': 'Complete' }}
        onMove={canEdit ? move : undefined}
        onEdit={canEdit ? setEditing : undefined}
        onDelete={canDelete ? setDeleting : undefined}
        columnAction={(status, list) =>
          status === 'Completed' && canDelete && list.length > 0 && (
            <Button size="xs" variant="ghost" icon={Eraser} onClick={() => setClearing(list)}>Clear</Button>
          )}
        extraAction={(c) =>
          c.status === 'Completed' && canWriteCollection(profile, 'billing') && (
            <Button size="xs" icon={Receipt} onClick={() => setBilling({ patient: c.name, service: 'Checkup' })}>Bill</Button>
          )}
        renderCard={(c) => (
          <>
            <div className="flex items-center justify-between gap-2 mb-2">
              <Badge tone="brand">{c.checkupType || 'Checkup'}</Badge>
              <span className="text-2xs font-semibold text-fg-subtle tabular">
                {c.date ? `${c.date === today ? 'Today' : formatDate(c.date, { month: 'short', day: 'numeric' })} · ` : ''}{formatTime(c.time)}
              </span>
            </div>
            <Person name={c.name} sub={c.doctor} size={32} />
            {c.notes && <p className="text-xs text-fg-muted mt-2 line-clamp-2">{c.notes}</p>}
          </>
        )}
      />

      {editing && <CheckupForm record={editing} onClose={() => setEditing(null)} />}
      {billing && <BillForm record={billing} onClose={() => setBilling(null)} />}
      {deleting && (
        <ConfirmDialog
          title="Remove checkup"
          message={`Remove the checkup for ${deleting.name}?`}
          confirmLabel="Remove"
          successMessage="Checkup removed"
          onConfirm={() => remove(deleting.id)}
          onClose={() => setDeleting(null)}
        />
      )}
      {clearing && (
        <ConfirmDialog
          title="Clear completed"
          message={`Remove ${clearing.length} completed checkup(s) from the board?`}
          confirmLabel="Clear"
          successMessage="Completed checkups cleared"
          onConfirm={() => removeMany(clearing.map((c) => c.id))}
          onClose={() => setClearing(null)}
        />
      )}
    </Page>
  );
}
