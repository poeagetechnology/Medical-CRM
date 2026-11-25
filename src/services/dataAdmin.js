// Super Admin data tools: full JSON backup and CRM data reset.
import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { downloadFile, todayISO } from '../utils/format';

export const DATA_COLLECTIONS = [
  'patients', 'doctors', 'appointments', 'billing', 'ambulances', 'surgeries',
  'beds', 'medicines', 'opPatients', 'checkupPatients', 'staff', 'admins',
  'patientReports', 'notifications', 'activityLogs',
];

export async function downloadBackup() {
  const data = {};
  let total = 0;
  for (const name of [...DATA_COLLECTIONS, 'users']) {
    const snap = await getDocs(collection(db, name));
    data[name] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    total += data[name].length;
  }
  downloadFile(
    `medcrm-backup-${todayISO()}.json`,
    JSON.stringify({ exportedAt: new Date().toISOString(), data }, null, 2),
    'application/json'
  );
  return total;
}

// Deletes every CRM record. User accounts are kept.
export async function resetCrmData() {
  for (const name of DATA_COLLECTIONS) {
    const snap = await getDocs(collection(db, name));
    for (let i = 0; i < snap.docs.length; i += 450) {
      const batch = writeBatch(db);
      snap.docs.slice(i, i + 450).forEach((d) => batch.delete(doc(db, name, d.id)));
      await batch.commit();
    }
  }
}
