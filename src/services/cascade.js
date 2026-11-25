// Records link to patients and doctors by name. When someone is renamed, these
// helpers update every linked record the current role is allowed to change.
import { collection, doc, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { canReadCollection, canWriteCollection } from '../utils/roles';

const PATIENT_LINKS = [
  ['appointments', 'patient'], ['billing', 'patient'], ['patientReports', 'patient'],
  ['surgeries', 'patient'], ['beds', 'patient'], ['ambulances', 'patient'],
  ['opPatients', 'name'], ['checkupPatients', 'name'], ['activityLogs', 'patient'],
];

const DOCTOR_LINKS = [
  ['appointments', 'doctor'], ['surgeries', 'doctor'], ['opPatients', 'doctor'],
  ['checkupPatients', 'doctor'], ['patients', 'doctor'], ['patientReports', 'doctor'],
];

async function cascade(profile, links, from, to) {
  if (!from || !to || from === to) return 0;
  const failed = [];
  for (const [name, field] of links) {
    if (!canReadCollection(profile, name) || !canWriteCollection(profile, name)) continue;
    try {
      const snap = await getDocs(query(collection(db, name), where(field, '==', from)));
      for (let i = 0; i < snap.docs.length; i += 450) {
        const batch = writeBatch(db);
        snap.docs.slice(i, i + 450).forEach((d) => batch.update(doc(db, name, d.id), { [field]: to }));
        await batch.commit();
      }
    } catch (err) {
      console.error(`Could not rename in "${name}":`, err);
      failed.push(name);
    }
  }
  return failed.length;
}

export const renamePatient = (profile, from, to) => cascade(profile, PATIENT_LINKS, from, to);
export const renameDoctor = (profile, from, to) => cascade(profile, DOCTOR_LINKS, from, to);
