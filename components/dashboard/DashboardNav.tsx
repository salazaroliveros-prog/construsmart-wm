'use client';

import React, { useState } from 'react';
import { LayoutDashboard, FolderKanban, Calculator, TrendingUp, Users, Warehouse, FileText, Settings, HelpCircle } from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Tablero Principal', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'projects', label: 'Proyectos', icon: <FolderKanban className="w-5 h-5" />, badge: 12 },
  { id: 'budgets', label: 'Presupuestos', icon: <Calculator className="w-5 h-5" /> },
  { id: 'finances', label: 'Finanzas', icon: <Calculator className="w-5 h-5" /> },
  { id: 'payroll', label: 'Nómina', icon: <Users className="w-5 h-5" /> },
  { id: 'warehouse', label: 'Almacén', icon: <Warehouse className="w-5 h-5" /> },
  { id: 'analytics', label: 'Analytics', icon: <TrendingUp className="w-5 h-5" /> },
];

interface DashboardNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function DashboardNav({ activeTab, onTabChange }: DashboardNavProps) {
  const [activeNav, setActiveNav] = useState(activeTab);

  const handleNavClick = (itemId: string) => {
    setActiveNav(itemId);
    onTabChange(itemId);
  };

  return (
    <nav className="glass-panel border-r border-white/10 flex flex-col h-full">
      {/* Logo Section */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">CONSTRUCTORA WM</h2>
            <p className="text-xs text-cyan-400">Sistema ERP</p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        <div className="px-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
                activeNav === item.id
                  ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 text-white'
                  : 'text-white/60 hover:bg-white/5 hover:text-white border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-3">
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-medium">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
