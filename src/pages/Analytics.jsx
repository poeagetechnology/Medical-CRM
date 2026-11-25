import React, { useState } from 'react';
import { BedDouble, CalendarClock, CircleDollarSign, Percent, UserPlus } from 'lucide-react';
import { useCollection } from '../hooks/useCollection';
import { ColumnChart, DonutChart, TrendChart } from '../components/charts';
import { Card, CardHeader, EmptyState, ExportButton, Page, PageHeader, PageLoader, Progress, StatCard, StatGrid, Tabs } from '../components/ui';
import { APPOINTMENT_STATUSES, PATIENT_STATUSES } from '../utils/formConfigs';
import { addDays, exportCsv, formatMoney, formatMoneyShort, todayISO } from '../utils/format';
import { dailySeries, dayKey, groupCount, monthlySeries, paidDay, sumAmounts } from '../utils/stats';

const PERIODS = [
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
  { value: '365', label: '12 months' },
];

const AGE_GROUPS = [['0–17', 0, 17], ['18–35', 18, 35], ['36–50', 36, 50], ['51–65', 51, 65], ['65+', 66, 200]];

export default function Analytics() {
  const patients = useCollection('patients');
  const billing = useCollection('billing');
  const beds = useCollection('beds');
  const appointments = useCollection('appointments');
  const [period, setPeriod] = useState('30');

  if (patients.loading || billing.loading || beds.loading || appointments.loading) return <PageLoader />;

  const days = Number(period);
  const from = addDays(todayISO(), -days + 1);
  const inPeriod = (key) => key >= from && key <= todayISO();

  const paid = billing.data.filter((b) => b.status === 'Paid' && inPeriod(paidDay(b)));
  const billed = billing.data.filter((b) => b.status !== 'Cancelled' && inPeriod(dayKey(b)));
  const collectedOfBilled = sumAmounts(billed.filter((b) => b.status === 'Paid'));
  const collectionRate = sumAmounts(billed) ? Math.round((collectedOfBilled / sumAmounts(billed)) * 100) : 0;
  const appts = appointments.data.filter((a) => inPeriod(a.date || ''));
  const newPatients = patients.data.filter((p) => inPeriod(dayKey(p, 'createdAt')));
  const occupied = beds.data.filter((b) => b.status === 'Occupied').length;
  const occupancy = beds.data.length ? Math.round((occupied / beds.data.length) * 100) : 0;

  const long = days > 90;
  const series = (records, dayOf, valueOf) =>
    long ? monthlySeries(records, 12, dayOf, valueOf) : dailySeries(records, days, dayOf, valueOf);

  const statusData = [
    ...PATIENT_STATUSES.map((s) => ({ name: s, value: patients.data.filter((p) => p.status === s).length })),
    { name: 'Unspecified', value: patients.data.filter((p) => !PATIENT_STATUSES.includes(p.status)).length },
  ];
  const apptStatus = APPOINTMENT_STATUSES.map((s) => ({ name: s, value: appts.filter((a) => a.status === s).length }));
  const byService = groupCount(paid, (b) => b.service, (b) => sumAmounts([b]));
  const byDoctor = groupCount(appts.filter((a) => a.status !== 'Cancelled'), (a) => a.doctor).slice(0, 8);
  const ages = AGE_GROUPS.map(([label, min, max]) => ({
    label,
    value: patients.data.filter((p) => p.age !== '' && p.age !== undefined && Number(p.age) >= min && Number(p.age) <= max).length,
  }));
  const wards = groupCount(beds.data, (b) => b.ward || 'General').map((w) => {
    const used = beds.data.filter((b) => (b.ward || 'General') === w.name && b.status === 'Occupied').length;
    return { ...w, used, pct: Math.round((used / w.value) * 100) };
  });

  const exportSummary = () =>
    exportCsv(`analytics-${period}d-${todayISO()}.csv`, [
      { label: 'Metric', value: (r) => r[0] },
      { label: 'Value', value: (r) => r[1] },
    ], [
      ['Period (days)', days],
      ['Revenue collected', formatMoney(sumAmounts(paid))],
      ['Collection rate', `${collectionRate}%`],
      ['Appointments', appts.length],
      ['New patients', newPatients.length],
      ['Total patients', patients.data.length],
      ...statusData.map((s) => [`Patients: ${s.name}`, s.value]),
      ...apptStatus.map((s) => [`Appointments: ${s.name}`, s.value]),
      ...byService.map((s) => [`Revenue: ${s.name}`, s.value]),
      ['Bed occupancy', `${occupancy}%`],
      ['Beds occupied', occupied],
      ['Beds total', beds.data.length],
    ]);

  return (
    <Page>
      <PageHeader
        title="Analytics"
        description="Performance across patients, scheduling, capacity and revenue."
        actions={
          <>
            <Tabs value={period} onChange={setPeriod} options={PERIODS} />
            <ExportButton onClick={exportSummary} />
          </>
        }
      />

      <StatGrid cols={5}>
        <StatCard label="Revenue collected" value={formatMoneyShort(sumAmounts(paid))} hint={`${paid.length} payments`} icon={CircleDollarSign} tone="green" />
        <StatCard label="Collection rate" value={`${collectionRate}%`} hint="Of amounts billed" icon={Percent} tone="violet" />
        <StatCard label="Appointments" value={appts.length} hint={`${apptStatus.find((s) => s.name === 'Completed').value} completed`} icon={CalendarClock} />
        <StatCard label="New patients" value={newPatients.length} hint={`${patients.data.length} in total`} icon={UserPlus} tone="cyan" />
        <StatCard label="Bed occupancy" value={`${occupancy}%`} hint={`${occupied} of ${beds.data.length} beds`} icon={BedDouble} tone="amber" />
      </StatGrid>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHeader title="Revenue trend" description={long ? 'Collected per month' : 'Collected per day'} />
          <div className="p-4"><TrendChart data={series(paid, paidDay, (b) => sumAmounts([b]))} format={formatMoneyShort} color="#10b981" /></div>
        </Card>
        <Card>
          <CardHeader title="Revenue by service" />
          <div className="p-5"><DonutChart data={byService} totalLabel="collected" format={formatMoneyShort} /></div>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader title="Appointment volume" description={long ? 'Per month' : 'Per day'} />
          <div className="p-4"><ColumnChart data={series(appts, (a) => a.date || '')} name="appointments" /></div>
        </Card>
        <Card>
          <CardHeader title="Appointment outcomes" />
          <div className="p-5"><DonutChart data={apptStatus} totalLabel="appointments" /></div>
        </Card>

        <Card>
          <CardHeader title="Patient status" description="All patients" />
          <div className="p-5"><DonutChart data={statusData} totalLabel="patients" /></div>
        </Card>
        <Card>
          <CardHeader title="Age distribution" description="All patients with a recorded age" />
          <div className="p-4"><ColumnChart data={ages} name="patients" color="#8b5cf6" /></div>
        </Card>
        <Card>
          <CardHeader title="Busiest doctors" description="Appointments in this period" />
          {byDoctor.length === 0 ? <EmptyState compact title="No appointments in this period" /> : (
            <ul className="p-5 space-y-4">
              {byDoctor.map((d) => (
                <li key={d.name}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-semibold text-fg truncate">{d.name}</span>
                    <span className="font-bold text-fg tabular">{d.value}</span>
                  </div>
                  <Progress value={(d.value / byDoctor[0].value) * 100} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader title="Capacity by ward" />
        {wards.length === 0 ? <EmptyState compact icon={BedDouble} title="No beds configured" /> : (
          <ul className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-5">
            {wards.map((w) => (
              <li key={w.name}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-semibold text-fg">{w.name}</span>
                  <span className="text-fg-subtle tabular">{w.used}/{w.value} · <b className="text-fg">{w.pct}%</b></span>
                </div>
                <Progress value={w.pct} tone={w.pct >= 85 ? 'red' : w.pct >= 60 ? 'amber' : 'green'} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Page>
  );
}
