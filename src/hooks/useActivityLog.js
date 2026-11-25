import { useCallback } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { canWriteCollection } from '../utils/roles';
import { nowLabel } from '../utils/format';

// Returns log(patientName, text): appends an entry to the `activityLogs`
// collection (shown on the Patient Details timeline). Best-effort: a failure
// to log never blocks the action that triggered it.
export function useActivityLog() {
  const { user, profile } = useAuth();
  const canLog = canWriteCollection(profile, 'activityLogs');
  const uid = user?.uid;
  const who = profile?.name;

  return useCallback(
    async (patient, text) => {
      if (!canLog || !patient || !text) return;
      try {
        await addDoc(collection(db, 'activityLogs'), {
          patient,
          text: who ? `${text} (by ${who})` : text,
          time: nowLabel(),
          createdAt: new Date().toISOString(),
          createdBy: uid || null,
        });
      } catch (err) {
        console.error('Activity log failed:', err);
      }
    },
    [canLog, uid, who]
  );
}
