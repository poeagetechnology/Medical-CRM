import React from 'react';
import { Inbox, Loader2 } from 'lucide-react';
import { DOTS, TONES, toneOf } from '../../utils/status';
import { initials } from '../../utils/format';
import { cx } from './cx';

// Standard page wrapper: consistent gutters and rhythm on every screen.
export function Page({ children, className }) {
  return <div className={cx('px-4 sm:px-6 lg:px-8 py-6 space-y-6 max-w-[1600px] mx-auto w-full', className)}>{children}</div>;
}

export function PageHeader({ title, description, actions, badge }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-fg">{title}</h1>
          {badge}
        </div>
        {description && <p className="text-sm text-fg-subtle mt-1">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ children, className, ...props }) {
  return <section className={cx('card', className)} {...props}>{children}</section>;
}

export function CardHeader({ title, description, actions, className }) {
  return (
    <div className={cx('flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-line', className)}>
      <div className="min-w-0">
        <h2 className="text-sm font-bold text-fg truncate">{title}</h2>
        {description && <p className="text-xs text-fg-subtle mt-0.5">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}

const ICON_BG = {
  brand: 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300',
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300',
  green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300',
  red: 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300',
  violet: 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300',
  cyan: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-300',
  gray: 'bg-subtle text-fg-muted',
};

export function StatGrid({ children, cols = 4 }) {
  const map = { 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4', 5: 'lg:grid-cols-5' };
  return <div className={cx('grid grid-cols-2 gap-3 sm:gap-4', map[cols])}>{children}</div>;
}

// KPI tile. Becomes a button when `onClick` is given (e.g. to apply a filter).
export function StatCard({ label, value, hint, icon: Icon, tone = 'brand', onClick, active }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cx(
        'card p-4 sm:p-5 flex items-start justify-between gap-3 text-left w-full min-w-0',
        onClick && 'transition hover:border-brand-300 hover:shadow-md',
        active && 'border-brand-500 ring-4 ring-brand-500/10'
      )}
    >
      <div className="min-w-0">
        <p className="text-xs font-semibold text-fg-subtle truncate">{label}</p>
        <p className="text-2xl font-extrabold text-fg mt-1.5 tabular tracking-tight truncate">{value}</p>
        {hint && <p className="text-xs text-fg-subtle mt-1 truncate">{hint}</p>}
      </div>
      {Icon && (
        <span className={cx('hidden sm:flex w-10 h-10 rounded-lg items-center justify-center flex-shrink-0', ICON_BG[tone])}>
          <Icon size={18} />
        </span>
      )}
    </Tag>
  );
}

export function IconTile({ icon: Icon, tone = 'brand', size = 36 }) {
  return (
    <span className={cx('rounded-lg flex items-center justify-center flex-shrink-0', ICON_BG[tone])} style={{ width: size, height: size }}>
      <Icon size={Math.round(size * 0.47)} />
    </span>
  );
}

export function Badge({ tone = 'gray', dot, children, className }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-2xs font-semibold ring-1 ring-inset whitespace-nowrap', TONES[tone], className)}>
      {dot && <span className={cx('w-1.5 h-1.5 rounded-full', DOTS[tone])} />}
      {children}
    </span>
  );
}

export function StatusBadge({ status, className }) {
  if (!status) return <span className="text-fg-subtle">—</span>;
  return <Badge tone={toneOf(status)} dot className={className}>{status}</Badge>;
}

const AVATAR_COLORS = [
  'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-200',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200',
  'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200',
  'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200',
  'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-200',
];

export function Avatar({ name, size = 36, className }) {
  const hash = [...String(name || '')].reduce((a, c) => a + c.charCodeAt(0), 0);
  return (
    <span
      aria-hidden="true"
      className={cx('rounded-full inline-flex items-center justify-center font-bold flex-shrink-0', AVATAR_COLORS[hash % AVATAR_COLORS.length], className)}
      style={{ width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.34)) }}
    >
      {initials(name)}
    </span>
  );
}

// Avatar + name + secondary line, the standard "who" cell in lists.
export function Person({ name, sub, size = 34 }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <Avatar name={name} size={size} />
      <div className="min-w-0">
        <p className="font-semibold text-fg truncate">{name || '—'}</p>
        {sub && <p className="text-xs text-fg-subtle truncate">{sub}</p>}
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, description, action, compact }) {
  return (
    <div className={cx('flex flex-col items-center justify-center text-center px-6', compact ? 'py-8' : 'py-14')}>
      <span className="w-11 h-11 rounded-xl bg-subtle text-fg-subtle flex items-center justify-center mb-3">
        <Icon size={20} />
      </span>
      <p className="text-sm font-semibold text-fg">{title}</p>
      {description && <p className="text-xs text-fg-subtle mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

const Bone = ({ className }) => (
  <div className={cx('relative overflow-hidden rounded-xl bg-subtle after:absolute after:inset-0 after:-translate-x-full after:animate-shimmer after:bg-gradient-to-r after:from-transparent after:via-surface/70 after:to-transparent', className)} />
);

export function PageLoader() {
  return (
    <Page>
      <span className="sr-only" role="status">Loading</span>
      <Bone className="h-8 w-56" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => <Bone key={i} className="h-24" />)}
      </div>
      <Bone className="h-80" />
    </Page>
  );
}

export function Spinner({ label = 'Loading…', full }) {
  return (
    <div role="status" className={cx('flex items-center justify-center gap-2 text-sm text-fg-subtle', full ? 'min-h-screen bg-canvas' : 'py-10')}>
      <Loader2 size={18} className="animate-spin text-brand-600" /> {label}
    </div>
  );
}

export function Progress({ value, tone = 'brand', className }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className={cx('h-2 rounded-full bg-subtle overflow-hidden', className)} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cx('h-full rounded-full transition-all duration-500', DOTS[tone])} style={{ width: `${pct}%` }} />
    </div>
  );
}

// items: [[label, value], ...]
export function DefinitionList({ items, columns = 2 }) {
  return (
    <dl className={cx('grid gap-x-6 gap-y-4', columns === 1 ? 'grid-cols-1' : columns === 3 ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-2')}>
      {items.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-xs text-fg-subtle">{label}</dt>
          <dd className="text-sm font-semibold text-fg mt-0.5 break-words">
            {value === 0 || value ? value : <span className="text-fg-subtle font-normal">—</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function Notice({ tone = 'amber', icon: Icon, children, action }) {
  return (
    <div className={cx('flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl text-sm ring-1 ring-inset', TONES[tone])}>
      {Icon && <Icon size={16} className="flex-shrink-0" />}
      <div className="flex-1 min-w-[200px]">{children}</div>
      {action}
    </div>
  );
}
