// Record definitions shared by every screen (see components/ui/RecordForm.jsx).
// Keeping them here means "Book appointment" behaves the same whether it is
// opened from Appointments, the Calendar, the Dashboard or a patient profile.
import { sameText, todayISO, uniqueNames } from './format';

// ------------------------------------------------------------------ options
export const PATIENT_STATUSES = ['Critical', 'Stable', 'Checkup', 'Observation', 'Discharged'];
export const GENDERS = ['Male', 'Female', 'Other'];
export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
export const APPOINTMENT_STATUSES = ['Scheduled', 'Pending', 'Completed', 'Cancelled'];
export const APPOINTMENT_TYPES = ['Consultation', 'Follow-up', 'Review', 'Procedure', 'Tele-consult'];
export const SURGERY_STATUSES = ['Scheduled', 'In Progress', 'Completed', 'Cancelled'];
export const OT_ROOMS = ['OT-1', 'OT-2', 'OT-3', 'OT-4'];
export const OP_STATUSES = ['Waiting', 'In Consultation', 'Completed'];
export const CHECKUP_STATUSES = ['Waiting', 'In Progress', 'Completed'];
export const PRIORITIES = ['Normal', 'Urgent'];
export const CHECKUP_TYPES = ['General Checkup', 'Cardiac Screening', 'Diabetes Screening', 'Eye Exam', 'Dental', 'Full Body', 'Pre-employment', 'Other'];
export const REPORT_TYPES = ['Blood Test', 'Urine Test', 'X-Ray', 'MRI', 'CT Scan', 'ECG', 'Ultrasound', 'Pathology', 'Other'];
export const REPORT_STATUSES = ['Pending', 'Completed'];
export const BILL_STATUSES = ['Pending', 'Paid', 'Cancelled'];
export const BILL_SERVICES = ['Consultation', 'Lab Test', 'Medication', 'Surgery', 'Room Charges', 'Ambulance', 'Checkup', 'Other'];
export const PAYMENT_METHODS = ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Insurance'];
export const BED_STATUSES = ['Available', 'Occupied', 'Cleaning', 'Maintenance'];
export const WARDS = ['General', 'ICU', 'Emergency', 'Private', 'Pediatric', 'Maternity'];
export const DOCTOR_STATUSES = ['Available', 'On Duty', 'In Surgery', 'On Leave'];
export const DEPARTMENTS = [
  'Cardiology', 'Orthopedic', 'General', 'Neurology', 'Pediatrics', 'Oncology',
  'ICU', 'OPD', 'Emergency', 'Radiology', 'Gynecology', 'Lab', 'Pharmacy', 'Administration',
];
export const AMBULANCE_STATUSES = ['Available', 'On Route', 'Maintenance'];
export const AMBULANCE_TYPES = ['Basic Life Support', 'Advanced Life Support', 'Patient Transport', 'Neonatal'];
export const MEDICINE_STATUSES = ['In Stock', 'Low Stock', 'Out of Stock'];
export const MEDICINE_CATEGORIES = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Drops', 'Surgical', 'Other'];
export const STAFF_ROLES = ['Nurse', 'Head Nurse', 'Receptionist', 'Lab Technician', 'Pharmacist', 'Ward Boy', 'Technician', 'Administrator'];
export const STAFF_STATUSES = ['Active', 'On Leave', 'Inactive'];
export const SHIFTS = ['Morning', 'Evening', 'Night'];
export const NOTIFICATION_TYPES = [
  { value: 'info', label: 'Info' },
  { value: 'success', label: 'Success' },
  { value: 'critical', label: 'Critical' },
];
export const DEFAULT_REORDER = 20;

// 08:00, 08:30 ... 19:30
export const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
  const h = 8 + Math.floor(i / 2);
  return `${String(h).padStart(2, '0')}:${i % 2 ? '30' : '00'}`;
});

const names = (list) => uniqueNames(list);

// ------------------------------------------------------------------ fields
export const patientFields = ({ doctors = [] } = {}) => [
  { name: 'name', label: 'Full name', required: true, placeholder: 'e.g. Rahul Sharma' },
  { name: 'phone', label: 'Phone', type: 'tel', placeholder: '+91 98765 43210' },
  { name: 'age', label: 'Age', type: 'number', min: 0, max: 130, step: 1 },
  { name: 'gender', label: 'Gender', type: 'select', options: GENDERS },
  { name: 'bloodGroup', label: 'Blood group', type: 'select', options: BLOOD_GROUPS },
  { name: 'status', label: 'Status', type: 'select', required: true, options: PATIENT_STATUSES, defaultValue: 'Stable' },
  { name: 'doctor', label: 'Attending doctor', type: 'combo', suggestions: names(doctors), placeholder: 'Start typing a name' },
  { name: 'room', label: 'Room / ward', placeholder: 'e.g. 204' },
  { name: 'address', label: 'Address', full: true },
  { name: 'emergencyContact', label: 'Emergency contact', placeholder: 'Name & phone' },
  { name: 'lastCheckup', label: 'Last checkup', type: 'date' },
  { name: 'condition', label: 'Condition / diagnosis', type: 'textarea' },
  { name: 'allergies', label: 'Allergies', full: true, placeholder: 'e.g. Penicillin' },
];

export const appointmentFields = ({ patients = [], doctors = [] } = {}) => [
  { name: 'patient', label: 'Patient', type: 'combo', required: true, suggestions: names(patients) },
  { name: 'doctor', label: 'Doctor', type: 'combo', required: true, suggestions: names(doctors) },
  { name: 'date', label: 'Date', type: 'date', required: true, defaultValue: todayISO() },
  { name: 'time', label: 'Time', type: 'select', required: true, options: TIME_SLOTS },
  { name: 'type', label: 'Visit type', type: 'select', options: APPOINTMENT_TYPES, defaultValue: 'Consultation' },
  { name: 'status', label: 'Status', type: 'select', required: true, options: APPOINTMENT_STATUSES, defaultValue: 'Scheduled' },
  { name: 'reason', label: 'Reason / notes', type: 'textarea' },
];

export const surgeryFields = ({ patients = [], doctors = [] } = {}) => [
  { name: 'patient', label: 'Patient', type: 'combo', required: true, suggestions: names(patients) },
  { name: 'type', label: 'Procedure', required: true, placeholder: 'e.g. Appendectomy' },
  { name: 'doctor', label: 'Lead surgeon', type: 'combo', required: true, suggestions: names(doctors) },
  { name: 'room', label: 'Operating theatre', type: 'select', required: true, options: OT_ROOMS },
  { name: 'date', label: 'Date', type: 'date', required: true, defaultValue: todayISO() },
  { name: 'time', label: 'Start time', type: 'select', required: true, options: TIME_SLOTS },
  { name: 'duration', label: 'Est. duration (hours)', type: 'number', min: 0.5, max: 24, step: 0.5 },
  { name: 'status', label: 'Status', type: 'select', required: true, options: SURGERY_STATUSES, defaultValue: 'Scheduled' },
  { name: 'notes', label: 'Notes', type: 'textarea' },
];

export const opFields = ({ patients = [], doctors = [] } = {}) => [
  { name: 'name', label: 'Patient', type: 'combo', required: true, suggestions: names(patients) },
  { name: 'doctor', label: 'Doctor', type: 'combo', required: true, suggestions: names(doctors) },
  { name: 'priority', label: 'Priority', type: 'select', required: true, options: PRIORITIES, defaultValue: 'Normal' },
  { name: 'phone', label: 'Phone', type: 'tel' },
  { name: 'complaint', label: 'Chief complaint', type: 'textarea' },
];

export const checkupFields = ({ patients = [], doctors = [] } = {}) => [
  { name: 'name', label: 'Patient', type: 'combo', required: true, suggestions: names(patients) },
  { name: 'checkupType', label: 'Checkup type', type: 'select', required: true, options: CHECKUP_TYPES },
  { name: 'doctor', label: 'Doctor', type: 'combo', required: true, suggestions: names(doctors) },
  { name: 'date', label: 'Date', type: 'date', required: true, defaultValue: todayISO() },
  { name: 'time', label: 'Time', type: 'select', required: true, options: TIME_SLOTS },
  { name: 'notes', label: 'Notes', type: 'textarea' },
];

export const reportFields = ({ patients = [], doctors = [] } = {}) => [
  { name: 'patient', label: 'Patient', type: 'combo', required: true, suggestions: names(patients) },
  { name: 'type', label: 'Report type', type: 'select', required: true, options: REPORT_TYPES },
  { name: 'doctor', label: 'Requested by', type: 'combo', suggestions: names(doctors) },
  { name: 'date', label: 'Date', type: 'date', required: true, defaultValue: todayISO() },
  { name: 'status', label: 'Status', type: 'select', required: true, options: REPORT_STATUSES, defaultValue: 'Pending' },
  { name: 'findings', label: 'Findings / results', type: 'textarea', rows: 5 },
];

export const billFields = ({ patients = [] } = {}) => [
  { name: 'patient', label: 'Patient', type: 'combo', required: true, suggestions: names(patients) },
  { name: 'service', label: 'Service', type: 'combo', required: true, suggestions: BILL_SERVICES, defaultValue: 'Consultation' },
  { name: 'amount', label: 'Amount ($)', type: 'number', required: true, min: 0.01, step: 0.01 },
  { name: 'date', label: 'Invoice date', type: 'date', required: true, defaultValue: todayISO() },
  { name: 'status', label: 'Status', type: 'select', required: true, options: BILL_STATUSES, defaultValue: 'Pending' },
  { name: 'method', label: 'Payment method', type: 'select', options: PAYMENT_METHODS, visible: (v) => v.status === 'Paid' },
  { name: 'notes', label: 'Notes', type: 'textarea' },
];

export const bedFields = ({ patients = [] } = {}) => [
  { name: 'number', label: 'Bed number', required: true, placeholder: 'e.g. ICU-04' },
  { name: 'ward', label: 'Ward', type: 'combo', required: true, suggestions: WARDS, defaultValue: 'General' },
  { name: 'status', label: 'Status', type: 'select', required: true, options: BED_STATUSES, defaultValue: 'Available' },
  { name: 'patient', label: 'Patient', type: 'combo', suggestions: names(patients), required: true, visible: (v) => v.status === 'Occupied' },
];

export const doctorFields = () => [
  { name: 'name', label: 'Full name', required: true, placeholder: 'Dr. Priya Menon' },
  { name: 'dept', label: 'Department', type: 'combo', required: true, suggestions: DEPARTMENTS },
  { name: 'specialization', label: 'Specialization', placeholder: 'e.g. Interventional cardiology' },
  { name: 'experience', label: 'Experience (years)', type: 'number', min: 0, max: 70, step: 1 },
  { name: 'phone', label: 'Phone', type: 'tel' },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'fee', label: 'Consultation fee ($)', type: 'number', min: 0, step: 1 },
  { name: 'status', label: 'Status', type: 'select', required: true, options: DOCTOR_STATUSES, defaultValue: 'Available' },
];

export const staffFields = () => [
  { name: 'name', label: 'Full name', required: true },
  { name: 'role', label: 'Role', type: 'combo', required: true, suggestions: STAFF_ROLES, defaultValue: 'Nurse' },
  { name: 'dept', label: 'Department', type: 'combo', required: true, suggestions: DEPARTMENTS },
  { name: 'shift', label: 'Shift', type: 'select', required: true, options: SHIFTS, defaultValue: 'Morning' },
  { name: 'phone', label: 'Phone', type: 'tel' },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'joined', label: 'Joining date', type: 'date' },
  { name: 'status', label: 'Status', type: 'select', required: true, options: STAFF_STATUSES, defaultValue: 'Active' },
];

export const medicineFields = () => [
  { name: 'name', label: 'Medicine', required: true, placeholder: 'e.g. Paracetamol 500mg' },
  { name: 'category', label: 'Category', type: 'combo', suggestions: MEDICINE_CATEGORIES },
  { name: 'stock', label: 'Stock (units)', type: 'number', required: true, min: 0, step: 1, defaultValue: 0 },
  { name: 'reorderLevel', label: 'Low-stock level', type: 'number', required: true, min: 0, step: 1, defaultValue: DEFAULT_REORDER,
    hint: 'Flagged "Low Stock" at or below this many units.' },
  { name: 'price', label: 'Price per unit ($)', type: 'number', required: true, min: 0, step: 0.01 },
  { name: 'supplier', label: 'Supplier' },
  { name: 'batch', label: 'Batch no.' },
  { name: 'expiry', label: 'Expiry date', type: 'date' },
];

export const ambulanceFields = () => [
  { name: 'vehicle', label: 'Vehicle / plate no.', required: true, placeholder: 'e.g. AMB-01' },
  { name: 'type', label: 'Type', type: 'select', options: AMBULANCE_TYPES, defaultValue: 'Basic Life Support' },
  { name: 'driver', label: 'Driver' },
  { name: 'phone', label: 'Driver phone', type: 'tel' },
  { name: 'status', label: 'Status', type: 'select', required: true, options: AMBULANCE_STATUSES, defaultValue: 'Available' },
  { name: 'destination', label: 'Pickup / destination', required: true, visible: (v) => v.status === 'On Route' },
  { name: 'patient', label: 'Patient (if known)', visible: (v) => v.status === 'On Route' },
  { name: 'eta', label: 'ETA', placeholder: 'e.g. 12 min', visible: (v) => v.status === 'On Route' },
];

export const notificationFields = () => [
  { name: 'title', label: 'Title', required: true, full: true },
  { name: 'message', label: 'Message', type: 'textarea', required: true },
  { name: 'type', label: 'Type', type: 'select', required: true, options: NOTIFICATION_TYPES, defaultValue: 'info' },
];

// ---------------------------------------------------------- business rules
export const medicineStatus = (stock, reorder = DEFAULT_REORDER) => {
  if (!(Number(stock) > 0)) return 'Out of Stock';
  return Number(stock) <= Number(reorder) ? 'Low Stock' : 'In Stock';
};

// Error message when the doctor already has an active booking at that slot.
export function appointmentConflict(values, appointments, selfId) {
  if (values.status === 'Cancelled') return null;
  const clash = appointments.find(
    (a) =>
      a.id !== selfId &&
      a.status !== 'Cancelled' &&
      a.date && a.date === values.date &&
      a.time === values.time &&
      sameText(a.doctor, values.doctor)
  );
  return clash ? `${values.doctor} already has an appointment at ${values.time} on ${values.date}.` : null;
}

// Same idea for operating theatres and surgeons.
export function surgeryConflict(values, surgeries, selfId) {
  if (values.status === 'Cancelled') return null;
  const active = surgeries.filter(
    (s) => s.id !== selfId && s.status !== 'Cancelled' && s.date && s.date === values.date && s.time === values.time
  );
  if (active.some((s) => s.room === values.room)) return `${values.room} is already booked at ${values.time} on ${values.date}.`;
  if (active.some((s) => sameText(s.doctor, values.doctor))) return `${values.doctor} already has a surgery at ${values.time} on ${values.date}.`;
  return null;
}
