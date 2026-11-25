import React, { useState } from 'react';
import { AlertTriangle, CalendarPlus, Download, Eye, HeartPulse, LogOut, Pencil, Trash2, UserCheck, UserPlus, Users, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCollection } from '../hooks/useCollection';
import { useCreateIntent, useParamState } from '../hooks/useParams';
import { AppointmentForm, PatientForm } from '../components/editors';
import {
  Button, ConfirmDialog, DataTable, DefinitionList, Drawer, ExportButton, FilterBar, FilterSelect,
  IconButton, Page, PageHeader, PageLoader, Person, SearchInput, StatCard, StatGrid, StatusBadge,
  Tabs, useAction,
} from '../components/ui';
import { canWriteCollection } from '../utils/roles';
import { PATIENT_STATUSES } from '../utils/formConfigs';
import { exportCsv, formatDate, matches, sameText, shortId, uniqueNames } from '../utils/format';

const CSV = [
  { label: 'Name', value: (p) => p.name },
  { label: 'Age', value: (p) => p.age },
  { label: 'Gender', value: (p) => p.gender },
  { label: 'Blood Group', value: (p) => p.bloodGroup },
  { label: 'Phone', value: (p) => p.phone },
  { label: 'Status', value: (p) => p.status },
  { label: 'Doctor', value: (p) => p.doctor },
  { label: 'Room', value: (p) => p.room },
  { label: 'Condition', value: (p) => p.condition },
  { label: 'Allergies', value: (p) => p.allergies },
  { label: 'Address', value: (p) => p.address },
  { label: 'Emergency Contact', value: (p) => p.emergencyContact },
];

export default function Patients({ navigate, params }) {
  const { profile } = useAuth();
  const { data: patients, loading, updateMany, removeMany, canWrite, canDelete } = useCollection('patients');
  const beds = useCollection('beds');
  const run = useAction();

  const [search, setSearch] = useParamState(params, 'q');
  const [status, setStatus] = useParamState(params, 'status', 'All');
  const [doctor, setDoctor] = useState('');
  const [editing, setEditing] = useState(null);
  const [booking, setBooking] = useState(null);
  const [viewingId, setViewingId] = useState(null);
  const [deleting, setDeleting] = useState(null);   // { rows, clear }

  useCreateIntent({ params, navigate, page: 'patients', allowed: canWrite, open: () => setEditing({}) });

  if (loading) return <PageLoader />;

  const count = (s) => patients.filter((p) => p.status === s).length;
  const rows = patients
    .filter((p) => status === 'All' || p.status === status)
    .filter((p) => !doctor || p.doctor === doctor)
    .filter((p) => matches(search, p.name, p.phone, p.doctor, p.room, p.condition, shortId(p.id)));

  const viewing = patients.find((p) => p.id === viewingId);
  const canBook = canWriteCollection(profile, 'appointments');
  const openProfile = (p) => navigate('patientDetails', { patientId: p.id });

  // Deleting a patient also frees any bed they occupy.
  const deletePatients = async (list) => {
    await removeMany(list.map((p) => p.id));
    if (beds.canWrite) {
      const occupied = beds.data.filter((b) => list.some((p) => sameText(p.name, b.patient)));
      if (occupied.length) await beds.updateMany(occupied.map((b) => b.id), { status: 'Cleaning', patient: '', occupiedAt: '' });
    }
    deleting.clear?.();
    setViewingId(null);
  };

  const columns = [
    {
      key: 'name', header: 'Patient',
      render: (p) => <Person name={p.name} sub={[shortId(p.id), p.age || p.age === 0 ? `${p.age} yrs` : null, p.gender].filter(Boolean).join(' · ')} />,
    },
    { key: 'phone', header: 'Phone', hide: 'lg' },
    { key: 'doctor', header: 'Doctor', hide: 'md' },
    { key: 'room', header: 'Room', hide: 'lg' },
    { key: 'condition', header: 'Condition', hide: 'xl', render: (p) => <span className="block max-w-[220px] truncate">{p.condition || '—'}</span> },
    { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status} /> },
  ];

  return (
    <Page>
      <PageHeader
        title="Patients"
        description="Register patients and manage their records."
        actions={
          <>
            <ExportButton onClick={() => exportCsv('patients.csv', CSV, rows)} disabled={!rows.length} />
            {canWrite && <Button variant="primary" icon={UserPlus} onClick={() => setEditing({})}>Add patient</Button>}
          </>
        }
      />

      <StatGrid>
        <StatCard label="All patients" value={patients.length} icon={Users} active={status === 'All'} onClick={() => setStatus('All')} />
        <StatCard label="Critical" value={count('Critical')} icon={AlertTriangle} tone="red" active={status === 'Critical'} onClick={() => setStatus('Critical')} />
        <StatCard label="Stable" value={count('Stable')} icon={UserCheck} tone="green" active={status === 'Stable'} onClick={() => setStatus('Stable')} />
        <StatCard label="Under observation" value={count('Observation')} icon={HeartPulse} tone="amber" active={status === 'Observation'} onClick={() => setStatus('Observation')} />
      </StatGrid>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search patients…" />
        <FilterSelect label="All doctors" value={doctor} onChange={setDoctor} options={uniqueNames(patients, 'doctor')} />
        <Tabs value={status} onChange={setStatus} options={['All', ...PATIENT_STATUSES]} />
      </FilterBar>

      <DataTable
        columns={columns}
        rows={rows}
        initialSort={{ key: 'name', dir: 1 }}
        onRowClick={(p) => setViewingId(p.id)}
        onBulkDelete={canDelete ? (list, clear) => setDeleting({ rows: list, clear }) : undefined}
        bulkActions={(list, clear) => (
          <>
            <Button size="sm" icon={Download} onClick={() => exportCsv('patients-selected.csv', CSV, list)}>Export</Button>
            {canWrite && (
              <Button size="sm" icon={LogOut} onClick={async () => {
                if (await run(() => updateMany(list.map((p) => p.id), { status: 'Discharged' }), `${list.length} patient(s) discharged`)) clear();
              }}>Mark discharged</Button>
            )}
          </>
        )}
        rowActions={(p) => (
          <>
            <IconButton label="View" icon={Eye} onClick={() => setViewingId(p.id)} />
            {canWrite && <IconButton label="Edit" icon={Pencil} tone="brand" onClick={() => setEditing(p)} />}
            {canDelete && <IconButton label="Delete" icon={Trash2} tone="red" onClick={() => setDeleting({ rows: [p] })} />}
          </>
        )}
        empty={{
          icon: Users,
          title: patients.length ? 'No patients match your filters' : 'No patients registered yet',
          action: !patients.length && canWrite && <Button variant="primary" icon={UserPlus} onClick={() => setEditing({})}>Register first patient</Button>,
        }}
      />

      {viewing && (
        <Drawer
          title="Patient overview"
          onClose={() => setViewingId(null)}
          footer={
            <>
              {canDelete && <Button variant="danger-soft" icon={Trash2} className="mr-auto" onClick={() => setDeleting({ rows: [viewing] })}>Delete</Button>}
              {canWrite && <Button icon={Pencil} onClick={() => setEditing(viewing)}>Edit</Button>}
              <Button variant="primary" iconRight={ArrowRight} onClick={() => openProfile(viewing)}>Full profile</Button>
            </>
          }
        >
          <div className="flex items-center justify-between gap-3 mb-6">
            <Person name={viewing.name} sub={shortId(viewing.id)} size={48} />
            <StatusBadge status={viewing.status} />
          </div>
          {canBook && (
            <Button variant="soft" icon={CalendarPlus} className="w-full mb-6" onClick={() => setBooking({ patient: viewing.name, doctor: viewing.doctor || '' })}>
              Book appointment
            </Button>
          )}
          <DefinitionList items={[
            ['Age', viewing.age || viewing.age === 0 ? `${viewing.age} years` : ''],
            ['Gender', viewing.gender],
            ['Blood group', viewing.bloodGroup],
            ['Phone', viewing.phone],
            ['Doctor', viewing.doctor],
            ['Room', viewing.room],
            ['Condition', viewing.condition],
            ['Allergies', viewing.allergies],
            ['Emergency contact', viewing.emergencyContact],
            ['Last checkup', viewing.lastCheckup ? formatDate(viewing.lastCheckup) : ''],
          ]} />
        </Drawer>
      )}

      {editing && <PatientForm record={editing} onClose={() => setEditing(null)} />}
      {booking && <AppointmentForm record={booking} onClose={() => setBooking(null)} />}

      {deleting && (
        <ConfirmDialog
          title={deleting.rows.length > 1 ? `Delete ${deleting.rows.length} patients` : 'Delete patient'}
          message={`${deleting.rows.length > 1 ? 'The selected patient records' : `The record for ${deleting.rows[0].name}`} will be removed permanently. Appointments, bills and reports are kept for audit.`}
          onConfirm={() => deletePatients(deleting.rows)}
          onClose={() => setDeleting(null)}
        />
      )}
    </Page>
  );
}
