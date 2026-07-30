'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Users, DollarSign, Calendar, BadgeCheck, X, Save, UserPlus } from 'lucide-react';
import { offlineDB, LocalPayrollEmployee, LocalPayrollRecord } from '@/lib/db/offlineStore';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';

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
  employee_id: string;
  period_start: string;
  period_end: string;
  days_worked: number;
  overtime_hours: number;
  overtime_rate: number;
  bonuses: number;
  deductions: number;
}

export default function PayrollManager() {
  const { showToast } = useToast();
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
    employee_id: '',
    period_start: new Date().toISOString().split('T')[0],
    period_end: new Date().toISOString().split('T')[0],
    days_worked: 0,
    overtime_hours: 0,
    overtime_rate: 0,
    bonuses: 0,
    deductions: 0,
  });

  useEffect(() => {
    loadEmployees();
    loadPayrollRecords();
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

  const checkOnlineStatus = () => {
    setIsOnline(navigator.onLine);
  };

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
    }
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
      setEditingEmployee(null);
      setEmployeeFormData({
        name: '',
        position: '',
        daily_rate: 0,
        category: 'obrero',
        department: '',
        hire_date: new Date().toISOString().split('T')[0],
        active: true,
      });
    }
    setIsEmployeeModalOpen(true);
  };

  const handleCloseEmployeeModal = () => {
    setIsEmployeeModalOpen(false);
    setEditingEmployee(null);
    setEmployeeFormData({
      name: '',
      position: '',
      daily_rate: 0,
      category: 'obrero',
      department: '',
      hire_date: new Date().toISOString().split('T')[0],
      active: true,
    });
  };

  const handleSaveEmployee = async () => {
    try {
      const employeeData: LocalPayrollEmployee = {
        ...employeeFormData,
        sync_status: isOnline ? 'synced' : 'created_offline',
        created_at: new Date().toISOString(),
      };

      if (editingEmployee) {
        // Update in localStorage
        await offlineDB.payrollEmployees.update(editingEmployee.id!, {
          ...employeeData,
          sync_status: isOnline ? 'synced' : 'updated_offline',
        });
        
        // Update in Supabase if online
        if (isOnline && editingEmployee.id && supabase) {
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
              sync_status: 'updated_offline',
            });
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
    }
  };

  const handleDeleteEmployee = async (employee: LocalPayrollEmployee) => {
    try {
      await offlineDB.payrollEmployees.delete(employee.id!);
      
      if (isOnline && employee.id && supabase) {
        const { error } = await supabase.from('payroll_employees').delete().eq('id', employee.id);
        if (error) console.error('Error deleting employee from Supabase:', error);
      }
      
      await loadEmployees();
      showToast('info', `Empleado "${employee.name}" eliminado`);
    } catch (error) {
      console.error('Error deleting employee:', error);
      showToast('error', 'Error al eliminar el empleado');
    }
  };

  const handleOpenPayrollModal = (record?: LocalPayrollRecord) => {
    if (record) {
      setEditingPayroll(record);
      setPayrollFormData({
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
      setEditingPayroll(null);
      setPayrollFormData({
        employee_id: '',
        period_start: new Date().toISOString().split('T')[0],
        period_end: new Date().toISOString().split('T')[0],
        days_worked: 0,
        overtime_hours: 0,
        overtime_rate: 0,
        bonuses: 0,
        deductions: 0,
      });
    }
    setIsPayrollModalOpen(true);
  };

  const handleClosePayrollModal = () => {
    setIsPayrollModalOpen(false);
    setEditingPayroll(null);
    setPayrollFormData({
      employee_id: '',
      period_start: new Date().toISOString().split('T')[0],
      period_end: new Date().toISOString().split('T')[0],
      days_worked: 0,
      overtime_hours: 0,
      overtime_rate: 0,
      bonuses: 0,
      deductions: 0,
    });
  };

  const handleSavePayroll = async () => {
    try {
      const employee = employees.find(e => e.id === payrollFormData.employee_id);
      if (!employee) return;

      const baseSalary = payrollFormData.days_worked * employee.daily_rate;
      const overtimePay = payrollFormData.overtime_hours * payrollFormData.overtime_rate;
      const grossSalary = baseSalary + overtimePay + payrollFormData.bonuses;
      const benefits = calculateGuatemalanBenefits(grossSalary);
      const netSalary = grossSalary - benefits.igss - payrollFormData.deductions;

      const payrollData: LocalPayrollRecord = {
        ...payrollFormData,
        base_salary: baseSalary,
        overtime_pay: overtimePay,
        gross_salary: grossSalary,
        igss_deduction: benefits.igss,
        aguinaldo_provision: benefits.aguinaldo,
        vacaciones_provision: benefits.vacaciones,
        net_salary: netSalary,
        sync_status: isOnline ? 'synced' : 'created_offline',
        created_at: new Date().toISOString(),
      };

      if (editingPayroll) {
        await offlineDB.payrollRecords.update(editingPayroll.id!, {
          ...payrollData,
          sync_status: isOnline ? 'synced' : 'updated_offline',
        });
        
        if (isOnline && editingPayroll.id && supabase) {
          await supabase
            .from('payroll_records')
            .update(payrollData)
            .eq('id', editingPayroll.id);
        }
      } else {
        const id = await offlineDB.payrollRecords.add(payrollData);
        
        if (isOnline && supabase) {
          const { data } = await supabase
            .from('payroll_records')
            .insert(payrollData)
            .select()
            .single();
          
          if (data) {
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
    }
  };

  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
      minimumFractionDigits: 2,
    }).format(amount);
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

  const summary = calculateSummary();

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </span>
          <span>Gestión de Nómina</span>
        </h2>
        <div className="flex items-center space-x-2">
          <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full ${isOnline ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-amber-500/20 border border-amber-500/30'}`}>
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span className={`text-xs font-medium ${isOnline ? 'text-emerald-300' : 'text-amber-300'}`}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          <button
            onClick={() => handleOpenEmployeeModal()}
            className="glass-button px-4 py-2 rounded-lg text-sm text-cyan-300 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Empleado</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="glass-card p-4 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/60 text-sm">Empleados Activos</span>
            <Users className="w-5 h-5 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-white">{summary.totalEmployees}</p>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/60 text-sm">Nómina Mensual</span>
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">{formatCurrency(summary.totalMonthlyPayroll)}</p>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/60 text-sm">Prestaciones</span>
            <BadgeCheck className="w-5 h-5 text-violet-400" />
          </div>
          <p className="text-2xl font-bold text-violet-400">{formatCurrency(summary.totalBenefits)}</p>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/60 text-sm">Costo Total</span>
            <Calendar className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400">{formatCurrency(summary.totalCost)}</p>
        </div>
      </div>

      {/* Tab Navigation */}
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

      {/* Search */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Buscar empleados..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {activeTab === 'employees' ? (
        filteredEmployees.length === 0 ? (
          <EmptyState
            icon={<UserPlus className="w-12 h-12" />}
            title={employees.length === 0 ? "No hay empleados" : "Sin resultados"}
            description={employees.length === 0 ? "Registre empleados para comenzar a gestionar la nómina." : "Intente con otros términos de búsqueda."}
            action={employees.length === 0 ? (
              <button
                onClick={() => handleOpenEmployeeModal()}
                className="glass-button px-4 py-2 rounded-lg text-sm text-cyan-300 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Empleado</span>
              </button>
            ) : undefined}
          />
        ) : (
          <div className="data-table-container rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full text-sm" style={{ minWidth: '600px' }}>
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-white/60 py-3 px-4">Nombre</th>
                  <th className="text-left text-white/60 py-3 px-4">Posición</th>
                  <th className="text-left text-white/60 py-3 px-4">Categoría</th>
                  <th className="text-left text-white/60 py-3 px-4">Departamento</th>
                  <th className="text-left text-white/60 py-3 px-4">Salario Diario</th>
                  <th className="text-left text-white/60 py-3 px-4">Estado</th>
                  <th className="text-left text-white/60 py-3 px-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 px-4 text-white font-medium">{employee.name}</td>
                    <td className="py-3 px-4 text-white/70">{employee.position}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${employee.category === 'obrero' ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'}`}>
                        {employee.category === 'obrero' ? 'Obrero' : 'Empleado'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white/70">{employee.department}</td>
                    <td className="py-3 px-4 text-white font-medium">{formatCurrency(employee.daily_rate)}</td>
                    <td className="py-3 px-4">
                      <span className={`flex items-center space-x-1 ${employee.active ? 'text-emerald-400' : 'text-red-400'}`}>
                        <span className={`w-2 h-2 rounded-full ${employee.active ? 'bg-emerald-400' : 'bg-red-400'}`} />
                        <span className="capitalize">{employee.active ? 'Activo' : 'Inactivo'}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleOpenEmployeeModal(employee)}
                          className="text-cyan-400 hover:text-cyan-300"
                          aria-label={`Editar empleado ${employee.name}`}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(employee)}
                          className="text-red-400 hover:text-red-300"
                          aria-label={`Eliminar empleado ${employee.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        payrollRecords.length === 0 ? (
          <EmptyState
            icon={<DollarSign className="w-12 h-12" />}
            title="No hay registros de pago"
            description="Genere registros de nómina para los empleados registrados."
          />
        ) : (
          <div className="data-table-container rounded-xl border border-white/10 overflow-hidden">
            <div className="flex justify-end mb-4">
              <button
                onClick={() => handleOpenPayrollModal()}
                className="glass-button px-4 py-2 rounded-lg text-sm text-cyan-300 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Registro</span>
              </button>
            </div>
            <table className="w-full text-sm" style={{ minWidth: '600px' }}>
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
                {payrollRecords.map((record) => {
                  const employee = employees.find(e => e.id === record.employee_id);
                  return (
                    <tr key={record.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3 px-4 text-white font-medium">{employee?.name || 'N/A'}</td>
                      <td className="py-3 px-4 text-white/70">{record.period_start} - {record.period_end}</td>
                      <td className="py-3 px-4 text-white/70">{record.days_worked}</td>
                      <td className="py-3 px-4 text-white/70">{record.overtime_hours}</td>
                      <td className="py-3 px-4 text-white font-medium">{formatCurrency(record.gross_salary)}</td>
                      <td className="py-3 px-4 text-white/70">{formatCurrency(record.igss_deduction)}</td>
                      <td className="py-3 px-4 text-emerald-400 font-medium">{formatCurrency(record.net_salary)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Employee Modal */}
      {isEmployeeModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-panel rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto pb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">
                {editingEmployee ? 'Editar Empleado' : 'Nuevo Empleado'}
              </h3>
              <button
                onClick={handleCloseEmployeeModal}
                className="text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs text-white/60 mb-1 block">Nombre Completo</label>
                <input
                  type="text"
                  value={employeeFormData.name}
                  onChange={(e) => setEmployeeFormData({ ...employeeFormData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block">Posición</label>
                <input
                  type="text"
                  value={employeeFormData.position}
                  onChange={(e) => setEmployeeFormData({ ...employeeFormData, position: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block">Departamento</label>
                <input
                  type="text"
                  value={employeeFormData.department}
                  onChange={(e) => setEmployeeFormData({ ...employeeFormData, department: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block">Categoría</label>
                <select
                  value={employeeFormData.category}
                  onChange={(e) => setEmployeeFormData({ ...employeeFormData, category: e.target.value as 'obrero' | 'empleado' })}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
                >
                  <option value="obrero">Obrero</option>
                  <option value="empleado">Empleado</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block">Tarifa Diaria (GTQ)</label>
                <input
                  type="number"
                  value={employeeFormData.daily_rate}
                  onChange={(e) => setEmployeeFormData({ ...employeeFormData, daily_rate: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block">Fecha de Contratación</label>
                <input
                  type="date"
                  value={employeeFormData.hire_date}
                  onChange={(e) => setEmployeeFormData({ ...employeeFormData, hire_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center space-x-2 cursor-pointer">
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

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleCloseEmployeeModal}
                className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm hover:bg-white/20"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEmployee}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm hover:opacity-90 flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Guardar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payroll Modal */}
      {isPayrollModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-panel rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto pb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">
                {editingPayroll ? 'Editar Registro de Pago' : 'Nuevo Registro de Pago'}
              </h3>
              <button
                onClick={handleClosePayrollModal}
                className="text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs text-white/60 mb-1 block">Empleado</label>
                <select
                  value={payrollFormData.employee_id}
                  onChange={(e) => setPayrollFormData({ ...payrollFormData, employee_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
                >
                  <option value="">Seleccionar empleado</option>
                  {employees.filter(e => e.active).map((employee) => (
                    <option key={employee.id} value={employee.id}>{employee.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block">Inicio del Periodo</label>
                <input
                  type="date"
                  value={payrollFormData.period_start}
                  onChange={(e) => setPayrollFormData({ ...payrollFormData, period_start: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block">Fin del Periodo</label>
                <input
                  type="date"
                  value={payrollFormData.period_end}
                  onChange={(e) => setPayrollFormData({ ...payrollFormData, period_end: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block">Días Trabajados</label>
                <input
                  type="number"
                  value={payrollFormData.days_worked}
                  onChange={(e) => setPayrollFormData({ ...payrollFormData, days_worked: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block">Horas Extra</label>
                <input
                  type="number"
                  value={payrollFormData.overtime_hours}
                  onChange={(e) => setPayrollFormData({ ...payrollFormData, overtime_hours: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block">Tarifa por Hora Extra</label>
                <input
                  type="number"
                  value={payrollFormData.overtime_rate}
                  onChange={(e) => setPayrollFormData({ ...payrollFormData, overtime_rate: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block">Bonificaciones</label>
                <input
                  type="number"
                  value={payrollFormData.bonuses}
                  onChange={(e) => setPayrollFormData({ ...payrollFormData, bonuses: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block">Deducciones</label>
                <input
                  type="number"
                  value={payrollFormData.deductions}
                  onChange={(e) => setPayrollFormData({ ...payrollFormData, deductions: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleClosePayrollModal}
                className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm hover:bg-white/20"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePayroll}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm hover:opacity-90 flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Guardar</span>
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
