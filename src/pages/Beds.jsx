import React, { useState } from 'react';
import { BedDouble, CheckCircle2, Layers, LogOut, Pencil, Plus, Sparkles, Trash2, UserPlus, Wrench } from 'lucide-react';
import { useCollection } from '../hooks/useCollection';
import { useActivityLog } from '../hooks/useActivityLog';
import { useBedSync } from '../hooks/useWorkflows';
import { useCreateIntent, useParamState } from '../hooks/useParams';
import { BedForm } from '../components/editors';
import {
  Badge, Button, Card, CardHeader, ConfirmDialog, DefinitionList, EmptyState, ExportButton, FilterBar,
  FilterSelect, Modal, Page, PageHeader, PageLoader, Progress, RecordForm, SearchInput, StatCard, StatGrid,
  StatusBadge, Tabs, useAction, cx,
} from '../components/ui';
import { BED_STATUSES, WARDS } from '../utils/formConfigs';
import { exportCsv, matches, relativeTime, sameText, uniqueNames } from '../utils/format';

const TILE = {
  Available: 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300',
  Occupied: 'border-red-300 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300',
  Cleaning: 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300',
  Maintenance: 'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-500/30 dark:bg-slate-500/10 dark:text-slate-300',
};

// Older records have no `number` and used the document id as the label.
const labelOf = (b) => b.number || b.id;

export default function Beds({ navigate, params }) {
  const { data: beds, loading, add, addMany, update, remove, removeMany, canWrite, canDelete } = useCollection('beds');
  const log = useActivityLog();
  const syncRoom = useBedSync();
  const run = useAction();

  const [search, setSearch] = useParamState(params, 'q');
  const [status, setStatus] = useState('All');
  const [ward, setWard] = useState('');
  const [editing, setEditing] = useState(null);
  const [bulk, setBulk] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useCreateIntent({ params, navigate, page: 'beds', allowed: canWrite, open: () => setEditing({}) });

  if (loading) return <PageLoader />;

  const count = (s) => beds.filter((b) => b.status === s).length;
  const visible = beds
    .filter((b) => status === 'All' || b.status === status)
    .filter((b) => !ward || (b.ward || 'General') === ward)
    .filter((b) => matches(search, labelOf(b), b.ward, b.patient))
    .sort((a, b) => String(labelOf(a)).localeCompare(String(labelOf(b)), undefined, { numeric: true }));
  const wards = [...new Set(visible.map((b) => b.ward || 'General'))].sort();
  const open = beds.find((b) => b.id === openId);

  const discharge = async (b) => {
    const ok = await run(async () => {
      await update(b.id, { status: 'Cleaning', patient: '', occupiedAt: '' });
      await syncRoom(labelOf(b), '', b.patient);
      if (b.patient) log(b.patient, `Discharged from bed ${labelOf(b)}`);
    }, `Bed ${labelOf(b)} sent for cleaning`);
    if (ok) setOpenId(null);
  };
  const setBedStatus = async (b, next, message) => {
    if (await run(() => update(b.id, { status: next, patient: '', occupiedAt: '' }), message)) setOpenId(null);
  };

  // Creates a numbered range, e.g. ICU-01 … ICU-10, skipping existing numbers.
  const createRange = async ({ prefix, from, to, ward: w }) => {
    const width = Math.max(2, String(to).length);
    const items = [];
    for (let n = from; n <= to; n += 1) {
      const number = `${prefix}${String(n).padStart(width, '0')}`;
      if (!beds.some((b) => sameText(labelOf(b), number))) items.push({ number, ward: w, status: 'Available', patient: '' });
    }
    if (!items.length) throw new Error('All of those bed numbers already exist.');
    if (items.length === 1) await add(items[0]);
    else await addMany(items);
  };

  return (
    <Page>
      <PageHeader
        title="Bed Management"
        description="Live occupancy by ward. Select a bed to admit, discharge or update it."
        actions={
          <>
            <ExportButton
              disabled={!visible.length}
              onClick={() => exportCsv('beds.csv', [
                { label: 'Bed', value: labelOf }, { label: 'Ward', value: (b) => b.ward },
                { label: 'Status', value: (b) => b.status }, { label: 'Patient', value: (b) => b.patient },
              ], visible)}
            />
            {canWrite && <Button icon={Layers} onClick={() => setBulk(true)}>Add multiple</Button>}
            {canWrite && <Button variant="primary" icon={Plus} onClick={() => setEditing({})}>Add bed</Button>}
          </>
        }
      />

      <StatGrid cols={5}>
        <StatCard label="Total beds" value={beds.length} icon={BedDouble} active={status === 'All'} onClick={() => setStatus('All')} />
        <StatCard label="Available" value={count('Available')} icon={CheckCircle2} tone="green" active={status === 'Available'} onClick={() => setStatus('Available')} />
        <StatCard label="Occupied" value={count('Occupied')} icon={UserPlus} tone="red" active={status === 'Occupied'} onClick={() => setStatus('Occupied')} />
        <StatCard label="Cleaning" value={count('Cleaning')} icon={Sparkles} tone="amber" active={status === 'Cleaning'} onClick={() => setStatus('Cleaning')} />
        <StatCard label="Maintenance" value={count('Maintenance')} icon={Wrench} tone="gray" active={status === 'Maintenance'} onClick={() => setStatus('Maintenance')} />
      </StatGrid>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search bed or patient…" />
        <FilterSelect label="All wards" value={ward} onChange={setWard} options={uniqueNames(beds.map((b) => ({ name: b.ward || 'General' })))} />
        <Tabs value={status} onChange={setStatus} options={['All', ...BED_STATUSES]} />
      </FilterBar>

      {wards.length === 0 ? (
        <Card>
          <EmptyState
            icon={BedDouble}
            title={beds.length ? 'No beds match your filters' : 'No beds configured yet'}
            action={!beds.length && canWrite && <Button variant="primary" icon={Layers} onClick={() => setBulk(true)}>Set up beds</Button>}
          />
        </Card>
      ) : wards.map((w) => {
        const all = beds.filter((b) => (b.ward || 'General') === w);
        const used = all.filter((b) => b.status === 'Occupied').length;
        const pct = Math.round((used / all.length) * 100);
        return (
          <Card key={w}>
            <CardHeader
              title={`${w} ward`}
              description={`${used} of ${all.length} occupied`}
              actions={<div className="flex items-center gap-3 w-40 sm:w-56"><Progress value={pct} tone={pct >= 85 ? 'red' : pct >= 60 ? 'amber' : 'green'} className="flex-1" /><span className="text-xs font-bold text-fg tabular w-9 text-right">{pct}%</span></div>}
            />
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-3">
              {visible.filter((b) => (b.ward || 'General') === w).map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setOpenId(b.id)}
                  className={cx('rounded-xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md min-w-0', TILE[b.status] || TILE.Maintenance)}
                >
                  <span className="flex items-center justify-between gap-1">
                    <span className="text-sm font-extrabold truncate">{labelOf(b)}</span>
                    <BedDouble size={15} className="flex-shrink-0 opacity-70" />
                  </span>
                  <span className="block text-2xs font-semibold mt-1">{b.status}</span>
                  <span className="block text-xs truncate mt-0.5 opacity-80">{b.patient || ' '}</span>
                </button>
              ))}
            </div>
          </Card>
        );
      })}

      {open && (
        <Modal
          title={`Bed ${labelOf(open)}`}
          description={`${open.ward || 'General'} ward`}
          onClose={() => setOpenId(null)}
          footer={
            <>
              {canDelete && <Button variant="danger-soft" icon={Trash2} className="mr-auto" onClick={() => setDeleting(open)}>Delete</Button>}
              {canWrite && <Button icon={Pencil} onClick={() => { setEditing(open); setOpenId(null); }}>Edit</Button>}
              {canWrite && open.status === 'Available' && (
                <>
                  <Button icon={Wrench} onClick={() => setBedStatus(open, 'Maintenance', 'Bed marked under maintenance')}>Maintenance</Button>
                  <Button variant="primary" icon={UserPlus} onClick={() => { setEditing({ ...open, status: 'Occupied' }); setOpenId(null); }}>Admit patient</Button>
                </>
              )}
              {canWrite && open.status === 'Occupied' && <Button variant="primary" icon={LogOut} onClick={() => discharge(open)}>Discharge</Button>}
              {canWrite && (open.status === 'Cleaning' || open.status === 'Maintenance') && (
                <Button variant="success" icon={CheckCircle2} onClick={() => setBedStatus(open, 'Available', 'Bed is ready')}>Mark ready</Button>
              )}
            </>
          }
        >
          <DefinitionList items={[
            ['Status', <StatusBadge status={open.status} />],
            ['Patient', open.patient],
            ['Ward', open.ward],
            ['Occupied since', open.occupiedAt ? relativeTime(open.occupiedAt) : ''],
          ]} />
          {!canWrite && <Badge className="mt-4">Read only</Badge>}
        </Modal>
      )}

      {editing && <BedForm record={editing} onClose={() => setEditing(null)} />}

      {bulk && (
        <RecordForm
          title="Add multiple beds"
          description="Creates a numbered range of available beds."
          submitLabel="Create beds"
          successMessage="Beds created"
          fields={[
            { name: 'ward', label: 'Ward', type: 'combo', required: true, suggestions: WARDS, defaultValue: 'General' },
            { name: 'prefix', label: 'Number prefix', required: true, defaultValue: 'B-' },
            { name: 'from', label: 'From', type: 'number', required: true, min: 1, max: 9999, step: 1, defaultValue: 1 },
            { name: 'to', label: 'To', type: 'number', required: true, min: 1, max: 9999, step: 1, defaultValue: 10 },
          ]}
          validate={(v) => (v.to < v.from ? '"To" must not be smaller than "From".' : v.to - v.from > 199 ? 'Create at most 200 beds at a time.' : null)}
          onSubmit={createRange}
          onClose={() => setBulk(false)}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete bed"
          message={`Delete bed ${labelOf(deleting)}?${deleting.status === 'Occupied' ? ' It is currently occupied.' : ''}`}
          onConfirm={async () => {
            await removeMany([deleting.id]);
            if (deleting.patient) await syncRoom(labelOf(deleting), '', deleting.patient);
            setOpenId(null);
          }}
          onClose={() => setDeleting(null)}
        />
      )}
    </Page>
  );
}
