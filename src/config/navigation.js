// Single description of every screen: used by the sidebar, header and search.
import {
  Activity, Ambulance, BarChart3, BedDouble, Bell, CalendarClock, CalendarDays, ClipboardCheck,
  CreditCard, FileText, LayoutDashboard, Pill, Scissors, Search, Settings, ShieldCheck,
  Sparkles, Stethoscope, UserCircle, UserRound, Users, UsersRound,
  CalendarPlus, FilePlus2, Receipt, UserPlus, ListPlus, HeartPulse, BellPlus,
} from 'lucide-react';
import { canViewPage, canWriteCollection } from '../utils/roles';

export const SECTIONS = [
  {
    title: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'callendar', label: 'Calendar', icon: CalendarDays },
      { id: 'notifications', label: 'Notifications', icon: Bell },
      { id: 'search', label: 'Search', icon: Search },
    ],
  },
  {
    title: 'Patients',
    items: [
      { id: 'patients', label: 'Patients', icon: Users },
      { id: 'patientDetails', label: 'Patient Details', icon: UserRound },
      { id: 'patientReports', label: 'Patient Reports', icon: FileText },
      { id: 'opPatients', label: 'OP Queue', icon: Activity },
      { id: 'checkupPatients', label: 'Checkups', icon: HeartPulse },
    ],
  },
  {
    title: 'Operations',
    items: [
      { id: 'appointments', label: 'Appointments', icon: CalendarClock },
      { id: 'doctors', label: 'Doctors', icon: Stethoscope },
      { id: 'report', label: 'Smart Reports', icon: Sparkles },
      { id: 'surgeries', label: 'Surgeries', icon: Scissors },
      { id: 'beds', label: 'Bed Management', icon: BedDouble },
      { id: 'ambulance', label: 'Ambulance', icon: Ambulance },
      { id: 'medicalCenter', label: 'Medical Center', icon: Pill },
    ],
  },
  {
    title: 'Finance',
    items: [
      { id: 'billing', label: 'Billing', icon: CreditCard },
      { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    title: 'Administration',
    items: [
      { id: 'staff', label: 'Staff', icon: UsersRound },
      { id: 'admin', label: 'Users & Access', icon: ShieldCheck },
      { id: 'settings', label: 'Settings', icon: Settings },
      { id: 'profile', label: 'My Profile', icon: UserCircle },
    ],
  },
];

export const PAGES = Object.fromEntries(
  SECTIONS.flatMap((s) => s.items.map((i) => [i.id, { ...i, section: s.title }]))
);

// "Create ..." shortcuts. Each opens the page's create form via ?new=1.
export const QUICK_ACTIONS = [
  { page: 'patients', collection: 'patients', label: 'Register patient', icon: UserPlus },
  { page: 'appointments', collection: 'appointments', label: 'Book appointment', icon: CalendarPlus },
  { page: 'opPatients', collection: 'opPatients', label: 'Issue OP token', icon: ListPlus },
  { page: 'checkupPatients', collection: 'checkupPatients', label: 'Book checkup', icon: ClipboardCheck },
  { page: 'billing', collection: 'billing', label: 'Create invoice', icon: Receipt },
  { page: 'patientReports', collection: 'patientReports', label: 'Add medical report', icon: FilePlus2 },
  { page: 'surgeries', collection: 'surgeries', label: 'Schedule surgery', icon: Scissors },
  { page: 'doctors', collection: 'doctors', label: 'Add doctor', icon: Stethoscope },
  { page: 'staff', collection: 'staff', label: 'Add staff member', icon: UsersRound },
  { page: 'beds', collection: 'beds', label: 'Add bed', icon: BedDouble },
  { page: 'ambulance', collection: 'ambulances', label: 'Add ambulance', icon: Ambulance },
  { page: 'medicalCenter', collection: 'medicines', label: 'Add medicine', icon: Pill },
  { page: 'notifications', collection: 'notifications', label: 'Send notification', icon: BellPlus },
];

export const allowedQuickActions = (profile) =>
  QUICK_ACTIONS.filter((a) => canViewPage(profile, a.page) && canWriteCollection(profile, a.collection));
