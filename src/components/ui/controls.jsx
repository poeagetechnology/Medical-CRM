import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Search, X } from 'lucide-react';
import { Button, IconButton } from './Button';
import { addDays, todayISO } from '../../utils/format';
import { cx } from './cx';

export function SearchInput({ value, onChange, placeholder = 'Search…', className }) {
  return (
    <div className={cx('relative w-full sm:w-72', className)}>
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle pointer-events-none" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="input !pl-9 !pr-9"
      />
      {value && (
        <button type="button" onClick={() => onChange('')} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-subtle hover:text-fg">
          <X size={14} />
        </button>
      )}
    </div>
  );
}

// Segmented control. options: strings or { value, label, count, icon }
export function Tabs({ options, value, onChange, className }) {
  return (
    <div role="tablist" className={cx('inline-flex max-w-full overflow-x-auto scrollbar-thin gap-1 p-1 rounded-lg bg-subtle', className)}>
      {options.map((raw) => {
        const o = typeof raw === 'string' ? { value: raw, label: raw } : raw;
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(o.value)}
            className={cx(
              'inline-flex items-center gap-1.5 h-7 px-3 rounded-md text-xs font-semibold whitespace-nowrap transition',
              on ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted hover:text-fg'
            )}
          >
            {o.icon && <o.icon size={13} />}
            {o.label}
            {o.count !== undefined && (
              <span className={cx('px-1.5 rounded text-2xs tabular', on ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/20 dark:text-brand-200' : 'bg-surface/70 text-fg-subtle')}>
                {o.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function FilterSelect({ value, onChange, options, label, className }) {
  return (
    <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className={cx('input !w-auto min-w-[150px] pr-8', className)}>
      <option value="">{label}</option>
      {options.map((o) => {
        const v = typeof o === 'string' ? { value: o, label: o } : o;
        return <option key={v.value} value={v.value}>{v.label}</option>;
      })}
    </select>
  );
}

// Filters on the left, anything else on the right.
export function FilterBar({ children, right }) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3 min-w-0">{children}</div>
      {right && <div className="flex flex-wrap items-center gap-2">{right}</div>}
    </div>
  );
}

export function ExportButton({ onClick, disabled, children = 'Export' }) {
  return <Button icon={Download} onClick={onClick} disabled={disabled}>{children}</Button>;
}

export function DateNav({ value, onChange }) {
  return (
    <div className="flex items-center gap-1">
      <IconButton label="Previous day" icon={ChevronLeft} onClick={() => onChange(addDays(value, -1))} />
      <input type="date" aria-label="Date" value={value} onChange={(e) => e.target.value && onChange(e.target.value)} className="input !w-40" />
      <IconButton label="Next day" icon={ChevronRight} onClick={() => onChange(addDays(value, 1))} />
      <Button size="sm" onClick={() => onChange(todayISO())} disabled={value === todayISO()}>Today</Button>
    </div>
  );
}

// Click-to-open dropdown. `trigger(open)` renders the button content.
export function Popover({ trigger, children, align = 'right', width = 'w-56', label, triggerClassName }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button type="button" aria-haspopup="true" aria-expanded={open} aria-label={label} title={label} onClick={() => setOpen((o) => !o)} className={triggerClassName}>
        {trigger(open)}
      </button>
      {open && (
        <div className={cx(
          'absolute z-30 mt-2 max-w-[calc(100vw-2rem)] bg-surface border border-line rounded-xl shadow-pop overflow-hidden',
          align === 'right' ? 'right-0' : 'left-0', width
        )}>
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function MenuItem({ icon: Icon, children, onClick, danger, hint }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-left transition',
        danger ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10' : 'text-fg-muted hover:bg-subtle hover:text-fg'
      )}
    >
      {Icon && <Icon size={15} />}
      <span className="flex-1">{children}</span>
      {hint && <span className="text-2xs text-fg-subtle">{hint}</span>}
    </button>
  );
}
