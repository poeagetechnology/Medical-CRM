import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

const COLLECTIONS = [
  'patients', 'doctors', 'appointments', 'billing', 'ambulances',
  'surgeries', 'beds', 'medicines', 'opPatients', 'checkupPatients',
  'staff', 'admins', 'patientReports', 'notifications', 'activityLogs',
];

// Demo seeding removed — app starts with empty collections.
export async function seedFirestore() {}

export async function clearAllFirestoreData() {
  for (const name of COLLECTIONS) {
    const snap = await getDocs(collection(db, name));
    await Promise.all(snap.docs.map(d => deleteDoc(doc(db, name, d.id))));
  }
}
