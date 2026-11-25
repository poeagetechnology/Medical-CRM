import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { errorMessage } from '../../utils/errors';

const ToastContext = createContext(null);

const KINDS = {
  success: { icon: CheckCircle2, color: 'text-emerald-500' },
  error: { icon: XCircle, color: 'text-red-500' },
  info: { icon: Info, color: 'text-brand-500' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const push = useCallback(
    (kind, message) => {
      const id = ++nextId.current;
      setToasts((t) => [...t.slice(-3), { id, kind, message }]);
      setTimeout(() => dismiss(id), kind === 'error' ? 6000 : 3500);
    },
    [dismiss]
  );

  const api = useMemo(
    () => ({
      success: (m) => push('success', m),
      error: (m) => push('error', m),
      info: (m) => push('info', m),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {createPortal(
        <div aria-live="polite" className="fixed z-[70] bottom-4 right-4 left-4 sm:left-auto flex flex-col gap-2 sm:w-96 pointer-events-none">
          <AnimatePresence>
            {toasts.map((t) => {
              const { icon: Icon, color } = KINDS[t.kind];
              return (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 40 }}
                  role={t.kind === 'error' ? 'alert' : 'status'}
                  className="pointer-events-auto flex items-start gap-3 bg-surface border border-line shadow-pop rounded-xl px-4 py-3"
                >
                  <Icon size={18} className={`flex-shrink-0 mt-0.5 ${color}`} />
                  <p className="text-sm text-fg flex-1">{t.message}</p>
                  <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="text-fg-subtle hover:text-fg">
                    <X size={14} />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

// run(() => update(...), 'Saved') -> true on success; errors become toasts.
export function useAction() {
  const toast = useToast();
  return useCallback(
    async (fn, successMessage) => {
      try {
        await fn();
        if (successMessage) toast.success(successMessage);
        return true;
      } catch (err) {
        console.error(err);
        toast.error(errorMessage(err));
        return false;
      }
    },
    [toast]
  );
}
