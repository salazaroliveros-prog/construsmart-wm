'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Users, DollarSign, Calendar, BadgeCheck, X, Save, UserPlus, Wallet, FolderOpen } from 'lucide-react';
import { offlineDB, LocalPayrollEmployee, LocalPayrollRecord, LocalProject } from '@/lib/db/offlineStore';
import { supabase } from '@/lib/supabase/client';
import { queueDelete, PENDING_STATUSES } from '@/lib/utils/offlineSync';
import { resolveSyncStatus, normalizeSyncStatus } from '@/lib/utils/syncState';
import { useRealtimeRefresh } from '@/lib/hooks/useRealtimeRefresh';
import { useIncrementalList } from '@/lib/hooks/useIncrementalList';
import { useFinancialSettings, formatCurrency } from '@/lib/hooks/useBusinessSettings';
import { useToast } from '@/components/ui/Toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import Tooltip from '@/components/ui/Tooltip';
import ActionButton from '@/components/ui/ActionButton';
import { payrollEmployeeSchema, payrollRecordSchema, validateSchema, formatValidationErrors } from '@/lib/validation/schemas';
import { getCurrentUserId } from '@/lib/auth/userId';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface EmployeeFormData {
  name: string;
  position: string;
  daily_rate: number;
  category: 'obrero' | 'empleado';
  department: string;
  hire_date: string;
  active: boolean;
}

interface PayrollFormData {
  project_id?: string;
  employee_id: string;
  period_start: string;
  period_end: string;
  days_worked: number;
  overtime_hours: number;
  overtime_rate: number;
  bonuses: number;
  deductions: number;
}

// ============================================================================
// CATEGORY LABELS AND COLORS
// ============================================================================

const categoryLabels: Record<string, string> = {
  obrero: 'Obrero',
  empleado: 'Empleado'
};

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  obrero: { bg: 'rgba(59, 130, 246, 0.2)', text: 'rgb(147, 197, 253)', border: 'rgba(59, 130, 246, 0.3)' },
  empleado: { bg: 'rgba(139, 92, 246, 0.2)', text: 'rgb(196, 181, 253)', border: 'rgba(139, 92, 246, 0.3)' }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PayrollManager() {
  const { showToast } = useToast();
  const { financial } = useFinancialSettings();

  // ---------------------------------------------------------------------------
  // STATE MANAGEMENT
  // ---------------------------------------------------------------------------

  const [employees, setEmployees] = useState<LocalPayrollEmployee[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<LocalPayrollRecord[]>([]);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<LocalPayrollEmployee | null>(null);
  const [editingPayroll, setEditingPayroll] = useState<LocalPayrollRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [activeTab, setActiveTab] = useState<'employees' | 'records'>('employees');
  const [deleteConfirm, setDeleteConfirm] = useState<LocalPayrollEmployee | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [availableProjects, setAvailableProjects] = useState<LocalProject[]>([]);

  const [employeeFormData, setEmployeeFormData] = useState<EmployeeFormData>({
    name: '',
    position: '',
    daily_rate: 0,
    category: 'obrero',
    department: '',
    hire_date: new Date().toISOString().split('T')[0],
    active: true,
  });

  const [payrollFormData, setPayrollFormData] = useState<PayrollFormData>({
    project_id: undefined,
    employee_id: '',
    period_start: new Date().toISOString().split('T')[0],
    period_end: new Date().toISOString().split('T')[0],
    days_worked: 0,
    overtime_hours: 0,
    overtime_rate: 0,
    bonuses: 0,
    deductions: 0,
  });

  // ---------------------------------------------------------------------------
  // EFFECTS
  // ---------------------------------------------------------------------------

  useEffect(() => {
    loadEmployees();
    loadPayrollRecords();
    loadProjects();
    checkOnlineStatus();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // UTILITY FUNCTIONS
  // ---------------------------------------------------------------------------

const checkOnlineStatus = () => {
    setIsOnline(navigator.onLine);
  };

  const calculateGuatemalanBenefits = (baseSalary: number) => {
    // Guatemalan labor law benefits
    const igssRate = 0.0483; // 4.83% employee contribution
    const igssDeduction = baseSalary * igssRate;

    const aguinaldoRate = 0.0833; // 1/12 of annual salary per month
    const aguinaldo = baseSalary * aguinaldoRate;

    const vacacionesRate = 0.0417; // 1/24 of annual salary (Guatemala labor law)
    const vacaciones = baseSalary * vacacionesRate;

    return {
      igss: igssDeduction,
      aguinaldo,
      vacaciones,
      totalBenefits: aguinaldo + vacaciones,
      netSalary: baseSalary - igssDeduction,
    };
  };

  const calculateSummary = () => {
    const activeEmployees = employees.filter(e => e.active);
    const totalMonthlyPayroll = activeEmployees.reduce((sum, e) => sum + (e.daily_rate * 30), 0);
    const totalBenefits = activeEmployees.reduce((sum, e) => {
      const benefits = calculateGuatemalanBenefits(e.daily_rate * 30);
      return sum + benefits.totalBenefits;
    }, 0);

    return {
      totalEmployees: activeEmployees.length,
      totalMonthlyPayroll,
      totalBenefits,
      totalCost: totalMonthlyPayroll + totalBenefits,
    };
  };

  // ---------------------------------------------------------------------------
  // DATA LOADING
  // ---------------------------------------------------------------------------

  const loadEmployees = async () => {
    try {
      const localEmployees = await offlineDB.payrollEmployees.toArray();
      setEmployees(localEmployees);

      if (navigator.onLine && supabase) {
        const { data: supabaseEmployees } = await supabase
          .from('payroll_employees')
          .select('*')
          .order('name', { ascending: true });

        if (supabaseEmployees) {
          for (const employee of supabaseEmployees) {
            const existing = await offlineDB.payrollEmployees.get(employee.id);
            if (existing && PENDING_STATUSES.includes(existing.sync_status || '')) continue;
            await offlineDB.payrollEmployees.put({
              ...employee,
              sync_status: 'synced',
            });
          }

          const updatedEmployees = await offlineDB.payrollEmployees.toArray();
          setEmployees(updatedEmployees);
        }
      }
} catch (error) {
      console.error('Error loading employees:', error);
      showToast('error', 'Error al cargar empleados desde el servidor');
    }
  };

  const loadPayrollRecords = async () => {
    try {
      const localRecords = await offlineDB.payrollRecords.toArray();
      setPayrollRecords(localRecords);

      if (navigator.onLine && supabase) {
        const { data: supabaseRecords } = await supabase
          .from('payroll_records')
          .select('*')
          .order('period_end', { ascending: false });

        if (supabaseRecords) {
          for (const record of supabaseRecords) {
            const existing = await offlineDB.payrollRecords.get(record.id);
            if (existing && PENDING_STATUSES.includes(existing.sync_status || '')) continue;
            await offlineDB.payrollRecords.put({
              ...record,
              sync_status: 'synced',
            });
          }

          const updatedRecords = await offlineDB.payrollRecords.toArray();
          setPayrollRecords(updatedRecords);
        }
      }
    } catch (error) {
      console.error('Error loading payroll records:', error);
      showToast('error', 'Error al cargar registros de nómina');
    }
  };

  const loadProjects = async () => {
    try {
      const projects = await offlineDB.projects.toArray();
      setAvailableProjects(projects);
    } catch (error) {
      console.error('Error loading projects:', error);
      showToast('error', 'Error al cargar proyectos');
    }
  };

  // ---------------------------------------------------------------------------
  // EMPLOYEE MANAGEMENT
  // ---------------------------------------------------------------------------

  const resetEmployeeForm = () => {
    setEmployeeFormData({
      name: '',
      position: '',
      daily_rate: 0,
      category: 'obrero',
      department: '',
      hire_date: new Date().toISOString().split('T')[0],
      active: true,
    });
    setEditingEmployee(null);
  };

  const handleOpenEmployeeModal = (employee?: LocalPayrollEmployee) => {
    if (employee) {
      setEditingEmployee(employee);
      setEmployeeFormData({
        name: employee.name,
        position: employee.position,
        daily_rate: employee.daily_rate,
        category: employee.category,
        department: employee.department,
        hire_date: employee.hire_date,
        active: employee.active,
      });
    } else {
      resetEmployeeForm();
    }
    setIsEmployeeModalOpen(true);
  };

  const handleCloseEmployeeModal = () => {
    setIsEmployeeModalOpen(false);
    resetEmployeeForm();
  };

  const handleSaveEmployee = async () => {
    setSaveLoading(true);

    try {
      // Validar con Zod schema
      const validation = validateSchema(payrollEmployeeSchema, employeeFormData);
      if (!validation.success) {
        const errorMessages = formatValidationErrors(validation.errors);
        showToast('error', errorMessages.join(', '));
        setSaveLoading(false);
        return;
      }

      // Obtener user_id para tenencia
      const userId = await getCurrentUserId();

      const employeeData: LocalPayrollEmployee = {
        user_id: userId || undefined,
        ...employeeFormData,
        sync_status: editingEmployee
          ? resolveSyncStatus({ isNewRecord: false, previousStatus: editingEmployee.sync_status, isOnline })
          : resolveSyncStatus({ isNewRecord: true, isOnline }),
        created_at: new Date().toISOString(),
      };

      if (editingEmployee) {
        const wasSynced = editingEmployee.sync_status === 'synced';

        // Update in localStorage
        await offlineDB.payrollEmployees.update(editingEmployee.id!, {
          ...employeeData,
          sync_status: resolveSyncStatus({ isNewRecord: false, previousStatus: editingEmployee.sync_status, isOnline }),
        });

        // Update in Supabase if online
        if (isOnline && wasSynced && supabase) {
          const { error } = await supabase
            .from('payroll_employees')
            .update({
              name: employeeData.name,
              position: employeeData.position,
              daily_rate: employeeData.daily_rate,
              category: employeeData.category,
              department: employeeData.department,
              hire_date: employeeData.hire_date,
              active: employeeData.active,
            })
            .eq('id', editingEmployee.id);

          if (error) {
            console.error('Error updating employee in Supabase:', error);
            await offlineDB.payrollEmployees.update(editingEmployee.id!, {
              sync_status: resolveSyncStatus({ isNewRecord: false, previousStatus: editingEmployee.sync_status, isOnline }),
            });
            showToast('warning', 'Empleado actualizado localmente; pendiente de sync');
          } else {
            await offlineDB.payrollEmployees.update(editingEmployee.id!, { sync_status: 'synced' });
          }
        }
      } else {
        // Create in localStorage
        const id = await offlineDB.payrollEmployees.add(employeeData);

        // Create in Supabase if online
        if (isOnline && supabase) {
          const { data, error } = await supabase
            .from('payroll_employees')
            .insert({
              name: employeeData.name,
              position: employeeData.position,
              daily_rate: employeeData.daily_rate,
              category: employeeData.category,
              department: employeeData.department,
              hire_date: employeeData.hire_date,
              active: employeeData.active,
            })
            .select()
            .single();

          if (error) {
            console.error('Error creating employee in Supabase:', error);
            await offlineDB.payrollEmployees.update(id, {
              sync_status: resolveSyncStatus({ isNewRecord: true, isOnline }),
            });
            showToast('warning', 'Empleado creado localmente; pendiente de sync');
          } else if (data) {
            await offlineDB.payrollEmployees.update(id, {
              id: data.id,
              sync_status: 'synced',
            });
          }
        }
      }

      await loadEmployees();
      handleCloseEmployeeModal();
      showToast(
        'success',
        editingEmployee
          ? `Empleado "${employeeFormData.name}" actualizado`
          : `Empleado "${employeeFormData.name}" creado`
      );
    } catch (error) {
      console.error('Error saving employee:', error);
      showToast('error', 'Error al guardar el empleado');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteEmployee = async (employee: LocalPayrollEmployee) => {
    try {
      await queueDelete('payroll_employees', employee);
      await offlineDB.payrollEmployees.delete(employee.id!);

      // Cascada local: el servidor borra en CASCADE los registros de nómina del empleado
      await offlineDB.payrollRecords.where('employee_id').equals(employee.id!).delete();

      await loadEmployees();
      showToast('info', `Empleado "${employee.name}" eliminado`);
    } catch (error) {
      console.error('Error deleting employee:', error);
      showToast('error', 'Error al eliminar el empleado');
    }
  };

  // ---------------------------------------------------------------------------
  // PAYROLL RECORD MANAGEMENT
  // ---------------------------------------------------------------------------

  const resetPayrollForm = () => {
    setPayrollFormData({
      project_id: selectedProject === 'all' ? undefined : selectedProject,
      employee_id: '',
      period_start: new Date().toISOString().split('T')[0],
      period_end: new Date().toISOString().split('T')[0],
      days_worked: 0,
      overtime_hours: 0,
      overtime_rate: 0,
      bonuses: 0,
      deductions: 0,
    });
    setEditingPayroll(null);
  };

  const handleOpenPayrollModal = (record?: LocalPayrollRecord) => {
    if (record) {
      setEditingPayroll(record);
      setPayrollFormData({
        project_id: record.project_id,
        employee_id: record.employee_id,
        period_start: record.period_start,
        period_end: record.period_end,
        days_worked: record.days_worked,
        overtime_hours: record.overtime_hours,
        overtime_rate: record.overtime_rate,
        bonuses: record.bonuses,
        deductions: record.deductions,
      });
    } else {
      resetPayrollForm();
    }
    setIsPayrollModalOpen(true);
  };

  const handleClosePayrollModal = () => {
    setIsPayrollModalOpen(false);
    resetPayrollForm();
  };

  const handleSavePayroll = async () => {
    setSaveLoading(true);

    try {
      // Validar con Zod schema
      const validation = validateSchema(payrollRecordSchema, payrollFormData);
      if (!validation.success) {
        const errorMessages = formatValidationErrors(validation.errors);
        showToast('error', errorMessages.join(', '));
        setSaveLoading(false);
        return;
      }

      const employee = employees.find(e => e.id === payrollFormData.employee_id);
      if (!employee) return;

      const baseSalary = payrollFormData.days_worked * employee.daily_rate;
      const overtimePay = payrollFormData.overtime_hours * payrollFormData.overtime_rate;
      const grossSalary = baseSalary + overtimePay + payrollFormData.bonuses;
      const benefits = calculateGuatemalanBenefits(grossSalary);
      const netSalary = grossSalary - benefits.igss - payrollFormData.deductions;

      // Obtener user_id para tenencia
      const userId = await getCurrentUserId();

      const payrollData: LocalPayrollRecord = {
        user_id: userId || undefined,
        project_id: payrollFormData.project_id,
        employee_id: payrollFormData.employee_id,
        period_start: payrollFormData.period_start,
        period_end: payrollFormData.period_end,
        days_worked: payrollFormData.days_worked,
        overtime_hours: payrollFormData.overtime_hours,
        overtime_rate: payrollFormData.overtime_rate,
        bonuses: payrollFormData.bonuses,
        deductions: payrollFormData.deductions,
        base_salary: baseSalary,
        overtime_pay: overtimePay,
        gross_salary: grossSalary,
        igss_deduction: benefits.igss,
        aguinaldo_provision: benefits.aguinaldo,
        vacaciones_provision: benefits.vacaciones,
        net_salary: netSalary,
        sync_status: editingPayroll
          ? resolveSyncStatus({ isNewRecord: false, previousStatus: editingPayroll.sync_status, isOnline })
          : resolveSyncStatus({ isNewRecord: true, isOnline }),
        created_at: new Date().toISOString(),
      };

      if (editingPayroll) {
        const wasSynced = normalizeSyncStatus(editingPayroll.sync_status) === 'synced';

        await offlineDB.payrollRecords.update(editingPayroll.id!, {
          ...payrollData,
          sync_status: resolveSyncStatus({ isNewRecord: false, previousStatus: editingPayroll.sync_status, isOnline }),
        });

        if (isOnline && wasSynced && supabase) {
          const { error } = await supabase
            .from('payroll_records')
            .update(payrollData)
            .eq('id', editingPayroll.id);

          if (error) {
            console.error('Error updating payroll record in Supabase:', error);
            await offlineDB.payrollRecords.update(editingPayroll.id!, {
              sync_status: resolveSyncStatus({ isNewRecord: false, previousStatus: editingPayroll.sync_status, isOnline }),
            });
            showToast('warning', 'Registro de nómina actualizado localmente; pendiente de sync');
          } else {
            await offlineDB.payrollRecords.update(editingPayroll.id!, { sync_status: 'synced' });
          }
        }
      } else {
        const id = await offlineDB.payrollRecords.add(payrollData);

        if (isOnline && supabase) {
          const { data, error } = await supabase
            .from('payroll_records')
            .insert(payrollData)
            .select()
            .single();

          if (error) {
            console.error('Error creating payroll record in Supabase:', error);
            await offlineDB.payrollRecords.update(id, { sync_status: resolveSyncStatus({ isNewRecord: true, isOnline }) });
            showToast('warning', 'Registro de nómina creado localmente; pendiente de sync');
          } else if (data) {
            await offlineDB.payrollRecords.update(id, { id: data.id, sync_status: 'synced' });
          }
        }
      }

      await loadPayrollRecords();
      handleClosePayrollModal();
      showToast(
        'success',
        editingPayroll
          ? 'Registro de nómina actualizado'
          : 'Registro de nómina creado'
      );
    } catch (error) {
      console.error('Error saving payroll:', error);
      showToast('error', 'Error al guardar el registro de nómina');
    } finally {
      setSaveLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // FILTERING
  // ---------------------------------------------------------------------------

  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPayrollRecords = payrollRecords.filter(record => {
    const matchesProject = selectedProject === 'all' || record.project_id === selectedProject;
    return matchesProject;
  });

  // Renderizado incremental: evita saturar el DOM con cientos/miles de filas.
  const {
    visibleItems: visibleEmployees,
    hasMore: hasMoreEmployees,
    remaining: remainingEmployees,
    showMore: showMoreEmployees,
  } = useIncrementalList({
    items: filteredEmployees,
    increment: 25,
    resetOnItemsChange: true,
  });

  const {
    visibleItems: visiblePayrollRecords,
    hasMore: hasMorePayrollRecords,
    remaining: remainingPayrollRecords,
    showMore: showMorePayrollRecords,
  } = useIncrementalList({
    items: filteredPayrollRecords,
    increment: 25,
    resetOnItemsChange: true,
  });

  const summary = calculateSummary();

  // Realtime refresh: reload data when changes arrive from other devices
  useRealtimeRefresh(['payroll_employees', 'payroll_records', 'projects'], () => {
    loadEmployees();
    loadPayrollRecords();
    loadProjects();
  });

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 sm:mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Wallet className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400" />
              Gestión de Nómina
            </h1>
            <p className="text-white/60 text-sm mt-1">
              Administre empleados y registros de pago
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip content={isOnline ? 'Conectado a internet' : 'Trabajando sin conexión'}>
              <div className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm ${
                isOnline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
              }`}>
                {isOnline ? '🟢 En línea' : '🟡 Sin conexión'}
              </div>
            </Tooltip>
            <Tooltip content="Agregar nuevo empleado a la nómina">
              <button
                onClick={() => handleOpenEmployeeModal()}
                className="glass-button px-4 py-2 rounded-lg text-white flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Nuevo Empleado</span>
                <span className="sm:hidden">Nuevo</span>
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="glass-card p-3 sm:p-4 rounded-xl border-l-4 border-l-cyan-500">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
              <span className="text-white/60 text-xs sm:text-sm">Empleados Activos</span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-white">{summary.totalEmployees}</p>
          </div>
          <div className="glass-card p-3 sm:p-4 rounded-xl border-l-4 border-l-emerald-500">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
              <span className="text-white/60 text-xs sm:text-sm">Nómina Mensual</span>
            </div>
<p className="text-lg sm:text-xl font-bold text-emerald-400">{formatCurrency(summary.totalMonthlyPayroll, financial)}</p>
          </div>
          <div className="glass-card p-3 sm:p-4 rounded-xl border-l-4 border-l-violet-500">
            <div className="flex items-center gap-2 mb-1">
              <BadgeCheck className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400" />
              <span className="text-white/60 text-xs sm:text-sm">Prestaciones</span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-violet-400">{formatCurrency(summary.totalBenefits, financial)}</p>
          </div>
          <div className="glass-card p-3 sm:p-4 rounded-xl border-l-4 border-l-amber-500">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
              <span className="text-white/60 text-xs sm:text-sm">Costo Total</span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-amber-400">{formatCurrency(summary.totalCost, financial)}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Buscar empleados..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white text-sm"
              />
            </div>
          </div>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white text-sm"
          >
            <option value="all">Todos los proyectos</option>
            {availableProjects.map(project => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6">
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setActiveTab('employees')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'employees'
                ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 text-white'
                : 'text-white/60 hover:text-white border border-transparent'
            }`}
          >
            Empleados
          </button>
          <button
            onClick={() => setActiveTab('records')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'records'
                ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 text-white'
                : 'text-white/60 hover:text-white border border-transparent'
            }`}
          >
            Registros de Pago
          </button>
        </div>

        {activeTab === 'employees' ? (
          filteredEmployees.length === 0 ? (
            <EmptyState
              icon={<UserPlus className="w-8 h-8 text-white/30" />}
              title={employees.length === 0 ? "No hay empleados" : "Sin resultados"}
              description={employees.length === 0 ? "Registre empleados para comenzar a gestionar la nómina." : "Intente con otros términos de búsqueda."}
              action={employees.length === 0 ? (
                <button
                  onClick={() => handleOpenEmployeeModal()}
                  className="glass-button px-4 py-2 rounded-lg text-white flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Nuevo Empleado
                </button>
              ) : undefined}
            />
          ) : (
            <div className="data-table-container rounded-xl border border-white/10 overflow-hidden">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-white/60 py-3 px-4">Nombre</th>
                    <th className="text-left text-white/60 py-3 px-4">Posición</th>
                    <th className="text-left text-white/60 py-3 px-4">Categoría</th>
                    <th className="text-left text-white/60 py-3 px-4">Departamento</th>
                    <th className="text-left text-white/60 py-3 px-4">Salario Diario</th>
                    <th className="text-left text-white/60 py-3 px-4">Estado</th>
                    <th className="text-right text-white/60 py-3 px-4">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleEmployees.map((employee) => (
                    <tr key={employee.id} className="border-b border-white/10 hover:bg-white/5">
                      <td className="py-3 px-4 text-white font-medium">{employee.name}</td>
                      <td className="py-3 px-4 text-white/70">{employee.position}</td>
                      <td className="py-3 px-4">
                        <span
                          className="px-2 py-1 rounded-md text-xs font-medium"
                          style={{
                            backgroundColor: categoryColors[employee.category]?.bg || 'rgba(255,255,255,0.1)',
                            color: categoryColors[employee.category]?.text || 'white',
                            border: `1px solid ${categoryColors[employee.category]?.border || 'rgba(255,255,255,0.2)'}`
                          }}
                        >
                          {categoryLabels[employee.category] || employee.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-white/70">{employee.department}</td>
<td className="py-3 px-4 text-white font-medium">{formatCurrency(employee.daily_rate, financial)}</td>
                      <td className="py-3 px-4">
                        <span className={`flex items-center gap-1 ${
                          employee.active ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${employee.active ? 'bg-emerald-400' : 'bg-red-400'}`} />
                          <span className="capitalize">{employee.active ? 'Activo' : 'Inactivo'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEmployeeModal(employee)}
                            className="text-cyan-400 hover:text-cyan-300 p-1"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(employee)}
                            className="text-red-400 hover:text-red-300 p-1"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
</tbody>
              </table>
              {hasMoreEmployees && (
                <div className="text-center py-3 border-t border-white/10">
                  <button
                    onClick={showMoreEmployees}
                    className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 text-sm transition-all"
                  >
                    Ver más empleados ({remainingEmployees} restantes)
                  </button>
                </div>
              )}
            </div>
          )
        ) : (
          filteredPayrollRecords.length === 0 ? (
            <EmptyState
              icon={<DollarSign className="w-8 h-8 text-white/30" />}
              title="No hay registros de pago"
              description={selectedProject !== 'all' ? 'No hay registros de nómina para el proyecto seleccionado.' : 'Genere registros de nómina para los empleados registrados.'}
              action={
                <button
                  onClick={() => handleOpenPayrollModal()}
                  className="glass-button px-4 py-2 rounded-lg text-white flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Nuevo Registro
                </button>
              }
            />
          ) : (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={() => handleOpenPayrollModal()}
                  className="glass-button px-4 py-2 rounded-lg text-white flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Nuevo Registro
                </button>
              </div>
              <div className="data-table-container rounded-xl border border-white/10 overflow-hidden">
                <table className="w-full text-sm min-w-[600px]">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left text-white/60 py-3 px-4">Empleado</th>
                      <th className="text-left text-white/60 py-3 px-4">Periodo</th>
                      <th className="text-left text-white/60 py-3 px-4">Días</th>
                      <th className="text-left text-white/60 py-3 px-4">Horas Extra</th>
                      <th className="text-left text-white/60 py-3 px-4">Salario Base</th>
                      <th className="text-left text-white/60 py-3 px-4">IGSS</th>
                      <th className="text-left text-white/60 py-3 px-4">Neto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visiblePayrollRecords.map((record) => {
                      const employee = employees.find(e => e.id === record.employee_id);
                      return (
                        <tr key={record.id} className="border-b border-white/10 hover:bg-white/5">
                          <td className="py-3 px-4 text-white font-medium">{employee?.name || 'N/A'}</td>
                          <td className="py-3 px-4 text-white/70">{record.period_start} - {record.period_end}</td>
                          <td className="py-3 px-4 text-white/70">{record.days_worked}</td>
                          <td className="py-3 px-4 text-white/70">{record.overtime_hours}</td>
<td className="py-3 px-4 text-white font-medium">{formatCurrency(record.gross_salary, financial)}</td>
                          <td className="py-3 px-4 text-white/70">{formatCurrency(record.igss_deduction, financial)}</td>
                          <td className="py-3 px-4 text-emerald-400 font-medium">{formatCurrency(record.net_salary, financial)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {hasMorePayrollRecords && (
                  <div className="text-center py-3 border-t border-white/10">
                    <button
                      onClick={showMorePayrollRecords}
                      className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 text-sm transition-all"
                    >
                      Ver más registros ({remainingPayrollRecords} restantes)
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        )}
      </div>

      {/* Employee Modal */}
      {isEmployeeModalOpen && (
        <div className="modal-backdrop flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto overflow-anchor-none" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {editingEmployee ? 'Editar Empleado' : 'Nuevo Empleado'}
              </h2>
              <button
                onClick={handleCloseEmployeeModal}
                className="text-white/60 hover:text-white p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-white/60 text-sm mb-1">Nombre Completo</label>
                <input
                  type="text"
                  value={employeeFormData.name}
                  onChange={(e) => setEmployeeFormData({ ...employeeFormData, name: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-white/60 text-sm mb-1">Posición</label>
                <input
                  type="text"
                  value={employeeFormData.position}
                  onChange={(e) => setEmployeeFormData({ ...employeeFormData, position: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-white/60 text-sm mb-1">Departamento</label>
                <input
                  type="text"
                  value={employeeFormData.department}
                  onChange={(e) => setEmployeeFormData({ ...employeeFormData, department: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-white/60 text-sm mb-1">Categoría</label>
                <select
                  value={employeeFormData.category}
                  onChange={(e) => setEmployeeFormData({ ...employeeFormData, category: e.target.value as 'obrero' | 'empleado' })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                >
                  <option value="obrero">Obrero</option>
                  <option value="empleado">Empleado</option>
                </select>
              </div>
              <div>
                <label className="block text-white/60 text-sm mb-1">Tarifa Diaria (GTQ)</label>
                <input
                  type="number"
                  step="0.01"
                  value={employeeFormData.daily_rate}
                  onChange={(e) => setEmployeeFormData({ ...employeeFormData, daily_rate: Number(e.target.value) })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-white/60 text-sm mb-1">Fecha de Contratación</label>
                <input
                  type="date"
                  value={employeeFormData.hire_date}
                  onChange={(e) => setEmployeeFormData({ ...employeeFormData, hire_date: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={employeeFormData.active}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, active: e.target.checked })}
                    className="w-4 h-4 rounded bg-white/10 border border-white/20 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span className="text-white text-sm">Empleado Activo</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleCloseEmployeeModal}
                className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm hover:bg-white/20"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEmployee}
                disabled={saveLoading}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm hover:opacity-90 flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saveLoading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payroll Modal */}
      {isPayrollModalOpen && (
        <div className="modal-backdrop flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto overflow-anchor-none" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {editingPayroll ? 'Editar Registro de Pago' : 'Nuevo Registro de Pago'}
              </h2>
              <button
                onClick={handleClosePayrollModal}
                className="text-white/60 hover:text-white p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-white/60 text-sm mb-1">Proyecto</label>
                <select
                  value={payrollFormData.project_id || ''}
                  onChange={(e) => setPayrollFormData({ ...payrollFormData, project_id: e.target.value || undefined })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                >
                  <option value="">Sin proyecto</option>
                  {availableProjects.map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-white/60 text-sm mb-1">Empleado</label>
                <select
                  value={payrollFormData.employee_id}
                  onChange={(e) => setPayrollFormData({ ...payrollFormData, employee_id: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                  required
                >
                  <option value="">Seleccionar empleado</option>
                  {employees.filter(e => e.active).map((employee) => (
                    <option key={employee.id} value={employee.id}>{employee.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-white/60 text-sm mb-1">Inicio del Periodo</label>
                <input
                  type="date"
                  value={payrollFormData.period_start}
                  onChange={(e) => setPayrollFormData({ ...payrollFormData, period_start: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-white/60 text-sm mb-1">Fin del Periodo</label>
                <input
                  type="date"
                  value={payrollFormData.period_end}
                  onChange={(e) => setPayrollFormData({ ...payrollFormData, period_end: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-white/60 text-sm mb-1">Días Trabajados</label>
                <input
                  type="number"
                  value={payrollFormData.days_worked}
                  onChange={(e) => setPayrollFormData({ ...payrollFormData, days_worked: Number(e.target.value) })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-white/60 text-sm mb-1">Horas Extra</label>
                <input
                  type="number"
                  value={payrollFormData.overtime_hours}
                  onChange={(e) => setPayrollFormData({ ...payrollFormData, overtime_hours: Number(e.target.value) })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-white/60 text-sm mb-1">Tarifa por Hora Extra</label>
                <input
                  type="number"
                  step="0.01"
                  value={payrollFormData.overtime_rate}
                  onChange={(e) => setPayrollFormData({ ...payrollFormData, overtime_rate: Number(e.target.value) })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-white/60 text-sm mb-1">Bonificaciones</label>
                <input
                  type="number"
                  step="0.01"
                  value={payrollFormData.bonuses}
                  onChange={(e) => setPayrollFormData({ ...payrollFormData, bonuses: Number(e.target.value) })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-white/60 text-sm mb-1">Deducciones</label>
                <input
                  type="number"
                  step="0.01"
                  value={payrollFormData.deductions}
                  onChange={(e) => setPayrollFormData({ ...payrollFormData, deductions: Number(e.target.value) })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleClosePayrollModal}
                className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm hover:bg-white/20"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePayroll}
                disabled={saveLoading}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm hover:opacity-90 flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saveLoading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Eliminar empleado"
        message={`¿Está seguro de eliminar al empleado "${deleteConfirm?.name}"? Esta acción no se puede deshacer.`}
        variant="danger"
        confirmLabel="Eliminar"
        onConfirm={() => { if (deleteConfirm) handleDeleteEmployee(deleteConfirm); setDeleteConfirm(null); }}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
