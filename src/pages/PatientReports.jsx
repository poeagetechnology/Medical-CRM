import React, { useState } from 'react';
import { CheckCircle2, Clock, Download, Eye, FilePlus2, FileText, Pencil, Printer, Trash2, CalendarDays } from 'lucide-react';
import { useCollection } from '../hooks/useCollection';
import { useActivityLog } from '../hooks/useActivityLog';
import { useCreateIntent, useParamState } from '../hooks/useParams';
import { ReportForm } from '../components/editors';
import { printReport } from '../services/documents';
import {
  Button, ConfirmDialog, DataTable, DefinitionList, Drawer, ExportButton, FilterBar, FilterSelect,
  IconButton, Page, PageHeader, PageLoader, Person, SearchInput, StatCard, StatGrid, StatusBadge,
  Badge, Tabs, useAction, useToast,
} from '../components/ui';
import { REPORT_STATUSES, REPORT_TYPES } from '../utils/formConfigs';
import { downloadFile, exportCsv, formatDate, matches, todayISO } from '../utils/format';

const CSV = [
  { label: 'Patient', value: (r) => r.patient },
  { label: 'Report', value: (r) => r.type },
  { label: 'Doctor', value: (r) => r.doctor },
  { label: 'Date', value: (r) => r.date },
  { label: 'Status', value: (r) => r.status },
  { label: 'Findings', value: (r) => r.findings },
];

const downloadReport = (r) =>
  downloadFile(
    `${(r.patient || 'report').replace(/\s+/g, '_')}_${(r.type || 'report').replace(/\s+/g, '_')}.txt`,
    ['PATIENT REPORT', '==============', `Patient : ${r.patient || '-'}`, `Report  : ${r.type || '-'}`,
      `Doctor  : ${r.doctor || '-'}`, `Date    : ${r.date || '-'}`, `Status  : ${r.status || '-'}`,
      '', 'Findings / notes:', r.findings || '-'].join('\r\n')
  );

export default function PatientReports({ navigate, params }) {
  const { data: reports, loading, update, updateMany, remove, removeMany, canWrite, canDelete } = useCollection('patientReports');
  const log = useActivityLog();
  const run = useAction();
  const toast = useToast();

  const [search, setSearch] = useParamState(params, 'q');
  const [status, setStatus] = useParamState(params, 'status', 'All');
  const [type, setType] = useState('');
  const [editing, setEditing] = useState(null);
  const [viewingId, setViewingId] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useCreateIntent({ params, navigate, page: 'patientReports', allowed: canWrite, open: () => setEditing({}) });

  if (loading) return <PageLoader />;

  const rows = reports
    .filter((r) => status === 'All' || r.status === status)
    .filter((r) => !type || r.type === type)
    .filter((r) => matches(search, r.patient, r.type, r.doctor, r.findings));
  const viewing = reports.find((r) => r.id === viewingId);
  const count = (s) => reports.filter((r) => r.status === s).length;
  const thisMonth = reports.filter((r) => (r.date || '').startsWith(todayISO().slice(0, 7))).length;

  const complete = (r) =>
    run(async () => {
      await update(r.id, { status: 'Completed' });
      log(r.patient, `${r.type} report marked Completed`);
    }, 'Report marked completed');

  const print = (r) => { if (!printReport(r)) toast.error('Allow pop-ups for this site to print.'); };

  return (
    <Page>
      <PageHeader
        title="Patient Reports"
        description="Lab results, imaging and diagnostic reports."
        actions={
          <>
            <ExportButton onClick={() => exportCsv('patient-reports.csv', CSV, rows)} disabled={!rows.length} />
            {canWrite && <Button variant="primary" icon={FilePlus2} onClick={() => setEditing({})}>Add report</Button>}
          </>
        }
      />

      <StatGrid>
        <StatCard label="Total reports" value={reports.length} icon={FileText} active={status === 'All'} onClick={() => setStatus('All')} />
        <StatCard label="Pending" value={count('Pending')} icon={Clock} tone="amber" active={status === 'Pending'} onClick={() => setStatus('Pending')} />
        <StatCard label="Completed" value={count('Completed')} icon={CheckCircle2} tone="green" active={status === 'Completed'} onClick={() => setStatus('Completed')} />
        <StatCard label="This month" value={thisMonth} icon={CalendarDays} tone="violet" />
      </StatGrid>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search patient, type, findings…" />
        <FilterSelect label="All report types" value={type} onChange={setType} options={REPORT_TYPES} />
        <Tabs value={status} onChange={setStatus} options={['All', ...REPORT_STATUSES]} />
      </FilterBar>

      <DataTable
        rows={rows}
        initialSort={{ key: 'date', dir: -1 }}
        onRowClick={(r) => setViewingId(r.id)}
        columns={[
          { key: 'patient', header: 'Patient', render: (r) => <Person name={r.patient} /> },
          { key: 'type', header: 'Report', render: (r) => <Badge tone="brand">{r.type}</Badge> },
          { key: 'doctor', header: 'Requested by', hide: 'md' },
          { key: 'date', header: 'Date', hide: 'sm', render: (r) => formatDate(r.date) },
          { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
        ]}
        bulkActions={(list, clear) => (
          <>
            <Button size="sm" icon={Download} onClick={() => exportCsv('reports-selected.csv', CSV, list)}>Export</Button>
            {canWrite && (
              <Button size="sm" icon={CheckCircle2} onClick={async () => {
                if (await run(() => updateMany(list.map((r) => r.id), { status: 'Completed' }), `${list.length} report(s) completed`)) clear();
              }}>Mark completed</Button>
            )}
          </>
        )}
        onBulkDelete={canDelete ? (list, clear) => setDeleting({ rows: list, clear }) : undefined}
        rowActions={(r) => (
          <>
            <IconButton label="View" icon={Eye} onClick={() => setViewingId(r.id)} />
            <IconButton label="Print / save as PDF" icon={Printer} onClick={() => print(r)} />
            <IconButton label="Download" icon={Download} onClick={() => downloadReport(r)} />
            {canWrite && r.status !== 'Completed' && <IconButton label="Mark completed" icon={CheckCircle2} tone="green" onClick={() => complete(r)} />}
            {canWrite && <IconButton label="Edit" icon={Pencil} tone="brand" onClick={() => setEditing(r)} />}
            {canDelete && <IconButton label="Delete" icon={Trash2} tone="red" onClick={() => setDeleting({ rows: [r] })} />}
          </>
        )}
        empty={{
          icon: FileText,
          title: reports.length ? 'No reports match your filters' : 'No reports yet',
          action: !reports.length && canWrite && <Button variant="primary" icon={FilePlus2} onClick={() => setEditing({})}>Add first report</Button>,
        }}
      />

      {viewing && (
        <Drawer
          title={`${viewing.type || 'Report'}`}
          description={viewing.patient}
          width="max-w-lg"
          onClose={() => setViewingId(null)}
          footer={
            <>
              {canDelete && <Button variant="danger-soft" icon={Trash2} className="mr-auto" onClick={() => setDeleting({ rows: [viewing] })}>Delete</Button>}
              {canWrite && <Button icon={Pencil} onClick={() => setEditing(viewing)}>Edit</Button>}
              {canWrite && viewing.status !== 'Completed' && <Button variant="success" icon={CheckCircle2} onClick={() => complete(viewing)}>Complete</Button>}
              <Button variant="primary" icon={Printer} onClick={() => print(viewing)}>Print</Button>
            </>
          }
        >
          <DefinitionList items={[
            ['Patient', viewing.patient], ['Report', viewing.type], ['Requested by', viewing.doctor],
            ['Date', formatDate(viewing.date)], ['Status', <StatusBadge status={viewing.status} />],
          ]} />
          <p className="label mt-6">Findings / results</p>
          <div className="rounded-lg bg-subtle p-4 text-sm text-fg whitespace-pre-wrap min-h-[120px]">
            {viewing.findings || <span className="text-fg-subtle">No findings recorded yet.</span>}
          </div>
        </Drawer>
      )}

      {editing && <ReportForm record={editing} onClose={() => setEditing(null)} />}

      {deleting && (
        <ConfirmDialog
          title={deleting.rows.length > 1 ? `Delete ${deleting.rows.length} reports` : 'Delete report'}
          message={deleting.rows.length > 1 ? 'The selected reports will be permanently deleted.' : `Delete the ${deleting.rows[0].type} report for ${deleting.rows[0].patient}?`}
          onConfirm={async () => {
            if (deleting.rows.length > 1) await removeMany(deleting.rows.map((r) => r.id));
            else await remove(deleting.rows[0].id);
            deleting.clear?.();
            setViewingId(null);
          }}
          onClose={() => setDeleting(null)}
        />
      )}
    </Page>
  );
}
