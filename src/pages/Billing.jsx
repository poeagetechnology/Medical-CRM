import React, { useState } from 'react';
import { Ban, CheckCircle2, CircleDollarSign, Clock, Download, Pencil, Printer, Receipt, Trash2, TrendingUp } from 'lucide-react';
import { useCollection } from '../hooks/useCollection';
import { useActivityLog } from '../hooks/useActivityLog';
import { useCreateIntent, useParamState } from '../hooks/useParams';
import { BillForm } from '../components/editors';
import { invoiceNumber, printInvoice } from '../services/documents';
import {
  Button, ConfirmDialog, DataTable, ExportButton, FilterBar, FilterSelect, IconButton, Page, PageHeader,
  PageLoader, Person, RecordForm, SearchInput, StatCard, StatGrid, StatusBadge, Tabs, useAction, useToast,
} from '../components/ui';
import { BILL_STATUSES, PAYMENT_METHODS } from '../utils/formConfigs';
import { addDays, exportCsv, formatDate, formatMoney, formatMoneyShort, matches, parseAmount, todayISO, uniqueNames } from '../utils/format';
import { dayKey, paidDay, sumAmounts } from '../utils/stats';

const CSV = [
  { label: 'Invoice', value: invoiceNumber },
  { label: 'Patient', value: (b) => b.patient },
  { label: 'Service', value: (b) => b.service },
  { label: 'Amount', value: (b) => parseAmount(b.amount) },
  { label: 'Date', value: (b) => b.date },
  { label: 'Status', value: (b) => b.status },
  { label: 'Method', value: (b) => b.method },
  { label: 'Notes', value: (b) => b.notes },
];

const PERIODS = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: '365', label: 'Last year' },
];

export default function Billing({ navigate, params }) {
  const { data: bills, loading, update, updateMany, remove, removeMany, canWrite, canDelete } = useCollection('billing');
  const log = useActivityLog();
  const run = useAction();
  const toast = useToast();

  const [search, setSearch] = useParamState(params, 'q');
  const [status, setStatus] = useParamState(params, 'status', 'All');
  const [service, setService] = useState('');
  const [period, setPeriod] = useState('');
  const [editing, setEditing] = useState(null);
  const [paying, setPaying] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useCreateIntent({ params, navigate, page: 'billing', allowed: canWrite, open: () => setEditing({}) });

  if (loading) return <PageLoader />;

  const from = period ? addDays(todayISO(), -Number(period) + 1) : '';
  const rows = bills
    .filter((b) => status === 'All' || b.status === status)
    .filter((b) => !service || b.service === service)
    .filter((b) => !from || dayKey(b) >= from)
    .filter((b) => matches(search, b.patient, b.service, invoiceNumber(b), b.amount));

  const paid = bills.filter((b) => b.status === 'Paid');
  const pending = bills.filter((b) => b.status === 'Pending');
  const thisMonth = paid.filter((b) => paidDay(b).startsWith(todayISO().slice(0, 7)));

  const print = (b) => { if (!printInvoice(b)) toast.error('Allow pop-ups for this site to print.'); };

  const pay = async ({ method }) => {
    await update(paying.id, { status: 'Paid', method, paidAt: new Date().toISOString() });
    log(paying.patient, `Invoice ${invoiceNumber(paying)} (${paying.amount}) paid by ${method}`);
  };

  return (
    <Page>
      <PageHeader
        title="Billing"
        description="Invoices, payments and outstanding balances."
        actions={
          <>
            <ExportButton onClick={() => exportCsv('billing.csv', CSV, rows)} disabled={!rows.length} />
            {canWrite && <Button variant="primary" icon={Receipt} onClick={() => setEditing({})}>Create invoice</Button>}
          </>
        }
      />

      <StatGrid>
        <StatCard label="Collected" value={formatMoneyShort(sumAmounts(paid))} hint={`${paid.length} paid invoices`} icon={CheckCircle2} tone="green" active={status === 'Paid'} onClick={() => setStatus('Paid')} />
        <StatCard label="Outstanding" value={formatMoneyShort(sumAmounts(pending))} hint={`${pending.length} unpaid invoices`} icon={Clock} tone="amber" active={status === 'Pending'} onClick={() => setStatus('Pending')} />
        <StatCard label="Collected this month" value={formatMoneyShort(sumAmounts(thisMonth))} hint={`${thisMonth.length} payments`} icon={TrendingUp} tone="violet" />
        <StatCard label="All invoices" value={bills.length} hint={formatMoney(sumAmounts(bills.filter((b) => b.status !== 'Cancelled')))} icon={CircleDollarSign} active={status === 'All'} onClick={() => setStatus('All')} />
      </StatGrid>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search invoice, patient, amount…" />
        <FilterSelect label="All services" value={service} onChange={setService} options={uniqueNames(bills, 'service')} />
        <FilterSelect label="Any date" value={period} onChange={setPeriod} options={PERIODS} />
        <Tabs value={status} onChange={setStatus} options={['All', ...BILL_STATUSES]} />
      </FilterBar>

      <DataTable
        rows={rows}
        initialSort={{ key: 'date', dir: -1 }}
        columns={[
          { key: 'invoiceNo', header: 'Invoice', sortValue: invoiceNumber, render: (b) => <span className="font-mono text-xs font-semibold text-fg">{invoiceNumber(b)}</span> },
          { key: 'patient', header: 'Patient', render: (b) => <Person name={b.patient} size={30} /> },
          { key: 'service', header: 'Service', hide: 'lg' },
          { key: 'date', header: 'Date', hide: 'md', render: (b) => formatDate(b.date) },
          { key: 'amount', header: 'Amount', align: 'right', sortValue: (b) => parseAmount(b.amount), render: (b) => <span className="font-bold text-fg tabular">{b.amount}</span> },
          { key: 'status', header: 'Status', render: (b) => <StatusBadge status={b.status} /> },
        ]}
        toolbar={rows.length > 0 && (
          <p className="text-xs text-fg-subtle">Total shown: <b className="text-fg tabular">{formatMoney(sumAmounts(rows))}</b></p>
        )}
        rowActions={(b) => (
          <>
            {canWrite && b.status === 'Pending' && <Button size="xs" variant="success" onClick={() => setPaying(b)}>Mark paid</Button>}
            <IconButton label="Print invoice" icon={Printer} onClick={() => print(b)} />
            {canWrite && b.status === 'Pending' && <IconButton label="Cancel invoice" icon={Ban} tone="red" onClick={() => setCancelling(b)} />}
            {canWrite && <IconButton label="Edit" icon={Pencil} tone="brand" onClick={() => setEditing(b)} />}
            {canDelete && <IconButton label="Delete" icon={Trash2} tone="red" onClick={() => setDeleting({ rows: [b] })} />}
          </>
        )}
        bulkActions={(list, clear) => {
          const unpaid = list.filter((b) => b.status === 'Pending');
          return (
            <>
              <Button size="sm" icon={Download} onClick={() => exportCsv('billing-selected.csv', CSV, list)}>Export</Button>
              {canWrite && unpaid.length > 0 && (
                <Button size="sm" icon={CheckCircle2} onClick={async () => {
                  if (await run(() => updateMany(unpaid.map((b) => b.id), { status: 'Paid', paidAt: new Date().toISOString() }), `${unpaid.length} invoice(s) marked paid`)) clear();
                }}>Mark {unpaid.length} paid</Button>
              )}
            </>
          );
        }}
        onBulkDelete={canDelete ? (list, clear) => setDeleting({ rows: list, clear }) : undefined}
        empty={{
          icon: Receipt,
          title: bills.length ? 'No invoices match your filters' : 'No invoices yet',
          action: !bills.length && canWrite && <Button variant="primary" icon={Receipt} onClick={() => setEditing({})}>Create first invoice</Button>,
        }}
      />

      {editing && <BillForm record={editing} onClose={() => setEditing(null)} />}

      {paying && (
        <RecordForm
          width="max-w-md"
          title={`Record payment — ${invoiceNumber(paying)}`}
          description={`${paying.patient} · ${paying.amount}`}
          submitLabel="Confirm payment"
          successMessage="Payment recorded"
          fields={[{ name: 'method', label: 'Payment method', type: 'select', required: true, options: PAYMENT_METHODS, defaultValue: 'Cash', full: true }]}
          onSubmit={pay}
          onClose={() => setPaying(null)}
        />
      )}

      {cancelling && (
        <ConfirmDialog
          title="Cancel invoice"
          message={`Cancel ${invoiceNumber(cancelling)} (${cancelling.amount}) for ${cancelling.patient}? It stays on record as cancelled.`}
          confirmLabel="Cancel invoice"
          successMessage="Invoice cancelled"
          onConfirm={async () => {
            await update(cancelling.id, { status: 'Cancelled' });
            log(cancelling.patient, `Invoice ${invoiceNumber(cancelling)} cancelled`);
          }}
          onClose={() => setCancelling(null)}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title={deleting.rows.length > 1 ? `Delete ${deleting.rows.length} invoices` : 'Delete invoice'}
          message={deleting.rows.length > 1 ? 'The selected invoices will be permanently deleted.' : `Delete the ${deleting.rows[0].amount} invoice for ${deleting.rows[0].patient}?`}
          onConfirm={async () => {
            if (deleting.rows.length > 1) await removeMany(deleting.rows.map((b) => b.id));
            else await remove(deleting.rows[0].id);
            deleting.clear?.();
          }}
          onClose={() => setDeleting(null)}
        />
      )}
    </Page>
  );
}
