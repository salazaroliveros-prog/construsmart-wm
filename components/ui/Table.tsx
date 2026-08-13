'use client';

import React from 'react';

interface TableProps {
  columns: {
    key: string;
    header: string;
    className?: string;
  }[];
  data: Record<string, any>[];
  onRowClick?: (row: Record<string, any>) => void;
  className?: string;
  emptyMessage?: string;
}

export function Table({ columns, data, onRowClick, className = '', emptyMessage = 'No hay datos disponibles' }: TableProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-white/60">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className={`w-full border-collapse ${className}`}>
        <thead>
          <tr className="border-b border-white/10">
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider ${column.className || ''}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={index}
              onClick={() => onRowClick?.(row)}
              className={`border-b border-white/5 hover:bg-white/5 transition-all duration-200 ${onRowClick ? 'cursor-pointer' : ''}`}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`px-4 py-3 text-sm text-white/80 ${column.className || ''}`}
                >
                  {row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Componente de celda de tabla con badge
export function TableCellBadge({ value, variant = 'default' }: { value: string; variant?: 'default' | 'success' | 'warning' | 'error' | 'info' }) {
  const variantStyles = {
    default: 'bg-white/10 text-white/80 border-white/20',
    success: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    warning: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    error: 'bg-red-500/20 text-red-300 border-red-500/30',
    info: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  };

  return (
    <span className={`px-2 py-1 rounded-md text-xs font-medium border ${variantStyles[variant]}`}>
      {value}
    </span>
  );
}

// Componente de celda de tabla con icono
export function TableCellIcon({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-white/60">{icon}</span>
      <span className="text-sm text-white/80">{text}</span>
    </div>
  );
}

// Componente de celda de tabla con acciones
export function TableCellActions({ actions }: { actions: Array<{ label: string; onClick: () => void; variant?: 'default' | 'danger' }> }) {
  return (
    <div className="flex gap-2">
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={action.onClick}
          className={`px-2 py-1 rounded text-xs font-medium transition-all duration-200 min-h-[32px] ${
            action.variant === 'danger'
              ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30'
              : 'bg-white/10 hover:bg-white/20 text-white/80 border border-white/20'
          }`}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}