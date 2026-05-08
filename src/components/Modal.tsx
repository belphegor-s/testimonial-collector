'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  busy?: boolean;
  variant?: 'danger' | 'default';
}

export default function Modal({ open, onClose, title, description, confirmLabel = 'Confirm', onConfirm, busy = false, variant = 'danger' }: ModalProps) {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose, busy]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={reduced ? undefined : { opacity: 0 }}
          animate={reduced ? undefined : { opacity: 1 }}
          exit={reduced ? undefined : { opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => !busy && onClose()}
        >
          <motion.div
            initial={reduced ? undefined : { opacity: 0, scale: 0.95, y: 8 }}
            animate={reduced ? undefined : { opacity: 1, scale: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.15 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-5">
              {variant === 'danger' && (
                <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle size={16} className="text-red-600" />
                </div>
              )}
              <div>
                <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
                {description && <p className="text-sm text-zinc-500 mt-1 leading-relaxed">{description}</p>}
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={onClose}
                disabled={busy}
                className="text-sm text-zinc-500 px-4 py-2 rounded-lg hover:bg-zinc-50 hover:text-zinc-900 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={busy}
                className={`text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50 transition-colors inline-flex items-center gap-2 ${
                  variant === 'danger' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-zinc-900 text-white hover:bg-zinc-700'
                }`}
              >
                {busy && <Loader2 size={13} className="animate-spin" />}
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
