'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface SecondaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  isLoading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export default function SecondaryButton({
  children,
  isLoading = false,
  icon,
  fullWidth = false,
  disabled,
  className = '',
  ...props
}: SecondaryButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={`
        bg-white/15
        hover:bg-white/25
        text-white/90
        border-white/25
        rounded-lg
        px-4 py-3
        font-medium
        transition-all
        active:scale-95
        disabled:opacity-50
        disabled:cursor-not-allowed
        min-h-[44px]
        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-cyan-400
        focus-visible:ring-offset-2
        focus-visible:ring-offset-slate-900
        ${fullWidth ? 'w-full' : ''}
        ${isLoading ? 'cursor-wait' : ''}
        ${className}
      `}
      style={{ touchAction: 'manipulation' }}
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
