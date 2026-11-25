import React, { useState } from 'react';
import { BedDouble, CalendarClock, ChevronRight, FileText, Pill, Receipt, Scissors, Search as SearchIcon, Stethoscope, UserRound, UsersRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCollection } from '../hooks/useCollection';
import { useParamState } from '../hooks/useParams';
import { Card, CardHeader, EmptyState, IconTile, Page, PageHeader, PageLoader, SearchInput, StatusBadge, Tabs } from '../components/ui';
import { canViewPage } from '../utils/roles';
import { formatDate, matches } from '../utils/format';

// How each record type is searched, shown and opened.
const SOURCES = [
  { key: 'patients', label: 'Patients', icon: UserRound, page: 'patientDetails', fields: ['name', 'phone', 'doctor', 'room', 'condition', 'status'],
    title: (r) => r.name, sub: (r) => [r.doctor, r.room && `Room ${r.room}`, r.condition], to: (r) => ({ patientId: r.id }) },
  { key: 'doctors', label: 'Doctors', icon: Stethoscope, page: 'doctors', fields: ['name', 'dept', 'specialization', 'phone', 'email'],
    title: (r) => r.name, sub: (r) => [r.dept, r.specialization], to: (r) => ({ q: r.name }) },
  { key: 'appointments', label: 'Appointments', icon: CalendarClock, page: 'appointments', fields: ['patient', 'doctor', 'reason', 'date', 'status'],
    title: (r) => r.patient, sub: (r) => [r.doctor, formatDate(r.date), r.time], to: (r) => ({ q: r.patient, view: 'list' }) },
  { key: 'patientReports', label: 'Reports', icon: FileText, page: 'patientReports', fields: ['patient', 'type', 'doctor', 'findings'],
    title: (r) => `${r.type} — ${r.patient}`, sub: (r) => [r.doctor, formatDate(r.date)], to: (r) => ({ q: r.patient }) },
  { key: 'billing', label: 'Invoices', icon: Receipt, page: 'billing', fields: ['invoiceNo', 'patient', 'service', 'amount', 'status'],
    title: (r) => `${r.patient} — ${r.amount}`, sub: (r) => [r.invoiceNo, r.service, formatDate(r.date)], to: (r) => ({ q: r.patient }) },
  { key: 'surgeries', label: 'Surgeries', icon: Scissors, page: 'surgeries', fields: ['patient', 'type', 'doctor', 'room'],
    title: (r) => `${r.type} — ${r.patient}`, sub: (r) => [r.doctor, r.room, formatDate(r.date)], to: (r) => ({ q: r.patient }) },
  { key: 'beds', label: 'Beds', icon: BedDouble, page: 'beds', fields: ['number', 'ward', 'patient', 'status'],
    title: (r) => `Bed ${r.number || r.id}`, sub: (r) => [r.ward, r.patient], to: (r) => ({ q: r.number || r.id }) },
  { key: 'medicines', label: 'Medicines', icon: Pill, page: 'medicalCenter', fields: ['name', 'category', 'supplier', 'batch'],
    title: (r) => r.name, sub: (r) => [r.category, `${r.stock} in stock`], to: (r) => ({ q: r.name }) },
  { key: 'staff', label: 'Staff', icon: UsersRound, page: 'staff', fields: ['name', 'role', 'dept', 'phone', 'email'],
    title: (r) => r.name, sub: (r) => [r.role, r.dept], to: (r) => ({ q: r.name }) },
];

// One subscription per source, in a fixed order.
function useSources() {
  const patients = useCollection('patients');
  const doctors = useCollection('doctors');
  const appointments = useCollection('appointments');
  const patientReports = useCollection('patientReports');
  const billing = useCollection('billing');
  const surgeries = useCollection('surgeries');
  const beds = useCollection('beds');
  const medicines = useCollection('medicines');
  const staff = useCollection('staff');
  return { patients, doctors, appointments, patientReports, billing, surgeries, beds, medicines, staff };
}

export default function Search({ navigate, params }) {
  const { profile } = useAuth();
  const stores = useSources();
  const [query, setQuery] = useParamState(params, 'q');
  const [type, setType] = useState('all');

  const loading = Object.values(stores).some((s) => s.loading);
  // only types this role can both read and open
  const sources = SOURCES.filter((s) => stores[s.key].canRead && canViewPage(profile, s.page));
  const q = query.trim();
  const groups = q
    ? sources
        .map((s) => ({ ...s, results: stores[s.key].data.filter((r) => matches(q, ...s.fields.map((f) => r[f]))) }))
        .filter((g) => g.results.length)
    : [];
  const shown = groups.filter((g) => type === 'all' || g.key === type);
  const total = groups.reduce((t, g) => t + g.results.length, 0);

  return (
    <Page className="!max-w-5xl">
      <PageHeader title="Search" description="Find anything you have access to. Tip: press Ctrl + K from any screen." />

      <SearchInput value={query} onChange={(v) => { setQuery(v); setType('all'); }} placeholder="Search patients, doctors, invoices, beds…" className="!w-full [&_input]:!h-12 [&_input]:!text-base" />

      {loading ? <PageLoader /> : !q ? (
        <Card><EmptyState icon={SearchIcon} title="Start typing to search" description={`Searching across ${sources.map((s) => s.label.toLowerCase()).join(', ')}.`} /></Card>
      ) : total === 0 ? (
        <Card><EmptyState icon={SearchIcon} title={`No results for “${q}”`} description="Check the spelling or try a shorter term." /></Card>
      ) : (
        <>
          <Tabs
            value={type}
            onChange={setType}
            options={[{ value: 'all', label: 'All', count: total }, ...groups.map((g) => ({ value: g.key, label: g.label, count: g.results.length }))]}
          />
          {shown.map((g) => (
            <Card key={g.key} className="overflow-hidden">
              <CardHeader title={g.label} description={`${g.results.length} match(es)`} />
              <ul className="divide-y divide-line">
                {g.results.slice(0, type === 'all' ? 5 : 50).map((r) => (
                  <li key={r.id}>
                    <button type="button" onClick={() => navigate(g.page, g.to(r))} className="flex w-full items-center gap-4 px-5 py-3 text-left hover:bg-subtle/60">
                      <IconTile icon={g.icon} />
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-bold text-fg truncate">{g.title(r)}</span>
                        <span className="block text-xs text-fg-subtle truncate">{g.sub(r).filter((x) => x && x !== '—').join(' · ')}</span>
                      </span>
                      {r.status && <StatusBadge status={r.status} className="hidden sm:inline-flex" />}
                      <ChevronRight size={16} className="text-fg-subtle flex-shrink-0" />
                    </button>
                  </li>
                ))}
              </ul>
              {type === 'all' && g.results.length > 5 && (
                <button type="button" onClick={() => setType(g.key)} className="w-full py-2.5 text-xs font-bold text-brand-600 border-t border-line hover:bg-subtle">
                  Show all {g.results.length} {g.label.toLowerCase()}
                </button>
              )}
            </Card>
          ))}
        </>
      )}
    </Page>
  );
}
