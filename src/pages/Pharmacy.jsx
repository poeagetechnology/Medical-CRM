import React, { useState } from 'react';
import { AlertTriangle, CircleDollarSign, Download, MinusCircle, PackageCheck, PackagePlus, PackageX, Pencil, Pill, Plus, Trash2 } from 'lucide-react';
import { useCollection } from '../hooks/useCollection';
import { useActivityLog } from '../hooks/useActivityLog';
import { useCreateIntent, useParamState } from '../hooks/useParams';
import EntityEditor from '../components/editors/EntityEditor';
import {
  Badge, Button, ConfirmDialog, DataTable, ExportButton, FilterBar, FilterSelect, IconButton, Notice, Page,
  PageHeader, PageLoader, RecordForm, SearchInput, StatCard, StatGrid, StatusBadge, Tabs,
} from '../components/ui';
import { DEFAULT_REORDER, MEDICINE_STATUSES, medicineFields, medicineStatus } from '../utils/formConfigs';
import { addDays, exportCsv, formatDate, formatMoney, formatMoneyShort, matches, parseAmount, sameText, todayISO, uniqueNames } from '../utils/format';

const CSV = [
  { label: 'Medicine', value: (m) => m.name },
  { label: 'Category', value: (m) => m.category },
  { label: 'Stock', value: (m) => m.stock },
  { label: 'Reorder level', value: (m) => m.reorderLevel },
  { label: 'Price', value: (m) => parseAmount(m.price) },
  { label: 'Supplier', value: (m) => m.supplier },
  { label: 'Batch', value: (m) => m.batch },
  { label: 'Expiry', value: (m) => m.expiry },
  { label: 'Status', value: (m) => m.status },
];

export default function Pharmacy({ navigate, params }) {
  const store = useCollection('medicines');
  const { data: medicines, loading, update, remove, removeMany, canWrite, canDelete } = store;
  const patients = useCollection('patients');
  const log = useActivityLog();

  const [search, setSearch] = useParamState(params, 'q');
  const [status, setStatus] = useParamState(params, 'status', 'All');
  const [category, setCategory] = useState('');
  const [editing, setEditing] = useState(null);
  const [stockAction, setStockAction] = useState(null);   // { type: 'restock' | 'dispense', medicine }
  const [deleting, setDeleting] = useState(null);

  useCreateIntent({ params, navigate, page: 'medicalCenter', allowed: canWrite, open: () => setEditing({}) });

  if (loading) return <PageLoader />;

  const soon = addDays(todayISO(), 90);
  const expiring = medicines.filter((m) => m.expiry && m.expiry <= soon);
  const value = medicines.reduce((t, m) => t + (Number(m.stock) || 0) * parseAmount(m.price), 0);
  const count = (s) => medicines.filter((m) => m.status === s).length;

  const rows = medicines
    .filter((m) => {
      if (status === 'All') return true;
      if (status === 'attention') return m.status !== 'In Stock';
      if (status === 'expiring') return m.expiry && m.expiry <= soon;
      return m.status === status;
    })
    .filter((m) => !category || m.category === category)
    .filter((m) => matches(search, m.name, m.category, m.supplier, m.batch));

  const applyStock = async ({ qty, patient }) => {
    const { type, medicine } = stockAction;
    const current = medicines.find((m) => m.id === medicine.id) || medicine;
    const stock = (Number(current.stock) || 0) + (type === 'restock' ? qty : -qty);
    if (stock < 0) throw new Error(`Only ${current.stock} units are in stock.`);
    await update(current.id, { stock, status: medicineStatus(stock, current.reorderLevel ?? DEFAULT_REORDER) });
    if (type === 'dispense' && patient) log(patient, `Dispensed ${qty} × ${current.name}`);
  };

  const live = stockAction && (medicines.find((m) => m.id === stockAction.medicine.id) || stockAction.medicine);

  return (
    <Page>
      <PageHeader
        title="Medical Center"
        description="Pharmacy inventory, stock movements and expiry."
        actions={
          <>
            <ExportButton onClick={() => exportCsv('medicines.csv', CSV, rows)} disabled={!rows.length} />
            {canWrite && <Button variant="primary" icon={Plus} onClick={() => setEditing({})}>Add medicine</Button>}
          </>
        }
      />

      <StatGrid>
        <StatCard label="Medicines" value={medicines.length} icon={Pill} active={status === 'All'} onClick={() => setStatus('All')} />
        <StatCard label="Low stock" value={count('Low Stock')} icon={AlertTriangle} tone="amber" active={status === 'Low Stock'} onClick={() => setStatus('Low Stock')} />
        <StatCard label="Out of stock" value={count('Out of Stock')} icon={PackageX} tone="red" active={status === 'Out of Stock'} onClick={() => setStatus('Out of Stock')} />
        <StatCard label="Inventory value" value={formatMoneyShort(value)} icon={CircleDollarSign} tone="green" />
      </StatGrid>

      {expiring.length > 0 && (
        <Notice icon={AlertTriangle} action={<Button size="sm" onClick={() => setStatus('expiring')}>Show</Button>}>
          {expiring.length} item(s) expired or expiring within 90 days.
        </Notice>
      )}

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search medicine, supplier, batch…" />
        <FilterSelect label="All categories" value={category} onChange={setCategory} options={uniqueNames(medicines, 'category')} />
        <Tabs
          value={status}
          onChange={setStatus}
          options={['All', ...MEDICINE_STATUSES, { value: 'attention', label: 'Needs reorder' }, { value: 'expiring', label: 'Expiring' }]}
        />
      </FilterBar>

      <DataTable
        rows={rows}
        initialSort={{ key: 'name', dir: 1 }}
        columns={[
          { key: 'name', header: 'Medicine', render: (m) => (
            <div>
              <p className="font-semibold text-fg">{m.name}</p>
              <p className="text-xs text-fg-subtle">{[m.category, m.supplier].filter(Boolean).join(' · ')}</p>
            </div>
          ) },
          { key: 'stock', header: 'Stock', align: 'right', sortValue: (m) => Number(m.stock) || 0, render: (m) => <span className="font-bold text-fg tabular">{m.stock}</span> },
          { key: 'price', header: 'Unit price', align: 'right', hide: 'md', sortValue: (m) => parseAmount(m.price), render: (m) => <span className="tabular">{m.price}</span> },
          { key: 'expiry', header: 'Expiry', hide: 'lg', render: (m) => (
            !m.expiry ? '—' : m.expiry < todayISO() ? <Badge tone="red">Expired {formatDate(m.expiry)}</Badge>
              : m.expiry <= soon ? <Badge tone="amber">{formatDate(m.expiry)}</Badge> : formatDate(m.expiry)
          ) },
          { key: 'status', header: 'Status', render: (m) => <StatusBadge status={m.status} /> },
        ]}
        rowActions={(m) => (
          <>
            {canWrite && <Button size="xs" icon={PackagePlus} onClick={() => setStockAction({ type: 'restock', medicine: m })}>Restock</Button>}
            {canWrite && <IconButton label="Dispense" icon={MinusCircle} tone="brand" disabled={!(Number(m.stock) > 0)} onClick={() => setStockAction({ type: 'dispense', medicine: m })} />}
            {canWrite && <IconButton label="Edit" icon={Pencil} tone="brand" onClick={() => setEditing(m)} />}
            {canDelete && <IconButton label="Delete" icon={Trash2} tone="red" onClick={() => setDeleting({ rows: [m] })} />}
          </>
        )}
        bulkActions={(list) => <Button size="sm" icon={Download} onClick={() => exportCsv('medicines-selected.csv', CSV, list)}>Export</Button>}
        onBulkDelete={canDelete ? (list, clear) => setDeleting({ rows: list, clear }) : undefined}
        empty={{ icon: PackageCheck, title: medicines.length ? 'No medicines match your filters' : 'Inventory is empty' }}
      />

      {editing && (
        <EntityEditor
          noun="Medicine"
          record={editing.id ? { ...editing, price: parseAmount(editing.price) } : editing}
          store={store}
          fields={medicineFields()}
          validate={(v) =>
            medicines.some((m) => m.id !== editing.id && sameText(m.name, v.name) && sameText(m.batch, v.batch))
              ? `"${v.name}" with this batch is already in the inventory. Edit or restock that entry instead.`
              : null}
          prepare={(v) => ({ ...v, price: formatMoney(v.price), status: medicineStatus(v.stock, v.reorderLevel) })}
          onClose={() => setEditing(null)}
        />
      )}

      {stockAction && (
        <RecordForm
          width="max-w-md"
          title={`${stockAction.type === 'restock' ? 'Restock' : 'Dispense'} — ${live.name}`}
          description={`Current stock: ${live.stock ?? 0} units`}
          submitLabel={stockAction.type === 'restock' ? 'Add stock' : 'Dispense'}
          successMessage="Stock updated"
          fields={[
            { name: 'qty', label: 'Units', type: 'number', required: true, min: 1, step: 1, full: true, max: stockAction.type === 'dispense' ? Number(live.stock) : undefined },
            ...(stockAction.type === 'dispense'
              ? [{ name: 'patient', label: 'For patient (optional)', type: 'combo', full: true, suggestions: uniqueNames(patients.data) }]
              : []),
          ]}
          onSubmit={applyStock}
          onClose={() => setStockAction(null)}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title={deleting.rows.length > 1 ? `Delete ${deleting.rows.length} medicines` : 'Delete medicine'}
          message={deleting.rows.length > 1 ? 'The selected items will be removed from the inventory.' : `Remove ${deleting.rows[0].name} from the inventory?`}
          onConfirm={async () => {
            if (deleting.rows.length > 1) await removeMany(deleting.rows.map((m) => m.id));
            else await remove(deleting.rows[0].id);
            deleting.clear?.();
          }}
          onClose={() => setDeleting(null)}
        />
      )}
    </Page>
  );
}
