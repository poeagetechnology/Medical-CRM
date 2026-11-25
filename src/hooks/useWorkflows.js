// Cross-screen workflows: each action keeps the related records consistent.
import { useCallback } from 'react';
import { useCollection } from './useCollection';
import { useActivityLog } from './useActivityLog';
import { nextCode, sameText, todayISO } from '../utils/format';

// A side effect on a related record must never fail the main action.
const quietly = async (fn) => {
  try { await fn(); } catch (err) { console.error('Linked record not updated:', err); }
};

// Keeps patients.room in step with bed occupancy.
export function useBedSync() {
  const patients = useCollection('patients');

  return useCallback(
    async (bedNumber, admitted, released) => {
      if (!patients.canWrite) return;
      const find = (name) => patients.data.find((p) => sameText(p.name, name));
      const out = released && !sameText(released, admitted) ? find(released) : null;
      if (out && out.room === bedNumber) await quietly(() => patients.update(out.id, { room: '' }));
      const into = admitted ? find(admitted) : null;
      if (into && into.room !== bedNumber) await quietly(() => patients.update(into.id, { room: bedNumber }));
    },
    [patients]
  );
}

// Check-in, status changes for appointments.
export function useAppointmentActions() {
  const appointments = useCollection('appointments');
  const queue = useCollection('opPatients');
  const log = useActivityLog();

  const canCheckIn = appointments.canWrite && queue.canWrite && !queue.loading;

  const isCheckInDue = (a) =>
    canCheckIn && !a.checkedIn && a.date === todayISO() && (a.status === 'Scheduled' || a.status === 'Pending');

  const setStatus = async (a, status) => {
    await appointments.update(a.id, { status });
    log(a.patient, `Appointment with ${a.doctor} marked ${status}`);
  };

  // Moves today's appointment into the OP queue with the next token.
  const checkIn = async (a) => {
    const waiting = queue.data.find((q) => sameText(q.name, a.patient) && q.status !== 'Completed');
    if (waiting) throw new Error(`${a.patient} is already in the queue (token ${waiting.token}).`);
    const token = nextCode(queue.data, 'token', 'OP-', 100);
    await queue.add({
      name: a.patient, doctor: a.doctor, token, status: 'Waiting', priority: 'Normal',
      complaint: a.reason || '', appointmentId: a.id,
    });
    await appointments.update(a.id, { checkedIn: true, status: 'Scheduled' });
    log(a.patient, `Checked in for ${a.doctor} (token ${token})`);
    return token;
  };

  return { ...appointments, isCheckInDue, setStatus, checkIn };
}

// Surgery lifecycle; the surgeon's availability follows the operation.
export function useSurgeryActions() {
  const surgeries = useCollection('surgeries');
  const doctors = useCollection('doctors');
  const log = useActivityLog();

  const setStatus = async (s, status) => {
    await surgeries.update(s.id, { status });
    log(s.patient, `Surgery (${s.type}) ${status.toLowerCase()}`);
    const surgeon = doctors.data.find((d) => sameText(d.name, s.doctor));
    if (surgeon && doctors.canWrite) {
      if (status === 'In Progress') await quietly(() => doctors.update(surgeon.id, { status: 'In Surgery' }));
      else if (surgeon.status === 'In Surgery') await quietly(() => doctors.update(surgeon.id, { status: 'Available' }));
    }
  };

  return { ...surgeries, setStatus };
}
