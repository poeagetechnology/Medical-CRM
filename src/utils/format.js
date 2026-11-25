// Shared helpers: money, dates, text, CSV export, printing.

// "$1,250.50" | "1250" | 1250 -> 1250.5
export const parseAmount = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const n = parseFloat(String(value ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

// 1250.5 -> "$1,250.50", 1250 -> "$1,250"
export const formatMoney = (n) => {
  const num = Number(n) || 0;
  return `$${num.toLocaleString('en-US', {
    minimumFractionDigits: Number.isInteger(num) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
};

// 1250000 -> "$1.3M", 12500 -> "$12.5K"
export const formatMoneyShort = (n) => {
  const num = Number(n) || 0;
  if (Math.abs(num) >= 1e6) return `$${(num / 1e6).toFixed(1).replace(/\.0$/, '')}M`;
  if (Math.abs(num) >= 1e4) return `$${(num / 1e3).toFixed(1).replace(/\.0$/, '')}K`;
  return formatMoney(Math.round(num));
};

const pad = (n) => String(n).padStart(2, '0');

// Date -> "YYYY-MM-DD" in local time (what <input type="date"> uses).
export const toISODate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayISO = () => toISODate(new Date());
export const addDays = (iso, days) => {
  const d = parseISODate(iso) || new Date();
  d.setDate(d.getDate() + days);
  return toISODate(d);
};

// "YYYY-MM-DD" -> local Date (new Date("2026-01-02") would be UTC midnight).
export const parseISODate = (iso) => {
  const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
};

// "2026-11-24" -> "Nov 24, 2026"
export const formatDate = (iso, opts = { month: 'short', day: 'numeric', year: 'numeric' }) => {
  const d = parseISODate(iso) || (iso ? new Date(iso) : null);
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString('en-US', opts) : '—';
};

// "14:30" -> "2:30 PM"; anything unparseable is returned unchanged.
export const formatTime = (t) => {
  const m = String(t || '').match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return t || '—';
  const h = Number(m[1]);
  return `${((h + 11) % 12) + 1}:${m[2]} ${h < 12 ? 'AM' : 'PM'}`;
};

// ISO timestamp -> "just now" / "5m ago" / "3h ago" / "Nov 2"
export const relativeTime = (iso) => {
  if (!iso) return '';
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return '';
  const s = Math.round((Date.now() - then.getTime()) / 1000);
  if (s < 45) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  if (s < 86400 * 7) return `${Math.round(s / 86400)}d ago`;
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// "Nov 24, 3:05 PM" - human label stored next to ISO timestamps
export const nowLabel = () =>
  new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

export const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

// Newest first, using createdAt when present (legacy records without it go last).
export const byNewest = (a, b) => (b.createdAt || '').localeCompare(a.createdAt || '');

export const initials = (name = '') =>
  String(name)
    .replace(/^dr\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';

export const uniqueNames = (list, key = 'name') =>
  [...new Set(list.map((x) => (x[key] || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));

export const sameText = (a, b) => (a || '').trim().toLowerCase() === (b || '').trim().toLowerCase();

// Case-insensitive "does any of these fields contain the query".
export const matches = (query, ...values) => {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return true;
  return values.some((v) => String(v ?? '').toLowerCase().includes(q));
};

export const countBy = (list, fn) =>
  list.reduce((acc, item) => {
    const k = fn(item);
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

// Short readable reference from a Firestore id: "#A1B2C3"
export const shortId = (id) => `#${String(id || '').slice(0, 6).toUpperCase()}`;

// Next sequential code such as OP-101 or INV-1001 (highest existing + 1, so
// deleting a record never produces a duplicate).
export const nextCode = (list, field, prefix, start) => {
  const max = list.reduce((m, x) => {
    const n = parseInt(String(x[field] || '').replace(/\D/g, ''), 10);
    return Number.isFinite(n) && n > m ? n : m;
  }, start);
  return `${prefix}${max + 1}`;
};

// ---------------------------------------------------------------- files
const csvCell = (v) => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function downloadFile(filename, content, mime = 'text/plain') {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// columns: [{ label: 'Patient', value: (row) => row.patient }, ...]
export function exportCsv(filename, columns, rows) {
  const lines = [
    columns.map((c) => csvCell(c.label)).join(','),
    ...rows.map((r) => columns.map((c) => csvCell(c.value(r))).join(',')),
  ];
  // BOM so Excel opens UTF-8 correctly
  downloadFile(filename, `﻿${lines.join('\r\n')}`, 'text/csv');
}

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/*
 * Opens a clean, printable document (save as PDF from the print dialog).
 * sections: [{ heading?, rows?: [[label, value]], text?, table?: { head: [], body: [[]] } }]
 */
export function printDocument({ title, subtitle, sections = [], footer }) {
  const w = window.open('', '_blank', 'width=820,height=960');
  if (!w) return false;
  const body = sections
    .map((s) => {
      let html = s.heading ? `<h2>${esc(s.heading)}</h2>` : '';
      if (s.rows) {
        html += `<dl>${s.rows.map(([k, val]) => `<dt>${esc(k)}</dt><dd>${esc(val || '—')}</dd>`).join('')}</dl>`;
      }
      if (s.table) {
        html += `<table><thead><tr>${s.table.head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${s.table.body
          .map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`)
          .join('')}</tbody></table>`;
      }
      if (s.text) html += `<p class="text">${esc(s.text)}</p>`;
      if (s.total) html += `<p class="total">${esc(s.total)}</p>`;
      return `<section>${html}</section>`;
    })
    .join('');
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
  *{box-sizing:border-box} body{font-family:"Plus Jakarta Sans",Segoe UI,Arial,sans-serif;color:#0f172a;margin:0;padding:48px;font-size:13px}
  header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #224beb;padding-bottom:16px;margin-bottom:24px}
  .brand{font-weight:800;font-size:18px;color:#224beb}.brand small{display:block;font-weight:500;color:#64748b;font-size:11px}
  h1{font-size:20px;margin:0 0 4px}.sub{color:#64748b;margin:0}
  h2{font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#64748b;margin:24px 0 8px}
  dl{display:grid;grid-template-columns:160px 1fr;gap:6px 16px;margin:0} dt{color:#64748b} dd{margin:0;font-weight:600}
  table{width:100%;border-collapse:collapse} th,td{text-align:left;padding:8px;border-bottom:1px solid #e2e8f0} th{font-size:11px;color:#64748b;text-transform:uppercase}
  .text{white-space:pre-wrap;line-height:1.6;margin:0} .total{text-align:right;font-size:16px;font-weight:800;margin-top:12px}
  footer{margin-top:40px;padding-top:12px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:11px}
</style></head><body>
<header><div><h1>${esc(title)}</h1>${subtitle ? `<p class="sub">${esc(subtitle)}</p>` : ''}</div>
<div class="brand">MedCRM<small>Hospital Management</small></div></header>
${body}
<footer>${esc(footer || `Generated ${new Date().toLocaleString()}`)}</footer>
<script>window.onload=function(){setTimeout(function(){window.print()},250)}</script>
</body></html>`);
  w.document.close();
  return true;
}
