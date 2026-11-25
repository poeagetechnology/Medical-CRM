// One editor per record type. Usage:
//   const [editing, setEditing] = useState(null);   // null | {} | record
//   {editing && <PatientForm record={editing} onClose={() => setEditing(null)} />}
import React from 'react';
import EntityEditor from './EntityEditor';
import { useCollection } from '../../hooks/useCollection';
import { useActivityLog } from '../../hooks/useActivityLog';
import { useBedSync } from '../../hooks/useWorkflows';
import { useAuth } from '../../context/AuthContext';
import { renameDoctor, renamePatient } from '../../services/cascade';
import {
  appointmentConflict, appointmentFields, bedFields, billFields, checkupFields, doctorFields,
  opFields, patientFields, reportFields, surgeryConflict, surgeryFields,
} from '../../utils/formConfigs';
import { formatDate, formatMoney, formatTime, nextCode, parseAmount, sameText } from '../../utils/format';

export function PatientForm({ record, onClose }) {
  const { profile } = useAuth();
  const store = useCollection('patients');
  const { data: doctors } = useCollection('doctors');
  const log = useActivityLog();

  return (
    <EntityEditor
      noun="Patient"
      record={record}
      store={store}
      fields={patientFields({ doctors })}
      onClose={onClose}
      // names link records together, so they must be unique
      validate={(v) =>
        store.data.some((p) => p.id !== record.id && sameText(p.name, v.name))
          ? `A patient named "${v.name}" already exists. Add a middle name or initial to tell them apart.`
          : null
      }
      afterSave={async (data, before) => {
        if (!before.id) return log(data.name, 'Patient registered');
        const namesake = store.data.some((p) => p.id !== before.id && sameText(p.name, before.name));
        if (before.name !== data.name && !namesake) await renamePatient(profile, before.name, data.name);
        log(data.name, before.status !== data.status
          ? `Status changed from ${before.status || '—'} to ${data.status}`
          : 'Patient record updated');
        return null;
      }}
      deleteMessage={`Delete ${record.name}? The patient record is removed permanently. Their appointments, bills and reports are kept for audit.`}
    />
  );
}

export function AppointmentForm({ record, onClose }) {
  const store = useCollection('appointments');
  const { data: patients } = useCollection('patients');
  const { data: doctors } = useCollection('doctors');
  const log = useActivityLog();

  return (
    <EntityEditor
      noun="Appointment"
      record={record}
      store={store}
      fields={appointmentFields({ patients, doctors })}
      submitLabel={record.id ? undefined : 'Book appointment'}
      validate={(v) => appointmentConflict(v, store.data, record.id)}
      onClose={onClose}
      afterSave={(data, before) => {
        if (!before.id) log(data.patient, `Appointment booked with ${data.doctor} on ${formatDate(data.date)} at ${formatTime(data.time)}`);
        else if (before.status !== data.status) log(data.patient, `Appointment with ${data.doctor} marked ${data.status}`);
        else if (before.date !== data.date || before.time !== data.time) log(data.patient, `Appointment moved to ${formatDate(data.date)} at ${formatTime(data.time)}`);
      }}
      afterDelete={(a) => log(a.patient, `Appointment with ${a.doctor} deleted`)}
    />
  );
}

export function SurgeryForm({ record, onClose }) {
  const store = useCollection('surgeries');
  const { data: patients } = useCollection('patients');
  const { data: doctors } = useCollection('doctors');
  const log = useActivityLog();

  return (
    <EntityEditor
      noun="Surgery"
      record={record}
      store={store}
      fields={surgeryFields({ patients, doctors })}
      submitLabel={record.id ? undefined : 'Schedule surgery'}
      validate={(v) => surgeryConflict(v, store.data, record.id)}
      onClose={onClose}
      afterSave={(data, before) => {
        if (!before.id) log(data.patient, `Surgery scheduled: ${data.type} on ${formatDate(data.date)} at ${formatTime(data.time)}`);
        else if (before.status !== data.status) log(data.patient, `Surgery (${data.type}) ${data.status.toLowerCase()}`);
      }}
      afterDelete={(s) => log(s.patient, `Surgery (${s.type}) removed from schedule`)}
    />
  );
}

export function BillForm({ record, onClose }) {
  const store = useCollection('billing');
  const { data: patients } = useCollection('patients');
  const log = useActivityLog();

  // Amounts are stored as display strings ("$1,250") so existing records keep working.
  const initial = { ...record, amount: record.amount ? parseAmount(record.amount) : '' };

  return (
    <EntityEditor
      noun="Invoice"
      record={initial}
      store={store}
      fields={billFields({ patients })}
      onClose={onClose}
      prepare={(v) => ({
        ...v,
        amount: formatMoney(v.amount),
        invoiceNo: record.invoiceNo || nextCode(store.data, 'invoiceNo', 'INV-', 1000),
        paidAt: v.status === 'Paid' ? record.paidAt || new Date().toISOString() : '',
      })}
      afterSave={(data, before) => {
        if (!before.id) log(data.patient, `Invoice ${data.invoiceNo} of ${data.amount} created`);
        else if (before.status !== data.status) log(data.patient, `Invoice ${data.invoiceNo} (${data.amount}) marked ${data.status}`);
      }}
      afterDelete={(b) => log(b.patient, `Invoice of ${formatMoney(parseAmount(b.amount))} deleted`)}
    />
  );
}

export function ReportForm({ record, onClose }) {
  const store = useCollection('patientReports');
  const { data: patients } = useCollection('patients');
  const { data: doctors } = useCollection('doctors');
  const log = useActivityLog();

  return (
    <EntityEditor
      noun="Report"
      record={record}
      store={store}
      fields={reportFields({ patients, doctors })}
      onClose={onClose}
      afterSave={(data, before) => {
        if (!before.id) log(data.patient, `${data.type} report ${data.status === 'Completed' ? 'added' : 'requested'}`);
        else if (before.status !== data.status) log(data.patient, `${data.type} report marked ${data.status}`);
      }}
    />
  );
}

export function OpForm({ record, onClose }) {
  const store = useCollection('opPatients');
  const { data: patients } = useCollection('patients');
  const { data: doctors } = useCollection('doctors');
  const log = useActivityLog();

  return (
    <EntityEditor
      noun="Queue entry"
      record={record}
      store={store}
      fields={opFields({ patients, doctors })}
      submitLabel={record.id ? undefined : 'Issue token'}
      onClose={onClose}
      validate={(v) => {
        const dup = store.data.find((q) => q.id !== record.id && q.status !== 'Completed' && sameText(q.name, v.name));
        return dup ? `${v.name} is already in the queue (token ${dup.token}).` : null;
      }}
      prepare={(v) =>
        record.id ? v : { ...v, token: nextCode(store.data, 'token', 'OP-', 100), status: 'Waiting' }
      }
      afterSave={(data, before) => {
        if (!before.id) log(data.name, `Enrolled in OP queue for ${data.doctor} (token ${data.token})`);
      }}
    />
  );
}

export function CheckupForm({ record, onClose }) {
  const store = useCollection('checkupPatients');
  const { data: patients } = useCollection('patients');
  const { data: doctors } = useCollection('doctors');
  const log = useActivityLog();

  return (
    <EntityEditor
      noun="Checkup"
      record={record}
      store={store}
      fields={checkupFields({ patients, doctors })}
      submitLabel={record.id ? undefined : 'Book checkup'}
      onClose={onClose}
      prepare={(v) => (record.id ? v : { ...v, status: 'Waiting' })}
      afterSave={(data, before) => {
        if (!before.id) log(data.name, `Checkup booked: ${data.checkupType} on ${formatDate(data.date)}`);
      }}
    />
  );
}

export function DoctorForm({ record, onClose }) {
  const { profile } = useAuth();
  const store = useCollection('doctors');

  // older records stored experience as text such as "12 years"
  const initial = { ...record, experience: record.experience ? parseInt(record.experience, 10) || '' : record.experience ?? '' };

  return (
    <EntityEditor
      noun="Doctor"
      record={initial}
      store={store}
      fields={doctorFields()}
      onClose={onClose}
      validate={(v) =>
        store.data.some((d) => d.id !== record.id && sameText(d.name, v.name))
          ? `A doctor named "${v.name}" already exists.`
          : null
      }
      afterSave={async (data) => {
        if (record.id && record.name !== data.name) await renameDoctor(profile, record.name, data.name);
      }}
      deleteMessage={`Delete ${record.name}? Existing appointments and patient records keep the doctor's name.`}
    />
  );
}

export function BedForm({ record, onClose }) {
  const store = useCollection('beds');
  const { data: patients } = useCollection('patients');
  const log = useActivityLog();
  const syncRoom = useBedSync();

  // Older bed records used the document id as the label.
  const initial = { ...record, number: record.number || record.id || '' };

  return (
    <EntityEditor
      noun="Bed"
      record={initial}
      store={store}
      fields={bedFields({ patients })}
      onClose={onClose}
      validate={(v) => {
        if (store.data.some((b) => b.id !== record.id && sameText(b.number || b.id, v.number))) {
          return `Bed "${v.number}" already exists.`;
        }
        const other = v.status === 'Occupied' && store.data.find(
          (b) => b.id !== record.id && b.status === 'Occupied' && sameText(b.patient, v.patient)
        );
        return other ? `${v.patient} is already in bed ${other.number || other.id}.` : null;
      }}
      prepare={(v) => ({
        ...v,
        occupiedAt: v.status === 'Occupied'
          ? (sameText(record.patient, v.patient) && record.occupiedAt) || new Date().toISOString()
          : '',
      })}
      afterSave={async (data) => {
        const before = record.status === 'Occupied' ? record.patient : '';
        const after = data.status === 'Occupied' ? data.patient : '';
        if (sameText(before, after) && initial.number === data.number) return;
        await syncRoom(data.number, after, before);
        if (before && !sameText(before, after)) log(before, `Released from bed ${data.number}`);
        if (after && !sameText(before, after)) log(after, `Admitted to bed ${data.number}`);
      }}
      afterDelete={async (b) => {
        if (b.patient) await syncRoom(b.number, '', b.patient);
      }}
      deleteMessage={`Delete bed ${initial.number}?${record.status === 'Occupied' ? ' It is currently occupied.' : ''}`}
    />
  );
}
