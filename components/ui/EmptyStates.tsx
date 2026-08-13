'use client';

import React from 'react';
import { Package, FileText, Users, ShoppingBag, Settings, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'projects' | 'budgets' | 'finances' | 'payroll' | 'warehouse' | 'suppliers' | 'clients' | 'logs' | 'analytics' | 'settings';
  className?: string;
}

const iconsByVariant = {
  default: Package,
  projects: FileText,
  budgets: FileText,
  finances: ShoppingBag,
  payroll: Users,
  warehouse: Package,
  suppliers: ShoppingBag,
  clients: Users,
  logs: FileText,
  analytics: Info,
  settings: Settings,
};

export function EmptyState({ icon, title, description, action, variant = 'default', className = '' }: EmptyStateProps) {
  const DefaultIcon = iconsByVariant[variant] || Package;
  const IconComponent = icon || <DefaultIcon className="w-12 h-12" />;

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      <div className="text-white/20 mb-4">
        {IconComponent}
      </div>
      <h3 className="text-white font-medium text-lg mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-white/60 text-sm text-center max-w-md mb-6">
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 rounded-lg text-sm font-medium transition-all min-h-[44px]"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// Componentes de EmptyState específicos por contexto
export function EmptyProjects({ onCreate, className }: { onCreate?: () => void; className?: string }) {
  return (
    <EmptyState
      title="No hay proyectos"
      description="Crea tu primer proyecto para comenzar a gestionar la construcción."
      action={onCreate ? { label: 'Crear Proyecto', onClick: onCreate } : undefined}
      variant="projects"
      className={className}
    />
  );
}

export function EmptyBudgets({ onCreate, className }: { onCreate?: () => void; className?: string }) {
  return (
    <EmptyState
      title="No hay presupuestos"
      description="Crea presupuestos para tus proyectos para planificar los costos de construcción."
      action={onCreate ? { label: 'Crear Presupuesto', onClick: onCreate } : undefined}
      variant="budgets"
      className={className}
    />
  );
}

export function EmptyFinances({ onAdd, className }: { onAdd?: () => void; className?: string }) {
  return (
    <EmptyState
      title="No hay transacciones"
      description="Registra tus primeros ingresos y gastos para llevar el control financiero."
      action={onAdd ? { label: 'Agregar Transacción', onClick: onAdd } : undefined}
      variant="finances"
      className={className}
    />
  );
}

export function EmptyPayroll({ onAdd, className }: { onAdd?: () => void; className?: string }) {
  return (
    <EmptyState
      title="No hay empleados"
      description="Agrega empleados a tu nómina para gestionar los pagos y salarios."
      action={onAdd ? { label: 'Agregar Empleado', onClick: onAdd } : undefined}
      variant="payroll"
      className={className}
    />
  );
}

export function EmptyWarehouse({ onAdd, className }: { onAdd?: () => void; className?: string }) {
  return (
    <EmptyState
      title="No hay productos"
      description="Agrega productos al almacén para controlar el inventario de materiales."
      action={onAdd ? { label: 'Agregar Producto', onClick: onAdd } : undefined}
      variant="warehouse"
      className={className}
    />
  );
}

export function EmptySuppliers({ onAdd, className }: { onAdd?: () => void; className?: string }) {
  return (
    <EmptyState
      title="No hay proveedores"
      description="Registra proveedores para gestionar las órdenes de compra de materiales."
      action={onAdd ? { label: 'Agregar Proveedor', onClick: onAdd } : undefined}
      variant="suppliers"
      className={className}
  />
  );
}

export function EmptyClients({ onAdd, className }: { onAdd?: () => void; className?: string }) {
  return (
    <EmptyState
      title="No hay clientes"
      description="Agrega clientes para gestionar los proyectos y relaciones comerciales."
      action={onAdd ? { label: 'Agregar Cliente', onClick: onAdd } : undefined}
      variant="clients"
      className={className}
  />
  );
}

export function EmptyLogs({ onAdd, className }: { onAdd?: () => void; className?: string }) {
  return (
    <EmptyState
      title="No hay registros"
      description="Agrega registros a la bitácora para documentar el progreso de construcción."
      action={onAdd ? { label: 'Agregar Registro', onClick: onAdd } : undefined}
      variant="logs"
      className={className}
    />
  );
}

export function EmptyAnalytics({ onGenerate, className }: { onGenerate?: () => void; className?: string }) {
  return (
    <EmptyState
      title="No hay datos para analizar"
      description="Agrega más datos al sistema para generar análisis y reportes."
      action={onGenerate ? { label: 'Generar Reporte', onClick: onGenerate } : undefined}
      variant="analytics"
      className={className}
    />
  );
}

export function EmptySettings({ onConfigure, className }: { onConfigure?: () => void; className?: string }) {
  return (
    <EmptyState
      title="Configuración no disponible"
      description="Ajusta la configuración del sistema según tus preferencias."
      action={onConfigure ? { label: 'Configurar', onClick: onConfigure } : undefined}
      variant="settings"
      className={className}
  />
  );
}