'use client';

import { useState, useCallback } from 'react';

interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
}

export function useConfirm() {
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  const confirm = useCallback(
    (config: Omit<ConfirmState, 'isOpen' | 'onConfirm'>) => {
      return new Promise<boolean>((resolve) => {
        setConfirmState({
          ...config,
          isOpen: true,
          onConfirm: () => {
            setConfirmState(null);
            resolve(true);
          },
        });
      });
    },
    []
  );

  const cancel = useCallback(() => {
    setConfirmState(null);
  }, []);

  return {
    confirmState,
    confirm,
    cancel,
  };
}
