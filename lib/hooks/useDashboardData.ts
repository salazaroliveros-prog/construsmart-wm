// ============================================================================
// Custom Hooks for Dashboard Data Loading
// CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"
//
// Extrae la lógica de carga de datos de DashboardCharts.tsx en hooks reutilizables
// Mejora performance, testabilidad y mantenibilidad
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { offlineDB } from '@/lib/db/offlineStore';
import { 
  LocalProject, 
  LocalFinancialTransaction, 
  LocalWarehouseStock, 
  LocalProjectLog,
  LocalBudgetItem,
  LocalBudget,
  LocalPurchaseOrder,
  LocalPayrollRecord,
  LocalClient,
  LocalSupplier,
  LocalPurchaseOrderItem,
  LocalPayrollEmployee,
  LocalSubcontractor
} from '@/lib/db/offlineStore';
import { useRealtimeRefresh } from '@/lib/hooks/useRealtimeRefresh';
import { getUserScope, scopeLocalRows } from '@/lib/utils/userScope';

// Hook para cargar proyectos
export function useProjects() {
  const [projects, setProjects] = useState<LocalProject[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProjects = useCallback(async () => {
    try {
      const userId = await getUserScope();
      const allProjects = scopeLocalRows(await offlineDB.projects.toArray(), userId);
      setProjects(allProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useRealtimeRefresh(['projects'], loadProjects);

  return { projects, loading, refresh: loadProjects };
}

// Hook para cargar transacciones financieras
export function useTransactions() {
  const [transactions, setTransactions] = useState<LocalFinancialTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTransactions = useCallback(async () => {
    try {
      const userId = await getUserScope();
      const allTransactions = scopeLocalRows(await offlineDB.financialTransactions.toArray(), userId);
      setTransactions(allTransactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  useRealtimeRefresh(['financial_transactions'], loadTransactions);

  return { transactions, loading, refresh: loadTransactions };
}

// Hook para cargar empleados
export function useEmployees() {
  const [employees, setEmployees] = useState<LocalPayrollEmployee[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEmployees = useCallback(async () => {
    try {
      const userId = await getUserScope();
      const allEmployees = scopeLocalRows(await offlineDB.payrollEmployees.toArray(), userId);
      setEmployees(allEmployees);
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  useRealtimeRefresh(['payroll_employees'], loadEmployees);

  return { employees, loading, refresh: loadEmployees };
}

// Hook para cargar stock de almacén
export function useWarehouseStock() {
  const [stock, setStock] = useState<LocalWarehouseStock[]>([]);
  const [loading, setLoading] = useState(true);

  const loadStock = useCallback(async () => {
    try {
      const userId = await getUserScope();
      const allStock = scopeLocalRows(await offlineDB.warehouseStock.toArray(), userId);
      setStock(allStock);
    } catch (error) {
      console.error('Error loading warehouse stock:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStock();
  }, [loadStock]);

  useRealtimeRefresh(['warehouse_stock'], loadStock);

  return { stock, loading, refresh: loadStock };
}

// Hook para cargar bitácora de proyectos
export function useProjectLogs() {
  const [logs, setLogs] = useState<LocalProjectLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = useCallback(async () => {
    try {
      const userId = await getUserScope();
      const allLogs = scopeLocalRows(await offlineDB.projectLogs.toArray(), userId);
      setLogs(allLogs);
    } catch (error) {
      console.error('Error loading project logs:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  useRealtimeRefresh(['project_logs'], loadLogs);

  return { logs, loading, refresh: loadLogs };
}

// Hook para cargar presupuestos
export function useBudgets() {
  const [budgets, setBudgets] = useState<LocalBudget[]>([]);
  const [budgetItems, setBudgetItems] = useState<LocalBudgetItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBudgets = useCallback(async () => {
    try {
      const userId = await getUserScope();
      const allBudgets = scopeLocalRows(await offlineDB.budgets.toArray(), userId);
      const allBudgetItems = scopeLocalRows(await offlineDB.budgetItems.toArray(), userId);
      setBudgets(allBudgets);
      setBudgetItems(allBudgetItems);
    } catch (error) {
      console.error('Error loading budgets:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);

  useRealtimeRefresh(['budgets', 'budget_items'], loadBudgets);

  return { budgets, budgetItems, loading, refresh: loadBudgets };
}

// Hook para cargar órdenes de compra
export function usePurchaseOrders() {
  const [purchaseOrders, setPurchaseOrders] = useState<LocalPurchaseOrder[]>([]);
  const [purchaseOrderItems, setPurchaseOrderItems] = useState<LocalPurchaseOrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPurchaseOrders = useCallback(async () => {
    try {
      const userId = await getUserScope();
      const allPurchaseOrders = scopeLocalRows(await offlineDB.purchaseOrders.toArray(), userId);
      const allPurchaseOrderItems = scopeLocalRows(await offlineDB.purchaseOrderItems.toArray(), userId);
      setPurchaseOrders(allPurchaseOrders);
      setPurchaseOrderItems(allPurchaseOrderItems);
    } catch (error) {
      console.error('Error loading purchase orders:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPurchaseOrders();
  }, [loadPurchaseOrders]);

  useRealtimeRefresh(['purchase_orders', 'purchase_order_items'], loadPurchaseOrders);

  return { purchaseOrders, purchaseOrderItems, loading, refresh: loadPurchaseOrders };
}

// Hook para cargar registros de nómina
export function usePayrollRecords() {
  const [payrollRecords, setPayrollRecords] = useState<LocalPayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPayrollRecords = useCallback(async () => {
    try {
      const userId = await getUserScope();
      const allPayrollRecords = scopeLocalRows(await offlineDB.payrollRecords.toArray(), userId);
      setPayrollRecords(allPayrollRecords);
    } catch (error) {
      console.error('Error loading payroll records:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayrollRecords();
  }, [loadPayrollRecords]);

  useRealtimeRefresh(['payroll_records'], loadPayrollRecords);

  return { payrollRecords, loading, refresh: loadPayrollRecords };
}

// Hook para cargar clientes
export function useClients() {
  const [clients, setClients] = useState<LocalClient[]>([]);
  const [loading, setLoading] = useState(true);

  const loadClients = useCallback(async () => {
    try {
      const userId = await getUserScope();
      const allClients = scopeLocalRows(await offlineDB.clients.toArray(), userId);
      setClients(allClients);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  useRealtimeRefresh(['clients'], loadClients);

  return { clients, loading, refresh: loadClients };
}

// Hook para cargar proveedores
export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<LocalSupplier[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSuppliers = useCallback(async () => {
    try {
      const userId = await getUserScope();
      const allSuppliers = scopeLocalRows(await offlineDB.suppliers.toArray(), userId);
      setSuppliers(allSuppliers);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  useRealtimeRefresh(['suppliers'], loadSuppliers);

  return { suppliers, loading, refresh: loadSuppliers };
}

// Hook para cargar subcontratos
export function useSubcontractors() {
  const [subcontractors, setSubcontractors] = useState<LocalSubcontractor[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSubcontractors = useCallback(async () => {
    try {
      const userId = await getUserScope();
      const allSubcontractors = scopeLocalRows(await offlineDB.subcontractors.toArray(), userId);
      setSubcontractors(allSubcontractors);
    } catch (error) {
      console.error('Error loading subcontractors:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubcontractors();
  }, [loadSubcontractors]);

  useRealtimeRefresh(['subcontractors'], loadSubcontractors);

  return { subcontractors, loading, refresh: loadSubcontractors };
}

// Hook combinado para cargar todos los datos del dashboard
export function useDashboardData() {
  const { projects, loading: projectsLoading } = useProjects();
  const { transactions, loading: transactionsLoading } = useTransactions();
  const { employees, loading: employeesLoading } = useEmployees();
  const { stock, loading: stockLoading } = useWarehouseStock();
  const { logs, loading: logsLoading } = useProjectLogs();
  const { budgets, budgetItems, loading: budgetsLoading } = useBudgets();
  const { purchaseOrders, purchaseOrderItems, loading: purchaseOrdersLoading } = usePurchaseOrders();
  const { payrollRecords, loading: payrollRecordsLoading } = usePayrollRecords();
  const { clients, loading: clientsLoading } = useClients();
  const { suppliers, loading: suppliersLoading } = useSuppliers();
  const { subcontractors, loading: subcontractorsLoading } = useSubcontractors();

  const loading = 
    projectsLoading || 
    transactionsLoading || 
    employeesLoading || 
    stockLoading || 
    logsLoading || 
    budgetsLoading || 
    purchaseOrdersLoading || 
    payrollRecordsLoading || 
    clientsLoading || 
    suppliersLoading ||
    subcontractorsLoading;

  return {
    projects,
    transactions,
    employees,
    stock,
    logs,
    budgets,
    budgetItems,
    purchaseOrders,
    purchaseOrderItems,
    payrollRecords,
    clients,
    suppliers,
    subcontractors,
    loading
  };
}
