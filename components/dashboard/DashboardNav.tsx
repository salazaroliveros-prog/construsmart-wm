'use client';

import { LayoutDashboard, FolderKanban, Calculator, TrendingUp, Users, Warehouse, FileText, Settings, HelpCircle } from 'lucide-react';
import { useState } from 'react';

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
  { id: 'tracking', label: 'Seguimiento', icon: <TrendingUp className="w-5 h-5" /> },
  { id: 'finances', label: 'Finanzas', icon: <Calculator className="w-5 h-5" /> },
  { id: 'payroll', label: 'Nómina', icon: <Users className="w-5 h-5" /> },
  { id: 'warehouse', label: 'Almacén', icon: <Warehouse className="w-5 h-5" /> },
  { id: 'reports', label: 'Reportes', icon: <FileText className="w-5 h-5" /> },
];

const bottomNavItems: NavItem[] = [
  { id: 'settings', label: 'Configuración', icon: <Settings className="w-5 h-5" /> },
  { id: 'help', label: 'Ayuda', icon: <HelpCircle className="w-5 h-5" /> },
];

export default function DashboardNav() {
  const [activeNav, setActiveNav] = useState('dashboard');

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
              onClick={() => setActiveNav(item.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                transition: 'all 0.2s',
                background: activeNav === item.id 
                  ? 'linear-gradient(to right, rgba(6, 182, 212, 0.2), rgba(139, 92, 246, 0.2))' 
                  : 'transparent',
                border: activeNav === item.id ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid transparent',
                color: activeNav === item.id ? 'white' : 'rgba(255, 255, 255, 0.6)',
              }}
              onMouseEnter={(e) => {
                if (activeNav !== item.id) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.color = 'white';
                }
              }}
              onMouseLeave={(e) => {
                if (activeNav !== item.id) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
                }
              }}
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

      {/* Bottom Navigation */}
      <div className="p-4 border-t border-white/10">
        <div className="space-y-1">
          {bottomNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                transition: 'all 0.2s',
                background: activeNav === item.id 
                  ? 'linear-gradient(to right, rgba(6, 182, 212, 0.2), rgba(139, 92, 246, 0.2))' 
                  : 'transparent',
                border: activeNav === item.id ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid transparent',
                color: activeNav === item.id ? 'white' : 'rgba(255, 255, 255, 0.6)',
              }}
              onMouseEnter={(e) => {
                if (activeNav !== item.id) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.color = 'white';
                }
              }}
              onMouseLeave={(e) => {
                if (activeNav !== item.id) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
                }
              }}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
