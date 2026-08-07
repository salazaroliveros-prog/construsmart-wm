import {
  Activity,
  BookOpen,
  Calculator,
  DollarSign,
  FolderKanban,
  LayoutDashboard,
  Settings,
  ShoppingCart,
  Truck,
  UserCircle,
  Users,
  Wallet,
  Warehouse,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';

export interface NavTab {
  id: string;
  label: string;
  icon: LucideIcon;
}

export const NAVIGATION_TABS: readonly NavTab[] = [
  { id: 'dashboard', label: 'Tablero Principal', icon: LayoutDashboard },
  { id: 'projects', label: 'Proyectos', icon: FolderKanban },
  { id: 'budgets', label: 'Presupuestos', icon: Calculator },
  { id: 'progress', label: 'Control de Avance', icon: Activity },
  { id: 'finances', label: 'Finanzas', icon: DollarSign },
  { id: 'payroll', label: 'Nómina', icon: Wallet },
  { id: 'warehouse', label: 'Almacén', icon: Warehouse },
  { id: 'suppliers', label: 'Proveedores', icon: Truck },
  { id: 'orders', label: 'Órdenes de Compra', icon: ShoppingCart },
  { id: 'subcontractors', label: 'Subcontratos', icon: Users },
  { id: 'clients', label: 'Clientes', icon: UserCircle },
  { id: 'logs', label: 'Bitácora', icon: BookOpen },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  { id: 'settings', label: 'Ajustes', icon: Settings },
] as const;

export type NavigationTabId = (typeof NAVIGATION_TABS)[number]['id'];
