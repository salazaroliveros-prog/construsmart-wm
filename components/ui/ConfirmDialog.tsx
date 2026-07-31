'use client';

import { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useScrollLock } from '@/lib/hooks/useScrollLock';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  
  // Use the scroll lock hook
  useScrollLock(isOpen);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter') onConfirm();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onConfirm, onCancel]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => confirmRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const borderColor = variant === 'danger' ? 'border-red-500/30' : variant === 'warning' ? 'border-amber-500/30' : 'border-cyan-500/30';
  const buttonBg = variant === 'danger' ? 'bg-gradient-to-r from-red-500 to-red-600 hover:opacity-90' : variant === 'warning' ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:opacity-90' : 'bg-gradient-to-r from-cyan-500 to-violet-600 hover:opacity-90';

  return (
    <div
      className="modal-backdrop flex items-center justify-center"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div
        className={`glass-panel rounded-2xl p-6 w-full max-w-md mx-4 border ${borderColor}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${variant === 'danger' ? 'bg-red-500/20' : variant === 'warning' ? 'bg-amber-500/20' : 'bg-cyan-500/20'}`}>
            <AlertTriangle className={`w-5 h-5 ${variant === 'danger' ? 'text-red-400' : variant === 'warning' ? 'text-amber-400' : 'text-cyan-400'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 id="confirm-dialog-title" className="text-lg font-semibold text-white mb-2">{title}</h3>
            <p className="text-sm text-white/60">{message}</p>
          </div>
          <button onClick={onCancel} className="flex-shrink-0 text-white/40 hover:text-white/70">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm hover:bg-white/20">
            {cancelLabel}
          </button>
          <button ref={confirmRef} onClick={onConfirm} className={`px-4 py-2 rounded-lg text-white text-sm font-medium ${buttonBg}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
