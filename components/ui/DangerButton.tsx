'use client';

import React from 'react';
import { Loader2, Trash2 } from 'lucide-react';

interface DangerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  isLoading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export default function DangerButton({
  children,
  isLoading = false,
  icon,
  fullWidth = false,
  disabled,
  className = '',
  ...props
}: DangerButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={`
        bg-red-500/20
        hover:bg-red-500/30
        text-red-400
        border-red-500/30
        rounded-lg
        px-4 py-3
        font-medium
        transition-all
        active:scale-95
        disabled:opacity-50
        disabled:cursor-not-allowed
        min-h-[44px]
        touch-manipulation
        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-red-400
        focus-visible:ring-offset-2
        focus-visible:ring-offset-slate-900
        ${fullWidth ? 'w-full' : ''}
        ${isLoading ? 'cursor-wait' : ''}
        ${className}
      `}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : icon ? (
        <span className="flex items-center gap-2">
          {icon}
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
