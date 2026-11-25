import React, { useState } from 'react';
import { Ambulance as AmbulanceIcon, CheckCircle2, MapPin, Navigation, Pencil, Phone, Plus, RotateCcw, Timer, Trash2, User, Wrench } from 'lucide-react';
import { useCollection } from '../hooks/useCollection';
import { useActivityLog } from '../hooks/useActivityLog';
import { useCreateIntent, useParamState } from '../hooks/useParams';
import EntityEditor from '../components/editors/EntityEditor';
import {
  Badge, Button, Card, ConfirmDialog, EmptyState, ExportButton, FilterBar, IconButton, IconTile, Page,
  PageHeader, PageLoader, SearchInput, StatCard, StatGrid, StatusBadge, Tabs, useAction,
} from '../components/ui';
import { AMBULANCE_STATUSES, ambulanceFields } from '../utils/formConfigs';
import { exportCsv, matches, relativeTime, sameText } from '../utils/format';

// Older records have no `vehicle` field and used the document id as the label.
const labelOf = (a) => a.vehicle || a.id;

export default function Ambulance({ navigate, params }) {
  const store = useCollection('ambulances');
  const { data: ambulances, loading, update, remove, canWrite, canDelete } = store;
  const log = useActivityLog();
  const run = useAction();

  const [search, setSearch] = useParamState(params, 'q');
  const [status, setStatus] = useState('All');
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useCreateIntent({ params, navigate, page: 'ambulance', allowed: canWrite, open: () => setEditing({}) });

  if (loading) return <PageLoader />;

  const count = (s) => ambulances.filter((a) => a.status === s).length;
  const visible = ambulances
    .filter((a) => status === 'All' || a.status === status)
    .filter((a) => matches(search, labelOf(a), a.driver, a.destination, a.type))
    .sort((a, b) => String(labelOf(a)).localeCompare(String(labelOf(b)), undefined, { numeric: true }));

  const release = (a, next, message) =>
    run(() => update(a.id, { status: next, destination: '', eta: '', patient: '', dispatchedAt: '' }), message);

  return (
    <Page>
      <PageHeader
        title="Ambulance"
        description="Fleet availability and dispatch."
        actions={
          <>
            <ExportButton
              disabled={!visible.length}
              onClick={() => exportCsv('ambulances.csv', [
                { label: 'Vehicle', value: labelOf }, { label: 'Type', value: (a) => a.type },
                { label: 'Driver', value: (a) => a.driver }, { label: 'Phone', value: (a) => a.phone },
                { label: 'Status', value: (a) => a.status }, { label: 'Destination', value: (a) => a.destination },
                { label: 'ETA', value: (a) => a.eta },
              ], visible)}
            />
            {canWrite && <Button variant="primary" icon={Plus} onClick={() => setEditing({})}>Add ambulance</Button>}
          </>
        }
      />

      <StatGrid>
        <StatCard label="Fleet size" value={ambulances.length} icon={AmbulanceIcon} active={status === 'All'} onClick={() => setStatus('All')} />
        <StatCard label="Available" value={count('Available')} icon={CheckCircle2} tone="green" active={status === 'Available'} onClick={() => setStatus('Available')} />
        <StatCard label="On route" value={count('On Route')} icon={Navigation} tone="blue" active={status === 'On Route'} onClick={() => setStatus('On Route')} />
        <StatCard label="Maintenance" value={count('Maintenance')} icon={Wrench} tone="gray" active={status === 'Maintenance'} onClick={() => setStatus('Maintenance')} />
      </StatGrid>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search vehicle, driver, destination…" />
        <Tabs value={status} onChange={setStatus} options={['All', ...AMBULANCE_STATUSES]} />
      </FilterBar>

      {visible.length === 0 ? (
        <Card>
          <EmptyState
            icon={AmbulanceIcon}
            title={ambulances.length ? 'No ambulances match your filters' : 'No ambulances added yet'}
            action={!ambulances.length && canWrite && <Button variant="primary" onClick={() => setEditing({})}>Add first ambulance</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visible.map((a) => (
            <Card key={a.id} className="p-5 flex flex-col">
              <div className="flex items-start gap-3">
                <IconTile icon={AmbulanceIcon} size={44} tone={a.status === 'On Route' ? 'blue' : a.status === 'Available' ? 'green' : 'gray'} />
                <div className="flex-1 min-w-0">
                  <p className="text-base font-extrabold text-fg truncate">{labelOf(a)}</p>
                  <p className="text-xs text-fg-subtle truncate">{a.type || 'Ambulance'}</p>
                </div>
                <StatusBadge status={a.status} />
              </div>

              <div className="space-y-2 mt-4 text-sm text-fg-muted flex-1">
                <p className="flex items-center gap-2"><User size={14} className="text-fg-subtle" /> {a.driver || 'No driver assigned'}</p>
                {a.phone && <a href={`tel:${a.phone}`} className="flex items-center gap-2 hover:text-brand-600"><Phone size={14} className="text-fg-subtle" /> {a.phone}</a>}
                {a.status === 'On Route' && (
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-500/10 p-3 space-y-1.5">
                    <p className="flex items-center gap-2 text-fg"><MapPin size={14} className="text-blue-600" /> {a.destination || 'Destination not set'}</p>
                    <p className="flex flex-wrap items-center gap-2 text-xs">
                      <Timer size={13} className="text-blue-600" /> ETA {a.eta || '—'}
                      {a.dispatchedAt && <span className="text-fg-subtle">· dispatched {relativeTime(a.dispatchedAt)}</span>}
                    </p>
                    {a.patient && <Badge tone="blue">Patient: {a.patient}</Badge>}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-line">
                {canWrite && a.status === 'Available' && (
                  <Button size="sm" variant="primary" icon={Navigation} onClick={() => setEditing({ ...a, status: 'On Route' })}>Dispatch</Button>
                )}
                {canWrite && a.status === 'On Route' && (
                  <Button size="sm" variant="success" icon={RotateCcw} onClick={() => release(a, 'Available', `${labelOf(a)} is back and available`)}>Mark returned</Button>
                )}
                {canWrite && a.status === 'Maintenance' && (
                  <Button size="sm" icon={CheckCircle2} onClick={() => release(a, 'Available', `${labelOf(a)} is back in service`)}>Back in service</Button>
                )}
                <span className="ml-auto flex">
                  {canWrite && a.status === 'Available' && <IconButton label="Send to maintenance" icon={Wrench} onClick={() => release(a, 'Maintenance', `${labelOf(a)} sent to maintenance`)} />}
                  {canWrite && <IconButton label="Edit" icon={Pencil} tone="brand" onClick={() => setEditing(a)} />}
                  {canDelete && <IconButton label="Delete" icon={Trash2} tone="red" onClick={() => setDeleting(a)} />}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {editing && (
        <EntityEditor
          noun="Ambulance"
          record={{ ...editing, vehicle: editing.vehicle || editing.id || '' }}
          store={store}
          fields={ambulanceFields()}
          submitLabel={editing.id && editing.status === 'On Route' ? 'Save trip' : undefined}
          validate={(v) =>
            ambulances.some((a) => a.id !== editing.id && sameText(labelOf(a), v.vehicle))
              ? `An ambulance named "${v.vehicle}" already exists.`
              : null}
          prepare={(v) => ({
            ...v,
            dispatchedAt: v.status === 'On Route'
              ? ambulances.find((a) => a.id === editing.id)?.dispatchedAt || new Date().toISOString()
              : '',
          })}
          afterSave={(data) => {
            const before = ambulances.find((a) => a.id === editing.id);
            if (data.status === 'On Route' && data.patient && before?.status !== 'On Route') {
              log(data.patient, `Ambulance ${data.vehicle} dispatched to ${data.destination}`);
            }
          }}
          onClose={() => setEditing(null)}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete ambulance"
          message={`Delete ${labelOf(deleting)} from the fleet?`}
          onConfirm={() => remove(deleting.id)}
          onClose={() => setDeleting(null)}
        />
      )}
    </Page>
  );
}
