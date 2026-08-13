'use client';

import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  homeHref?: string;
}

export function Breadcrumbs({ items, className = '', homeHref = '/' }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={`flex items-center gap-2 text-sm ${className}`}>
      {/* Home link */}
      <a
        href={homeHref}
        className="flex items-center gap-1 text-white/60 hover:text-white transition-colors min-h-[44px] px-2"
      >
        <Home className="w-4 h-4" />
        <span className="hidden sm:inline">Inicio</span>
      </a>

      {/* Breadcrumb items */}
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="w-4 h-4 text-white/30 flex-shrink-0" />
          {item.href ? (
            <a
              href={item.href}
              className="flex items-center gap-1 text-white/60 hover:text-white transition-colors min-h-[44px] px-2"
            >
              {item.icon && <span className="text-white/40">{item.icon}</span>}
              <span className="truncate max-w-[150px]">{item.label}</span>
            </a>
          ) : (
            <span className="flex items-center gap-1 text-white font-medium min-h-[44px] px-2">
              {item.icon && <span className="text-white/40">{item.icon}</span>}
              <span className="truncate max-w-[150px]">{item.label}</span>
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

// Breadcrumb simplificado para contextos específicos
export function SimpleBreadcrumbs({ items, className = '' }: { items: string[]; className?: string }) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={`flex items-center gap-2 text-xs ${className}`}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <ChevronRight className="w-3 h-3 text-white/30 flex-shrink-0" />}
          <span className={index === items.length - 1 ? 'text-white font-medium' : 'text-white/60'}>
            {item}
          </span>
        </React.Fragment>
      ))}
    </nav>
  );
}

// Breadcrumb compacto para mobile
export function CompactBreadcrumbs({ items, className = '' }: { items: string[]; className?: string }) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={`flex items-center gap-1 text-[10px] ${className}`}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <span className="text-white/30">/</span>}
          <span className={index === items.length - 1 ? 'text-white font-medium' : 'text-white/60 truncate max-w-[80px]'}>
            {item}
          </span>
        </React.Fragment>
      ))}
    </nav>
  );
}