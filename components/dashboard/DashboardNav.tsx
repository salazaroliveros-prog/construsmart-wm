'use client';

import { LayoutDashboard, FolderKanban, Calculator, DollarSign, Users, Warehouse, TrendingUp, Database, User, LogOut, AlertCircle, BookOpen, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { ChangeEvent } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { offlineDB } from '@/lib/db/offlineStore';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  badge?: number;
  badgeColor?: 'cyan' | 'amber' | 'red';
}

// Navigation items configuration matching the 9 main screens
const NAV_ITEMS_BASE: NavItem[] = [
  { id: 'dashboard', label: 'Tablero Principal', icon: 'LayoutDashboard' },
  { id: 'projects', label: 'Proyectos', icon: 'FolderKanban' },
  { id: 'budgets', label: 'Presupuestos', icon: 'Calculator' },
  { id: 'finances', label: 'Finanzas', icon: 'DollarSign' },
  { id: 'payroll', label: 'Nómina', icon: 'Users' },
  { id: 'warehouse', label: 'Almacén', icon: 'Warehouse' },
  { id: 'analytics', label: 'Analytics', icon: 'TrendingUp' },
  { id: 'clients', label: 'Clientes', icon: 'Users' },
  { id: 'logs', label: 'Bitácora', icon: 'BookOpen' },
  { id: 'settings', label: 'Ajustes', icon: 'Settings' },
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
  BookOpen: <BookOpen className="w-5 h-5" />,
  Settings: <Settings className="w-5 h-5" />,
};

// User Avatar Component
function UserAvatar() {
  const { user, getUserAvatar } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    // Check localStorage for custom avatar first
    const customAvatar = localStorage.getItem('userAvatar');
    if (customAvatar) {
      setAvatarUrl(customAvatar);
    } else {
      setAvatarUrl(getUserAvatar());
    }
  }, [user, getUserAvatar]);

  const handleAvatarUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setAvatarUrl(base64String);
        localStorage.setItem('userAvatar', base64String);
        setShowUpload(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarClick = () => {
    setShowUpload(true);
  };

  if (showUpload) {
    return (
      <div className="relative w-full h-full">
        <input
          type="file"
          accept="image/*"
          onChange={handleAvatarUpload}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          title="Cambiar foto de perfil"
        />
        <div className="w-full h-full flex items-center justify-center bg-white/10">
          <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
      </div>
    );
  }

  if (avatarUrl) {
    return (
      <div
        onClick={handleAvatarClick}
        className="w-full h-full cursor-pointer"
        title="Click para cambiar foto de perfil"
      >
        <img
          src={avatarUrl}
          alt={user?.name || 'Usuario'}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />;
}

export default function DashboardNav({ activeTab, onTabChange }: DashboardNavProps) {
  const isActive = (id: string) => activeTab === id;
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [navItems, setNavItems] = useState<NavItem[]>(NAV_ITEMS_BASE);

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    try {
      const [projects, budgets, warehouseStock] = await Promise.all([
        offlineDB.projects.toArray(),
        offlineDB.budgets.toArray(),
        offlineDB.warehouseStock.toArray(),
      ]);

      const updatedItems = [...NAV_ITEMS_BASE];

      // Badge for projects in execution (cyan - info)
      const executionProjects = projects.filter(p => p.status === 'execution').length;
      const projectsItem = updatedItems.find(item => item.id === 'projects');
      if (projectsItem && executionProjects > 0) {
        projectsItem.badge = executionProjects;
        projectsItem.badgeColor = 'cyan';
      }

      // Badge for budgets (amber - warning - projects in planning)
      const planningProjects = projects.filter(p => p.status === 'planning').length;
      const budgetsItem = updatedItems.find(item => item.id === 'budgets');
      if (budgetsItem && planningProjects > 0) {
        budgetsItem.badge = planningProjects;
        budgetsItem.badgeColor = 'amber';
      }

      // Badge for warehouse (red - critical - low stock items)
      const lowStockItems = warehouseStock.filter(item => item.current_stock <= item.minimum_threshold).length;
      const warehouseItem = updatedItems.find(item => item.id === 'warehouse');
      if (warehouseItem && lowStockItems > 0) {
        warehouseItem.badge = lowStockItems;
        warehouseItem.badgeColor = 'red';
      }

      setNavItems(updatedItems);
    } catch (error) {
      console.error('Error loading badges:', error);
    }
  };

  const handleSignOut = () => {
    signOut();
    router.push('/login');
  };

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
          {navItems.map((item) => {
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
                  <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium flex items-center gap-1 ${
                    item.badgeColor === 'red'
                      ? 'bg-red-500/20 text-red-300'
                      : item.badgeColor === 'amber'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-cyan-500/20 text-cyan-300'
                  }`}>
                    {item.badgeColor === 'red' && <AlertCircle className="w-3 h-3" />}
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
        <div className="flex items-center gap-2 sm:gap-3 mb-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center overflow-hidden">
            <UserAvatar />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-xs sm:text-sm truncate">
              {user?.name || user?.email || 'Usuario'}
            </p>
            <p className="text-cyan-400 text-[10px] sm:text-xs truncate">
              {user?.email || ''}
            </p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-xs"
        >
          <LogOut className="w-4 h-4" />
          Cerrar Sesión
        </button>
      </div>
    </nav>
  );
}