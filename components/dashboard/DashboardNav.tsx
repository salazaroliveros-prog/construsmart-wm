'use client';

import React, { useState } from 'react';
import { LayoutDashboard, FolderKanban, Calculator, DollarSign, Users, Warehouse, TrendingUp } from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Tablero Principal', icon: <LayoutDashboard className="w-5 h-5" aria-hidden="true" /> },
  { id: 'projects', label: 'Proyectos', icon: <FolderKanban className="w-5 h-5" aria-hidden="true" /> },
  { id: 'budgets', label: 'Presupuestos', icon: <Calculator className="w-5 h-5" aria-hidden="true" /> },
  { id: 'finances', label: 'Finanzas', icon: <DollarSign className="w-5 h-5" aria-hidden="true" /> },
  { id: 'payroll', label: 'Nómina', icon: <Users className="w-5 h-5" aria-hidden="true" /> },
  { id: 'warehouse', label: 'Almacén', icon: <Warehouse className="w-5 h-5" aria-hidden="true" /> },
  { id: 'analytics', label: 'Analytics', icon: <TrendingUp className="w-5 h-5" aria-hidden="true" /> },
];

interface DashboardNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function DashboardNav({ activeTab, onTabChange }: DashboardNavProps) {
  const isActive = (id: string) => activeTab === id;

  const handleNavClick = (itemId: string) => {
    onTabChange(itemId);
  };

  return (
    <nav className="glass-panel border-r border-white/10 flex flex-col h-full" aria-label="Navegación principal">
      {/* Logo Section */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">CONSTRUCTORA WM</h2>
            <p className="text-xs text-cyan-400">Sistema ERP</p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        <div className="px-3 space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.id);
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${
                  active
                    ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 text-white'
                    : 'text-white/60 hover:bg-white/5 hover:text-white border border-transparent'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                <div className="flex items-center space-x-3">
                  {item.icon}
                  <span className="font-medium text-sm">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-medium">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
