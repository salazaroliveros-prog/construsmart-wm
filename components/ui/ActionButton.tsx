'use client';

import { ReactNode } from 'react';
import Tooltip from './Tooltip';

interface ActionButtonProps {
  onClick: () => void;
  icon: ReactNode;
  label: string;
  tooltip: string;
  variant?: 'danger' | 'primary' | 'secondary';
  disabled?: boolean;
  className?: string;
}

export default function ActionButton({
  onClick,
  icon,
  label,
  tooltip,
  variant = 'secondary',
  disabled = false,
  className = '',
}: ActionButtonProps) {
  const variantStyles = {
    danger: 'text-red-400 hover:text-red-300 hover:bg-red-500/10',
    primary: 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10',
    secondary: 'text-white/60 hover:text-white hover:bg-white/10',
  };

  return (
    <Tooltip content={tooltip}>
      <button
        onClick={onClick}
        disabled={disabled}
        className={`p-3 rounded-lg transition-all duration-200 min-h-[44px] min-w-[44px] active:scale-95 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${variantStyles[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        aria-label={label}
      >
        {icon}
      </button>
    </Tooltip>
  );
}
