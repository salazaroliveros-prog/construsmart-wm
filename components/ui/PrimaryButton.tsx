'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  isLoading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export default function PrimaryButton({
  children,
  isLoading = false,
  icon,
  fullWidth = false,
  disabled,
  className = '',
  ...props
}: PrimaryButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={`
        glass-button
        min-h-[44px]
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
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
