'use client';

import { LayoutDashboard, FolderKanban, Calculator, DollarSign, Users, Warehouse, TrendingUp, Database } from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  badge?: number;
}

// Navigation items configuration matching the 7 main screens
const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Tablero Principal', icon: 'LayoutDashboard' },
  { id: 'projects', label: 'Proyectos', icon: 'FolderKanban' },
  { id: 'budgets', label: 'Presupuestos', icon: 'Calculator' },
  { id: 'finances', label: 'Finanzas', icon: 'DollarSign' },
  { id: 'payroll', label: 'Nómina', icon: 'Users' },
  { id: 'warehouse', label: 'Almacén', icon: 'Warehouse' },
  { id: 'analytics', label: 'Analytics', icon: 'TrendingUp' },
];

interface DashboardNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const ICONS: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard className="w-5 h-5" />,
  FolderKanban: <FolderKanban className="w-5 h-5" />,
  Calculator: <Calculator className="w-5 h-5" />,
  DollarSign: <DollarSign className="w-5 h-5" />,
  Users: <Users className="w-5 h-5" />,
  Warehouse: <Warehouse className="w-5 h-5" />,
  TrendingUp: <TrendingUp className="w-5 h-5" />,
};

export default function DashboardNav({ activeTab, onTabChange }: DashboardNavProps) {
  const isActive = (id: string) => activeTab === id;

  return (
    <nav className="glass-panel border-r border-white/10 flex flex-col h-full z-40" aria-label="Navegación principal">
      {/* Brand Section */}
      <div className="px-3 sm:px-4 py-3 sm:py-4 border-b border-white/10">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center">
            <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold text-sm sm:text-lg">CONSTRUCTORA WM</h2>
            <p className="text-[10px] sm:text-xs text-cyan-400">Sistema ERP</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto py-3 sm:py-4">
        <div className="px-2 sm:px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.id);
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg transition-all ${
                  active
                    ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 text-white'
                    : 'text-white/60 hover:bg-white/5 hover:text-white border border-transparent'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  {ICONS[item.icon]}
                  <span className="font-medium text-xs sm:text-sm">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] sm:text-xs font-medium">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Admin Section */}
      <div className="px-3 sm:px-4 py-3 sm:py-4 border-t border-white/10">
        <a
          href="/admin/database-cleaner"
          className="flex items-center gap-2 sm:gap-3 text-white/60 hover:text-white transition-colors group"
        >
          <Database className="w-4 h-4 sm:w-5 sm:h-5 group-hover:text-red-400 transition-colors" />
          <span className="text-[10px] sm:text-xs">Limpiar BD</span>
        </a>
      </div>

      {/* User Info Section */}
      <div className="px-3 sm:px-4 py-3 sm:py-4 border-t border-white/10">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-xs sm:text-sm truncate">Ing. Carlos Martínez</p>
            <p className="text-cyan-400 text-[10px] sm:text-xs truncate">Director de Proyectos</p>
          </div>
        </div>
      </div>
    </nav>
  );
}