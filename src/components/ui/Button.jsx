import React from 'react';
import { Loader2 } from 'lucide-react';
import { cx } from './cx';

const VARIANTS = {
  primary: 'bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:bg-brand-800',
  secondary: 'bg-surface text-fg border border-line shadow-sm hover:bg-subtle',
  ghost: 'text-fg-muted hover:bg-subtle hover:text-fg',
  danger: 'bg-red-600 text-white shadow-sm hover:bg-red-700',
  'danger-soft': 'text-red-600 border border-red-200 bg-surface hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10',
  success: 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700',
  soft: 'bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-500/15 dark:text-brand-300 dark:hover:bg-brand-500/25',
};

const SIZES = {
  xs: 'h-7 px-2.5 text-xs gap-1.5 rounded-md',
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-9 px-3.5 text-sm gap-2 rounded-lg',
  lg: 'h-11 px-5 text-sm gap-2 rounded-lg',
};

export function Button({
  variant = 'secondary', size = 'md', icon: Icon, iconRight: IconRight,
  loading = false, disabled, className, children, type = 'button', ...props
}) {
  const iconSize = size === 'xs' ? 13 : 15;
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cx(
        'inline-flex items-center justify-center font-semibold whitespace-nowrap transition select-none',
        'disabled:opacity-55 disabled:cursor-not-allowed',
        VARIANTS[variant], SIZES[size], className
      )}
      {...props}
    >
      {loading ? <Loader2 size={iconSize} className="animate-spin" /> : Icon && <Icon size={iconSize} />}
      {children}
      {IconRight && <IconRight size={iconSize} />}
    </button>
  );
}

const ICON_TONES = {
  neutral: 'text-fg-subtle hover:bg-subtle hover:text-fg',
  brand: 'text-fg-subtle hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/15 dark:hover:text-brand-300',
  green: 'text-fg-subtle hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-500/15',
  red: 'text-fg-subtle hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/15',
};

// Square icon-only button. `label` doubles as tooltip and accessible name.
export function IconButton({ label, icon: Icon, tone = 'neutral', onClick, className, size = 'md', ...props }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={(e) => { e.stopPropagation(); onClick?.(e); }}
      className={cx(
        'inline-flex items-center justify-center rounded-lg transition flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed',
        size === 'sm' ? 'w-7 h-7' : 'w-8 h-8',
        ICON_TONES[tone], className
      )}
      {...props}
    >
      <Icon size={size === 'sm' ? 14 : 16} />
    </button>
  );
}
