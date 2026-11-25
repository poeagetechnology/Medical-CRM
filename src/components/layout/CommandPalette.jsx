import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarClock, CornerDownLeft, Receipt, Search, Stethoscope, UserRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCollection } from '../../hooks/useCollection';
import { SECTIONS, allowedQuickActions } from '../../config/navigation';
import { canViewPage } from '../../utils/roles';
import { formatDate, matches } from '../../utils/format';
import { invoiceNumber } from '../../services/documents';
import { cx, useOverlay } from '../ui';

const LIMIT = 5;

// Ctrl/Cmd + K: jump to any page, run a quick action or open a record.
export default function CommandPalette({ onClose, onNavigate }) {
  const { profile } = useAuth();
  const { data: patients } = useCollection('patients');
  const { data: doctors } = useCollection('doctors');
  const { data: appointments } = useCollection('appointments');
  const { data: bills } = useCollection('billing');
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const listRef = useRef(null);
  useOverlay(onClose);

  const items = useMemo(() => {
    const q = query.trim();
    const out = [];
    const push = (group, list) => list.forEach((i) => out.push({ group, ...i }));

    push('Quick actions', allowedQuickActions(profile)
      .filter((a) => matches(q, a.label))
      .slice(0, q ? LIMIT : 4)
      .map((a) => ({ id: `act-${a.page}`, label: a.label, icon: a.icon, to: [a.page, { new: '1' }] })));

    push('Pages', SECTIONS.flatMap((s) => s.items.map((i) => ({ ...i, section: s.title })))
      .filter((p) => canViewPage(profile, p.id) && matches(q, p.label, p.section))
      .slice(0, q ? LIMIT : 8)
      .map((p) => ({ id: `page-${p.id}`, label: p.label, sub: p.section, icon: p.icon, to: [p.id] })));

    if (q) {
      push('Patients', patients.filter((p) => matches(q, p.name, p.phone, p.room, p.condition)).slice(0, LIMIT)
        .map((p) => ({ id: `pat-${p.id}`, label: p.name, sub: [p.status, p.doctor].filter(Boolean).join(' · '), icon: UserRound, to: ['patientDetails', { patientId: p.id }] })));
      if (canViewPage(profile, 'doctors')) {
        push('Doctors', doctors.filter((d) => matches(q, d.name, d.dept)).slice(0, LIMIT)
          .map((d) => ({ id: `doc-${d.id}`, label: d.name, sub: d.dept, icon: Stethoscope, to: ['doctors', { q: d.name }] })));
      }
      if (canViewPage(profile, 'appointments')) {
        push('Appointments', appointments.filter((a) => matches(q, a.patient, a.doctor)).slice(0, LIMIT)
          .map((a) => ({ id: `apt-${a.id}`, label: `${a.patient} — ${a.doctor}`, sub: `${formatDate(a.date)} · ${a.status}`, icon: CalendarClock, to: ['appointments', { q: a.patient, view: 'list' }] })));
      }
      if (canViewPage(profile, 'billing')) {
        push('Invoices', bills.filter((b) => matches(q, b.patient, b.invoiceNo, b.service)).slice(0, LIMIT)
          .map((b) => ({ id: `bill-${b.id}`, label: `${invoiceNumber(b)} — ${b.patient}`, sub: `${b.amount} · ${b.status}`, icon: Receipt, to: ['billing', { q: b.patient }] })));
      }
    }
    return out;
  }, [query, profile, patients, doctors, appointments, bills]);

  useEffect(() => setIndex(0), [query]);
  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView?.({ block: 'nearest' });
  }, [index]);

  const run = (item) => {
    if (!item) return;
    onClose();
    onNavigate(...item.to);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIndex((i) => Math.min(items.length - 1, i + 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setIndex((i) => Math.max(0, i - 1)); }
    if (e.key === 'Enter') { e.preventDefault(); run(items[index]); }
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[10vh] bg-slate-950/50 backdrop-blur-[2px]" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label="Search" className="w-full max-w-xl bg-surface border border-line rounded-2xl shadow-pop overflow-hidden">
        <div className="flex items-center gap-3 px-4 border-b border-line">
          <Search size={17} className="text-fg-subtle" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search patients, doctors, invoices, pages…"
            className="flex-1 h-14 bg-transparent text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-0"
          />
          <kbd className="font-mono text-2xs px-1.5 py-0.5 rounded border border-line text-fg-subtle">Esc</kbd>
        </div>
        <div ref={listRef} className="max-h-[55vh] overflow-y-auto scrollbar-thin p-2">
          {items.map((item, i) => {
            const Icon = item.icon;
            const heading = i === 0 || items[i - 1].group !== item.group;
            return (
              <React.Fragment key={item.id}>
                {heading && <p className="px-3 pt-3 pb-1 text-2xs font-bold uppercase tracking-wider text-fg-subtle">{item.group}</p>}
                <button
                  type="button"
                  data-active={i === index}
                  onMouseMove={() => setIndex(i)}
                  onClick={() => run(item)}
                  className={cx('flex items-center gap-3 w-full px-3 py-2 rounded-lg text-left', i === index ? 'bg-brand-50 dark:bg-brand-500/15' : '')}
                >
                  <Icon size={16} className={i === index ? 'text-brand-600' : 'text-fg-subtle'} />
                  <span className="text-sm font-semibold text-fg truncate">{item.label}</span>
                  {item.sub && <span className="text-xs text-fg-subtle truncate">{item.sub}</span>}
                  {i === index && <CornerDownLeft size={13} className="ml-auto text-fg-subtle flex-shrink-0" />}
                </button>
              </React.Fragment>
            );
          })}
          {items.length === 0 && <p className="py-10 text-center text-sm text-fg-subtle">No results for “{query}”.</p>}
        </div>
      </div>
    </div>,
    document.body
  );
}
