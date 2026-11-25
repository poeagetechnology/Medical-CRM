// Printable / downloadable documents (invoice, medical report, patient summary).
import { formatDate, formatMoney, parseAmount, printDocument, shortId } from '../utils/format';

export const invoiceNumber = (bill) => bill.invoiceNo || shortId(bill.id);

export const printInvoice = (bill) =>
  printDocument({
    title: `Invoice ${invoiceNumber(bill)}`,
    subtitle: `Issued ${formatDate(bill.date)}`,
    sections: [
      { heading: 'Billed to', rows: [['Patient', bill.patient]] },
      {
        heading: 'Charges',
        table: { head: ['Service', 'Notes', 'Amount'], body: [[bill.service || '—', bill.notes || '—', formatMoney(parseAmount(bill.amount))]] },
        total: `Total ${formatMoney(parseAmount(bill.amount))}`,
      },
      { heading: 'Payment', rows: [['Status', bill.status], ['Method', bill.method], ['Paid on', bill.paidAt ? formatDate(bill.paidAt) : '']] },
    ],
  });

export const printReport = (r) =>
  printDocument({
    title: `${r.type || 'Medical'} Report`,
    subtitle: `${r.patient || ''} · ${formatDate(r.date)}`,
    sections: [
      { heading: 'Details', rows: [['Patient', r.patient], ['Report', r.type], ['Requested by', r.doctor], ['Date', formatDate(r.date)], ['Status', r.status]] },
      { heading: 'Findings', text: r.findings || 'No findings recorded.' },
    ],
  });

export const printPatientSummary = (p, { appointments = [], reports = [] } = {}) =>
  printDocument({
    title: 'Patient Summary',
    subtitle: `${p.name} · ${shortId(p.id)}`,
    sections: [
      {
        heading: 'Demographics',
        rows: [['Name', p.name], ['Age', p.age], ['Gender', p.gender], ['Blood group', p.bloodGroup], ['Phone', p.phone], ['Address', p.address], ['Emergency contact', p.emergencyContact]],
      },
      {
        heading: 'Clinical',
        rows: [['Status', p.status], ['Doctor', p.doctor], ['Room', p.room], ['Condition', p.condition], ['Allergies', p.allergies], ['Last checkup', p.lastCheckup ? formatDate(p.lastCheckup) : '']],
      },
      ...(appointments.length
        ? [{ heading: 'Appointments', table: { head: ['Date', 'Time', 'Doctor', 'Status'], body: appointments.map((a) => [formatDate(a.date), a.time || '—', a.doctor, a.status]) } }]
        : []),
      ...(reports.length
        ? [{ heading: 'Reports', table: { head: ['Date', 'Report', 'Status'], body: reports.map((r) => [formatDate(r.date), r.type, r.status]) } }]
        : []),
    ],
  });
