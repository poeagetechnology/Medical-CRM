import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { Button, IconButton } from './Button';
import { useToast } from './Toast';
import { errorMessage } from '../../utils/errors';
import { cx } from './cx';

// Open overlays, oldest first: Esc only closes the one on top.
const stack = [];

export function useOverlay(onClose) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const token = {};
    stack.push(token);
    const previousFocus = document.activeElement;
    const onKey = (e) => {
      if (e.key === 'Escape' && stack[stack.length - 1] === token) {
        e.stopPropagation();
        closeRef.current?.();
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      stack.splice(stack.indexOf(token), 1);
      if (!stack.length) document.body.style.overflow = '';
      previousFocus?.focus?.();
    };
  }, []);
}

function Header({ title, description, onClose }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 sm:px-6 py-4 border-b border-line flex-shrink-0">
      <div className="min-w-0">
        <h2 className="text-base font-bold text-fg truncate">{title}</h2>
        {description && <p className="text-xs text-fg-subtle mt-0.5">{description}</p>}
      </div>
      <IconButton label="Close" icon={X} onClick={onClose} className="-mr-1.5" />
    </div>
  );
}

const Footer = ({ children }) => (
  <div className="flex flex-wrap items-center justify-end gap-2 px-5 sm:px-6 py-3.5 border-t border-line bg-subtle/50 flex-shrink-0">
    {children}
  </div>
);

export function Modal({ title, description, onClose, children, footer, width = 'max-w-lg' }) {
  useOverlay(onClose);
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-950/50 backdrop-blur-[2px]"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.18 }}
        className={cx('w-full bg-surface border border-line shadow-pop rounded-t-2xl sm:rounded-2xl max-h-[92vh] flex flex-col', width)}
      >
        <Header title={title} description={description} onClose={onClose} />
        <div className="overflow-y-auto scrollbar-thin px-5 sm:px-6 py-5">{children}</div>
        {footer && <Footer>{footer}</Footer>}
      </motion.div>
    </div>,
    document.body
  );
}

// Right-hand side panel for record details.
export function Drawer({ title, description, onClose, children, footer, width = 'max-w-md' }) {
  useOverlay(onClose);
  return createPortal(
    <div
      className="fixed inset-0 z-40 flex justify-end bg-slate-950/40 backdrop-blur-[2px]"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.aside
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        initial={{ x: 48, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={cx('w-full h-full bg-surface border-l border-line shadow-pop flex flex-col', width)}
      >
        <Header title={title} description={description} onClose={onClose} />
        <div className="flex-1 overflow-y-auto scrollbar-thin px-5 sm:px-6 py-5">{children}</div>
        {footer && <Footer>{footer}</Footer>}
      </motion.aside>
    </div>,
    document.body
  );
}

/*
 * Confirmation for destructive or irreversible actions.
 * `requireText` makes the user type a word first (used for bulk wipes).
 */
export function ConfirmDialog({
  title = 'Are you sure?', message, confirmLabel = 'Delete', tone = 'danger',
  requireText, successMessage = 'Deleted successfully', onConfirm, onClose,
}) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [typed, setTyped] = useState('');

  const run = async () => {
    setBusy(true);
    setError('');
    try {
      await onConfirm();
      toast.success(successMessage);
      onClose();
    } catch (err) {
      console.error(err);
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <Modal
      title={title}
      onClose={busy ? () => {} : onClose}
      width="max-w-md"
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>Cancel</Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            onClick={run}
            loading={busy}
            disabled={!!requireText && typed.trim() !== requireText}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-4">
        <div className={cx(
          'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
          tone === 'danger' ? 'bg-red-50 text-red-600 dark:bg-red-500/15' : 'bg-brand-50 text-brand-600 dark:bg-brand-500/15'
        )}>
          <AlertTriangle size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-fg-muted leading-relaxed">{message}</p>
          {requireText && (
            <label className="block mt-4">
              <span className="label">Type {requireText} to confirm</span>
              <input className="input" value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus />
            </label>
          )}
          {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
        </div>
      </div>
    </Modal>
  );
}
