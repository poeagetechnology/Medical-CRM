// Single source of truth for role-based access control (RBAC).
//
// IMPORTANT: firestore.rules (project root) mirrors COLLECTION_ACCESS,
// and APPROVAL_ROLES below. If you change anything here,
// change firestore.rules the same way and re-deploy the rules.

export const ROLE = {
  SUPER_ADMIN: 'Super Admin',
  MANAGER: 'Manager',
  DOCTOR: 'Doctor',
  NURSE: 'Nurse',
  RECEPTIONIST: 'Receptionist',
  LAB_TECH: 'Lab Technician',
  VIEWER: 'Viewer',
};

const { SUPER_ADMIN: SA, MANAGER: MGR, DOCTOR: DOC, NURSE: NUR, RECEPTIONIST: REC, LAB_TECH: LAB, VIEWER: VIEW } = ROLE;

export const ALL_ROLES = [SA, MGR, DOC, NUR, REC, LAB, VIEW];

// Roles shown on the sign-up screen. Super Admin is deliberately NOT listed:
// that account is created once with `npm run create-super-admin`, and later
// Super Admins are promoted from the Admin page.
export const ROLE_OPTIONS = [
  { value: MGR, label: 'Manager',        desc: 'Manage staff, reports & operations',    icon: '👔' },
  { value: DOC, label: 'Doctor',         desc: 'Patient care, prescriptions & checkups', icon: '🩺' },
  { value: NUR, label: 'Nurse',          desc: 'Patient monitoring & bedside care',     icon: '💉' },
  { value: REC, label: 'Receptionist',   desc: 'Patient registration & appointments',   icon: '📋' },
  { value: LAB, label: 'Lab Technician', desc: 'Lab tests & diagnostic reports',        icon: '🔬' },
  { value: VIEW, label: 'Viewer',        desc: 'Read-only access to reports & data',    icon: '👁️' },
];

// Every sign-up stays "Pending" until a Super Admin approves it on the Admin page.
export const APPROVAL_ROLES = ROLE_OPTIONS.map((r) => r.value);

// Roles that must pick a department when signing up.
export const DEPARTMENT_ROLES = [DOC, NUR, LAB, MGR];

export const USER_STATUS = {
  ACTIVE: 'Active',
  PENDING: 'Pending',
  SUSPENDED: 'Suspended',
};

// ---------------------------------------------------------------------------
// Page (screen) access. `view` = can open the page, `edit` = can change data.
// ---------------------------------------------------------------------------
export const PAGE_ACCESS = {
  dashboard:       { view: ALL_ROLES },
  callendar:       { view: ALL_ROLES },
  notifications:   { view: ALL_ROLES },
  search:          { view: ALL_ROLES },
  profile:         { view: ALL_ROLES },
  settings:        { view: ALL_ROLES },

  patients:        { view: ALL_ROLES },
  patientDetails:  { view: ALL_ROLES },
  patientReports:  { view: [SA, MGR, DOC, NUR, LAB, VIEW] },
  opPatients:      { view: [SA, MGR, DOC, NUR, REC],      edit: [SA, MGR, DOC, NUR, REC] },
  checkupPatients: { view: [SA, MGR, DOC, NUR, LAB, REC], edit: [SA, MGR, DOC, NUR, REC, LAB] },

  appointments:    { view: [SA, MGR, DOC, NUR, REC, VIEW], edit: [SA, MGR, DOC, REC] },
  doctors:         { view: [SA, MGR, DOC, NUR, REC, VIEW] },
  report:          { view: [SA, MGR, DOC, REC, VIEW],     edit: [SA, MGR] },
  ambulance:       { view: [SA, MGR, DOC, NUR, REC] },
  surgeries:       { view: [SA, MGR, DOC, NUR, VIEW] },
  beds:            { view: [SA, MGR, DOC, NUR, REC, VIEW] },
  medicalCenter:   { view: [SA, MGR, DOC, NUR, LAB] },

  billing:         { view: [SA, MGR, REC, VIEW] },
  analytics:       { view: [SA, MGR, VIEW] },

  staff:           { view: [SA, MGR], edit: [SA, MGR] },
  admin:           { view: [SA],      edit: [SA] },
};

// ---------------------------------------------------------------------------
// Firestore collection access (mirrored in firestore.rules).
// ---------------------------------------------------------------------------
export const COLLECTION_ACCESS = {
  // read   = who may list / open records
  // write  = who may create & edit records
  // delete = who may remove records (defaults to `write` when omitted)
  patients:        { read: ALL_ROLES,                       write: [SA, MGR, DOC, NUR, REC],      delete: [SA, MGR] },
  doctors:         { read: ALL_ROLES,                       write: [SA, MGR],                     delete: [SA, MGR] },
  appointments:    { read: ALL_ROLES,                       write: [SA, MGR, DOC, REC],           delete: [SA, MGR, DOC, REC] },
  billing:         { read: [SA, MGR, REC, VIEW],            write: [SA, MGR, REC],                delete: [SA, MGR] },
  ambulances:      { read: [SA, MGR, DOC, NUR, REC],        write: [SA, MGR, REC],                delete: [SA, MGR] },
  surgeries:       { read: [SA, MGR, DOC, NUR, REC, VIEW],  write: [SA, MGR, DOC],               delete: [SA, MGR] },
  beds:            { read: [SA, MGR, DOC, NUR, REC, VIEW],  write: [SA, MGR, NUR],                delete: [SA, MGR] },
  medicines:       { read: [SA, MGR, DOC, NUR, LAB],        write: [SA, MGR, LAB],                delete: [SA, MGR] },
  opPatients:      { read: [SA, MGR, DOC, NUR, REC, VIEW],  write: [SA, MGR, DOC, NUR, REC],      delete: [SA, MGR, REC] },
  checkupPatients: { read: [SA, MGR, DOC, NUR, REC, LAB],   write: [SA, MGR, DOC, NUR, REC, LAB], delete: [SA, MGR, REC] },
  staff:           { read: [SA, MGR],                       write: [SA, MGR],                     delete: [SA, MGR] },
  admins:          { read: [SA],                            write: [SA],                          delete: [SA] },
  patientReports:  { read: [SA, MGR, DOC, NUR, LAB, VIEW],  write: [SA, MGR, DOC, LAB],           delete: [SA, MGR] },
  notifications:   { read: ALL_ROLES,                       write: [SA, MGR],                     delete: [SA, MGR] },
  activityLogs:    { read: ALL_ROLES,                       write: [SA, MGR, DOC, NUR, REC, LAB], delete: [SA] },
  users:           { read: [SA],                            write: [SA],                          delete: [SA] },
};

// ---------------------------------------------------------------------------
// Helpers. `profile` is the Firestore users/{uid} document (or null).
// A role only counts while the account is Active.
// ---------------------------------------------------------------------------
export const isActiveProfile = (profile) =>
  !!profile && profile.status === USER_STATUS.ACTIVE && ALL_ROLES.includes(profile.role);

const roleOf = (profile) => (isActiveProfile(profile) ? profile.role : null);

export const canViewPage = (profile, page) => {
  const role = roleOf(profile);
  return !!role && !!PAGE_ACCESS[page]?.view?.includes(role);
};

export const canEditPage = (profile, page) => {
  const role = roleOf(profile);
  return !!role && !!PAGE_ACCESS[page]?.edit?.includes(role);
};

export const canReadCollection = (profile, name) => {
  const role = roleOf(profile);
  return !!role && !!COLLECTION_ACCESS[name]?.read?.includes(role);
};

export const canWriteCollection = (profile, name) => {
  const role = roleOf(profile);
  return !!role && !!COLLECTION_ACCESS[name]?.write?.includes(role);
};

export const canDeleteCollection = (profile, name) => {
  const role = roleOf(profile);
  const access = COLLECTION_ACCESS[name];
  return !!role && !!(access?.delete || access?.write)?.includes(role);
};

export const isSuperAdmin = (profile) => roleOf(profile) === SA;

// First page a user is allowed to open.
export const firstAllowedPage = (profile) =>
  Object.keys(PAGE_ACCESS).find((p) => canViewPage(profile, p)) || null;
