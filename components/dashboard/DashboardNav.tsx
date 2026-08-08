'use client';

import { Database, LogOut, AlertCircle, LayoutDashboard, type LucideIcon } from 'lucide-react';
import { useState, useEffect, useCallback, memo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import UserAvatar from '@/components/ui/UserAvatar';
import { offlineDB } from '@/lib/db/offlineStore';
import { getSyncStats } from '@/lib/utils/offlineSync';
import { useCompanySettings } from '@/lib/hooks/useBusinessSettings';
import { useRealtimeRefresh } from '@/lib/hooks/useRealtimeRefresh';
import { getUserScope, scopeLocalRows } from '@/lib/utils/userScope';
import { NAVIGATION_TABS, type NavigationTabId } from '@/components/dashboard/navigation';

interface NavItem {
  id: NavigationTabId;
  label: string;
  icon: LucideIcon;
  badge?: number;
  badgeColor?: 'cyan' | 'amber' | 'red';
}

// Fuente de verdad única: proviene de components/dashboard/navigation.ts,
// la misma que usa la barra de tabs superior en app/page.tsx.
const NAV_ITEMS_BASE: NavItem[] = NAVIGATION_TABS.map(tab => ({
  id: tab.id,
  label: tab.label,
  icon: tab.icon,
}));

interface DashboardNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const NavButton = memo(({
  item,
  active,
  isCollapsed,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  isCollapsed: boolean;
  onClick?: () => void;
}) => {
  const isTouch = useRef(false);

  const Icon = item.icon;

  const handleTouchStart = () => {
    isTouch.current = true;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    // Feedback táctil inmediato
    (e.currentTarget as HTMLElement).style.transform = 'scale(0.98)';
    setTimeout(() => {
      (e.currentTarget as HTMLElement).style.transform = '';
    }, 100);

    // Ejecutar el click en dispositivos táctiles
    if (onClick) {
      onClick();
    }

    // Resetear flag después de un breve delay
    setTimeout(() => {
      isTouch.current = false;
    }, 100);
  };

  const handleClick = (e: React.MouseEvent) => {
    // Solo ejecutar si no fue un evento táctil (prevenir doble click en móvil)
    if (!isTouch.current && onClick) {
      onClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`w-full flex items-center rounded-lg transition-all relative touch-manipulation min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
        isCollapsed ? 'justify-center px-2 py-3' : 'justify-between px-3 py-3'
      } ${
        active
          ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 text-white'
          : 'text-white/60 active:bg-white/10 active:text-white border border-transparent'
      }`}
      aria-current={active ? 'page' : undefined}
      title={isCollapsed ? item.label : undefined}
    >
      <div className={`flex items-center ${isCollapsed ? '' : 'gap-3'}`}>
        <Icon className="w-5 h-5 flex-shrink-0" />
        {!isCollapsed && <span className="font-medium text-xs sm:text-sm">{item.label}</span>}
      </div>
      {!isCollapsed && item.badge && (
        <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium flex items-center gap-1 ${
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
      {isCollapsed && item.badge && (
        <span className={`absolute top-1 right-1 w-2.5 h-2.5 rounded-full ${
          item.badgeColor === 'red' ? 'bg-red-500' : item.badgeColor === 'amber' ? 'bg-amber-500' : 'bg-cyan-500'
        }`} />
      )}
    </button>
  );
});

export default function DashboardNav({ activeTab, onTabChange, isCollapsed = false, onToggleCollapse }: DashboardNavProps) {
  const { user, signOut } = useAuth();
  const { company } = useCompanySettings();
  const router = useRouter();
  const [navItems, setNavItems] = useState<NavItem[]>(NAV_ITEMS_BASE);
  const [syncPendingCount, setSyncPendingCount] = useState(0);

  const loadBadges = useCallback(async () => {
    try {
      const userId = await getUserScope();
      const [projects, budgets, warehouseStock] = await Promise.all([
        scopeLocalRows(await offlineDB.projects.toArray(), userId),
        scopeLocalRows(await offlineDB.budgets.toArray(), userId),
        scopeLocalRows(await offlineDB.warehouseStock.toArray(), userId),
      ]);

      const updatedItems = NAV_ITEMS_BASE.map(item => ({ ...item }));

      const executionProjects = projects.filter(p => p.status === 'execution').length;
      const projectsItem = updatedItems.find(item => item.id === 'projects');
      if (projectsItem && executionProjects > 0) {
        projectsItem.badge = executionProjects;
        projectsItem.badgeColor = 'cyan';
      }

      const planningProjects = projects.filter(p => p.status === 'planning').length;
      const budgetsItem = updatedItems.find(item => item.id === 'budgets');
      if (budgetsItem && planningProjects > 0) {
        budgetsItem.badge = planningProjects;
        budgetsItem.badgeColor = 'amber';
      }

      const lowStockItems = warehouseStock.filter(item => item.current_stock <= item.minimum_threshold).length;
      const warehouseItem = updatedItems.find(item => item.id === 'warehouse');
      if (warehouseItem && lowStockItems > 0) {
        warehouseItem.badge = lowStockItems;
        warehouseItem.badgeColor = 'red';
      }

      const dashboardItem = updatedItems.find(item => item.id === 'dashboard');
      if (dashboardItem && syncPendingCount > 0) {
        dashboardItem.badge = syncPendingCount;
        dashboardItem.badgeColor = 'amber';
      }

      setNavItems(updatedItems);
    } catch (error) {
      console.error('Error loading badges:', error);
    }
  }, [syncPendingCount]);

  useEffect(() => {
    void loadBadges();
  }, [loadBadges]);

  useEffect(() => {
    const loadSyncPending = async () => {
      try {
        const stats = await getSyncStats();
        setSyncPendingCount(stats.pendingDeletes + stats.pendingProjects + stats.pendingBudgets + stats.pendingBudgetItems + stats.pendingTransactions + stats.pendingPayroll + stats.pendingWarehouse + stats.pendingClients + stats.pendingProjectLogs + stats.pendingSuppliers + stats.pendingPurchaseOrders + stats.pendingPurchaseOrderItems + stats.pendingSubcontractors);
      } catch (error) {
        console.error('Error loading sync pending count:', error);
      }
    };

    loadSyncPending();
    const intervalId = window.setInterval(loadSyncPending, 30000);
    return () => window.clearInterval(intervalId);
  }, []);

  const handleSignOut = useCallback(() => {
    signOut();
    router.push('/login');
  }, [signOut, router]);

  useRealtimeRefresh(['projects', 'budgets', 'warehouse_stock'], loadBadges);

  return (
    <nav className={`glass-panel border-r border-white/10 flex flex-col h-full z-40 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`} aria-label="Navegación principal">
{/* Brand Section */}
        <div className={`px-3 sm:px-4 py-3 sm:py-4 border-b border-white/10 ${isCollapsed ? 'flex justify-center' : ''}`}>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onToggleCollapse}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center flex-shrink-0 hover:opacity-80 transition-opacity"
              title={isCollapsed ? 'Expandir menú lateral' : 'Colapsar menú lateral'}
            >
              <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                {/* Dual Logo Layout */}
                <div className="flex items-center gap-3 mb-2">
                  {/* Left: CONSTRUCTORA WM Logo */}
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                    <img 
                      src="/assets/branding/logo-constructora-wm.jpg" 
                      alt="CONSTRUCTORA WM" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  
                  {/* Divider: Vertical glass accent line */}
                  <div className="border-r border-white/20 h-8 mx-1"></div>
                  
                  {/* Right: Multi Servicios Logo */}
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                    <img 
                      src="/assets/branding/letterhead-multiservicios.jpg" 
                      alt="Multi Servicios de Guatemala" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
                
                {/* Company Name */}
                <div>
                  <h2 className="text-white font-bold text-sm sm:text-base truncate">{company.shortName || company.name}</h2>
                  <p className="text-[10px] sm:text-xs text-cyan-400">Sistema ERP</p>
                </div>
              </div>
            )}
          </div>
        </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto overflow-anchor-none py-3 sm:py-4">
        <div className="px-2 sm:px-3 space-y-1">
          {navItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <NavButton
                key={item.id}
                item={item}
                active={active}
                isCollapsed={isCollapsed}
                onClick={() => onTabChange(item.id)}
              />
            );
          })}
        </div>
      </div>

      {/* Admin Section */}
      <div className={`px-3 sm:px-4 py-3 sm:py-4 border-t border-white/10 ${isCollapsed ? 'flex justify-center' : ''}`}>
        <button
          type="button"
          onClick={() => router.push('/admin/database-cleaner')}
          className={`flex items-center gap-2 sm:gap-3 text-white/60 active:text-white transition-colors group min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${isCollapsed ? 'justify-center' : ''}`}
        >
          <Database className="w-4 h-4 sm:w-5 sm:h-5 active:text-red-400 flex-shrink-0" />
          {!isCollapsed && <span className="text-[10px] sm:text-xs">Limpiar BD</span>}
        </button>
      </div>

      {/* User Info Section */}
      <div className={`px-3 sm:px-4 py-3 sm:py-4 border-t border-white/10 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
        <div className="flex items-center gap-2 sm:gap-3 mb-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-cyan-500/50 shadow-lg shadow-cyan-500/20">
            <UserAvatar />
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-xs sm:text-sm truncate">
                {user?.name || user?.email || 'Usuario'}
              </p>
              <p className="text-cyan-400 text-[10px] sm:text-xs truncate">
                {user?.email || ''}
              </p>
            </div>
          )}
        </div>
        <button
          onClick={handleSignOut}
          className={`w-full flex items-center gap-2 px-3 py-2.5 text-white/60 active:text-white active:bg-white/10 rounded-lg transition-colors text-xs min-h-[44px] touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${isCollapsed ? 'justify-center' : 'justify-center'}`}
          title={isCollapsed ? 'Cerrar Sesión' : undefined}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!isCollapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </nav>
  );
}
