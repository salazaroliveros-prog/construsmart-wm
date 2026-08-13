'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  isLoading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const buttonVariants = {
  primary: 'glass-button bg-gradient-to-r from-cyan-500/20 to-violet-500/20 hover:from-cyan-500/30 hover:to-violet-500/30 border-cyan-500/30 hover:border-cyan-500/50 text-white hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]',
  secondary: 'bg-white/15 hover:bg-white/25 text-white/90 border-white/25 hover:border-white/40 hover:shadow-[0_0_8px_rgba(255,255,255,0.1)]',
  danger: 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border-red-500/30 hover:border-red-500/50 hover:shadow-[0_0_8px_rgba(239,68,68,0.2)]',
  success: 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/30 hover:border-emerald-500/50 hover:shadow-[0_0_8px_rgba(16,185,129,0.2)]',
  ghost: 'bg-transparent hover:bg-white/10 text-white/80 border-transparent hover:border-white/20 hover:shadow-[0_0_4px_rgba(255,255,255,0.05)]',
};

const buttonSizes = {
  small: 'px-3 py-2 text-sm min-h-[36px]',
  medium: 'px-4 py-3 text-base min-h-[44px]',
  large: 'px-6 py-4 text-lg min-h-[52px]',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  icon,
  fullWidth = false,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={`
        ${buttonVariants[variant]}
        ${buttonSizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${isLoading ? 'cursor-wait' : ''}
        rounded-lg
        font-medium
        transition-all
        active:scale-95
        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-cyan-400
        focus-visible:ring-offset-2
        focus-visible:ring-offset-slate-900
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