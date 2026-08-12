'use client';

import { Package, Search, AlertCircle, FileText, Users, ShoppingCart, Building2, Wallet, Users2, ClipboardList, TrendingUp, Settings, Calculator } from 'lucide-react';

interface EmptyStateProps {
  type?: 'general' | 'search' | 'error' | 'projects' | 'budgets' | 'finances' | 'payroll' | 'warehouse' | 'suppliers' | 'orders' | 'clients' | 'logs' | 'analytics' | 'settings';
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const iconMap = {
  general: Package,
  search: Search,
  error: AlertCircle,
  projects: Building2,
  budgets: Calculator,
  finances: Wallet,
  payroll: Users2,
  warehouse: Package,
  suppliers: Users,
  orders: ShoppingCart,
  clients: Users,
  logs: ClipboardList,
  analytics: TrendingUp,
  settings: Settings,
};

const defaultMessages = {
  general: {
    title: 'No hay datos disponibles',
    description: 'No se encontraron elementos para mostrar en este momento.',
  },
  search: {
    title: 'No se encontraron resultados',
    description: 'Intenta con otros términos de búsqueda o filtros diferentes.',
  },
  error: {
    title: 'Error al cargar datos',
    description: 'Hubo un problema al cargar la información. Por favor intenta nuevamente.',
  },
  projects: {
    title: 'No hay proyectos',
    description: 'Comienza creando tu primer proyecto para empezar a gestionar tu construcción.',
  },
  budgets: {
    title: 'No hay items de presupuesto',
    description: 'Agrega items al presupuesto para comenzar el cálculo de costos.',
  },
  finances: {
    title: 'No hay transacciones',
    description: 'Registra tus ingresos y gastos para mantener el control financiero.',
  },
  payroll: {
    title: 'No hay registros de nómina',
    description: 'Agrega empleados y registros de nómina para gestionar pagos.',
  },
  warehouse: {
    title: 'No hay items en almacén',
    description: 'Agrega materiales y suministros a tu almacén.',
  },
  suppliers: {
    title: 'No hay proveedores',
    description: 'Registra tus proveedores para gestionar órdenes de compra.',
  },
  orders: {
    title: 'No hay órdenes de compra',
    description: 'Crea órdenes de compra para solicitar materiales a proveedores.',
  },
  clients: {
    title: 'No hay clientes',
    description: 'Agrega clientes para gestionar información de contacto.',
  },
  logs: {
    title: 'No hay bitácoras',
    description: 'Registra actividades y progresos en bitácoras de proyecto.',
  },
  analytics: {
    title: 'No hay datos para analizar',
    description: 'Agrega más datos para generar análisis y reportes.',
  },
  settings: {
    title: 'Configuración',
    description: 'Ajusta las preferencias de la aplicación.',
  },
};

export function EmptyState({ type = 'general', icon, title, description, action }: EmptyStateProps) {
  const Icon = iconMap[type];
  const defaultMessage = defaultMessages[type];
  const displayTitle = title || defaultMessage.title;
  const displayDescription = description || defaultMessage.description;
  const displayIcon = icon || <Icon className="w-12 h-12 text-white/40" />;

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[300px] p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
        {displayIcon}
      </div>
      
      <h3 className="text-white font-semibold text-lg mb-2">
        {displayTitle}
      </h3>
      
      <p className="text-white/60 text-sm max-w-md mb-6">
        {displayDescription}
      </p>
      
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}