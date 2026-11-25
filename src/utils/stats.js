// Aggregations for dashboard and analytics charts.
import { addDays, formatDate, parseAmount, parseISODate, toISODate, todayISO } from './format';

// The calendar day a record belongs to ("YYYY-MM-DD"), or '' when unknown.
export const dayKey = (record, field = 'date') => {
  const raw = record?.[field];
  if (parseISODate(raw)) return String(raw).slice(0, 10);
  const d = new Date(raw || record?.createdAt || '');
  return Number.isNaN(d.getTime()) ? '' : toISODate(d);
};

export const lastNDays = (n) => Array.from({ length: n }, (_, i) => addDays(todayISO(), i - n + 1));

export const sumAmounts = (bills) => bills.reduce((t, b) => t + parseAmount(b.amount), 0);

// When a bill was settled: paidAt for new records, the invoice date otherwise.
export const paidDay = (bill) => (bill.paidAt ? toISODate(new Date(bill.paidAt)) : dayKey(bill));

// [{ key, label, value }] per day for the last n days.
export function dailySeries(records, n, dayOf, valueOf = () => 1) {
  const days = lastNDays(n);
  const totals = Object.fromEntries(days.map((d) => [d, 0]));
  records.forEach((r) => {
    const k = dayOf(r);
    if (k in totals) totals[k] += valueOf(r);
  });
  return days.map((d) => ({ key: d, label: formatDate(d, { month: 'short', day: 'numeric' }), value: totals[d] }));
}

// [{ key: "2026-11", label: "Nov", value }] for the last n months.
export function monthlySeries(records, n, dayOf, valueOf = () => 1) {
  const now = new Date();
  const months = Array.from({ length: n }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1);
    return { key: toISODate(d).slice(0, 7), label: d.toLocaleDateString('en-US', { month: 'short' }), value: 0 };
  });
  const index = Object.fromEntries(months.map((m) => [m.key, m]));
  records.forEach((r) => {
    const m = index[dayOf(r).slice(0, 7)];
    if (m) m.value += valueOf(r);
  });
  return months;
}

// Counts by a key, biggest first: [{ name, value }].
export function groupCount(records, keyOf, valueOf = () => 1) {
  const map = new Map();
  records.forEach((r) => {
    const k = keyOf(r) || 'Unspecified';
    map.set(k, (map.get(k) || 0) + valueOf(r));
  });
  return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}
