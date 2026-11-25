// One place that decides which colour every status uses across the app.

export const TONES = {
  gray: 'bg-slate-100 text-slate-700 ring-slate-500/15 dark:bg-slate-400/10 dark:text-slate-300 dark:ring-slate-400/20',
  blue: 'bg-blue-50 text-blue-700 ring-blue-600/15 dark:bg-blue-400/10 dark:text-blue-300 dark:ring-blue-400/20',
  brand: 'bg-brand-50 text-brand-700 ring-brand-600/15 dark:bg-brand-400/10 dark:text-brand-300 dark:ring-brand-400/20',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/20',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20',
  red: 'bg-red-50 text-red-700 ring-red-600/15 dark:bg-red-400/10 dark:text-red-300 dark:ring-red-400/20',
  violet: 'bg-violet-50 text-violet-700 ring-violet-600/15 dark:bg-violet-400/10 dark:text-violet-300 dark:ring-violet-400/20',
  cyan: 'bg-cyan-50 text-cyan-700 ring-cyan-600/15 dark:bg-cyan-400/10 dark:text-cyan-300 dark:ring-cyan-400/20',
};

// Solid dot colour per tone (status dots, chart legends).
export const DOTS = {
  gray: 'bg-slate-400',
  blue: 'bg-blue-500',
  brand: 'bg-brand-500',
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  violet: 'bg-violet-500',
  cyan: 'bg-cyan-500',
};

// Hex values for charts.
export const HEX = {
  gray: '#94a3b8',
  blue: '#3b82f6',
  brand: '#3869f6',
  green: '#10b981',
  amber: '#f59e0b',
  red: '#ef4444',
  violet: '#8b5cf6',
  cyan: '#06b6d4',
};

const STATUS_TONE = {
  // patients
  Critical: 'red',
  Stable: 'green',
  Checkup: 'blue',
  Observation: 'amber',
  Discharged: 'gray',
  // appointments / surgeries / queues
  Scheduled: 'blue',
  Pending: 'amber',
  Completed: 'green',
  Cancelled: 'gray',
  'In Progress': 'violet',
  'In Consultation': 'violet',
  Waiting: 'amber',
  // doctors / staff
  Available: 'green',
  'On Duty': 'blue',
  'In Surgery': 'red',
  'On Leave': 'amber',
  Active: 'green',
  Inactive: 'gray',
  Suspended: 'red',
  // beds / fleet
  Occupied: 'red',
  Cleaning: 'amber',
  Maintenance: 'gray',
  'On Route': 'blue',
  // billing / inventory
  Paid: 'green',
  'In Stock': 'green',
  'Low Stock': 'amber',
  'Out of Stock': 'red',
  // priority / notifications
  Urgent: 'red',
  Normal: 'gray',
  critical: 'red',
  info: 'blue',
  success: 'green',
};

export const toneOf = (status) => STATUS_TONE[status] || 'gray';
