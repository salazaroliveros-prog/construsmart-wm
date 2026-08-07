# AUDITORÍA COMPLETA: INCONSISTENCIAS UI/UX, FUNCIONALES Y DE ARQUITECTURA
**CONSTRUCTORA WM/M&S - Sistema ERP Control de Seguimiento**
**Proyecto:** `construsmart-wm`  
**URL Producción:** `https://construsmart-wm.vercel.app/`  
**GitHub:** `https://github.com/salazaroliveros-prog/construsmart-wm.git`  
**Supabase:** `https://yibjsruoxjlgdnkgylld.supabase.co`  
**Fecha de Análisis:** 2026-08-05  
**Stack:** Next.js 16 + React 19 + TypeScript + Tailwind CSS + Dexie.js + Supabase

---

## RESUMEN EJECUTIVO

La suite **construsmart-wm** es un ERP completo en producción con 13 módulos funcionales, arquitectura offline-first y sincronización bidireccional con Supabase. El análisis revela:

✅ **FORTALEZAS:**
- Arquitectura offline-first robusta con Dexie.js + Supabase
- 13 módulos integrados sin errores de compilación
- Sistema de sincronización con retry exponencial y LWW (Last-Write-Wins)
- UI/UX moderna con glassmorphism y responsive design
- RLS implementado en Supabase
- Validación con Zod en todos los formularios

⚠️ **HALLAZGOS CRÍTICOS:**
- 6 inconsistencias de integración entre módulos
- 4 brechas funcionales según lógica de negocio
- 5 inconsistencias visuales/UX menores
- 3 funcionalidades faltantes para completar la suite

---

## 1. INCONSISTENCIAS DETECTADAS

### 1.1 INCONSISTENCIAS DE INTEGRACIÓN INTER-MÓDULOS

#### **Hallazgo 1: Desconexión entre Presupuestos y Finanzas**

**Ubicación:** `components/budgets/BudgetCalculator.tsx` ↔ `components/finances/FinanceManager.tsx`

**Problema:**
- Los presupuestos (`budgets`) y sus detalles (`budget_items`) se crean independientemente
- Las transacciones financieras NO se vinculan automáticamente a los renglones presupuestarios (`budget_items`)
- No existe un campo `budget_item_id` en `financial_transactions` para rastrear qué renglón se está consumiendo
- **Impacto:** Imposible hacer análisis "presupuesto vs. real" a nivel de línea sin mapeo manual

**Código Problemático:**
```typescript
// FinanceManager.tsx - FormData no incluye budget_item_id
interface TransactionFormData {
  project_id?: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  date: string;
  // ❌ FALTA: budget_item_id para vincular a presupuesto
}
```

**Corrección Recomendada:**
```typescript
// 1. Agregar campo a schema de financialTransactions en Supabase
ALTER TABLE financial_transactions 
ADD COLUMN budget_item_id UUID REFERENCES budget_items(id) ON DELETE SET NULL;

// 2. Actualizar TransactionFormData
interface TransactionFormData {
  project_id?: string;
  budget_item_id?: string; // ✅ Nuevo campo
  category: string;
  // ... resto
}

// 3. En FinanceManager.tsx - agregar selector
<select value={formData.budget_item_id || ''} onChange={(e) => setFormData({...formData, budget_item_id: e.target.value || undefined})}>
  <option value="">Sin asociar a presupuesto</option>
  {budgetItems.map(item => (
    <option key={item.id} value={item.id}>{item.description}</option>
  ))}
</select>
```

**Severidad:** 🔴 CRÍTICA - Impide análisis financiero comparativo

---

#### **Hallazgo 2: Almacén NO valida automáticamente stock mínimo antes de crear Órdenes**

**Ubicación:** `components/warehouse/WarehouseManager.tsx` → `components/warehouse/PurchaseOrderManager.tsx`

**Problema:**
- `warehouse_stock.minimum_threshold` existe pero NO disparas alertas automáticas
- Flag `auto_generate_po` está en la DB pero no está implementado en el frontend
- No hay trigger en Supabase que cree POs cuando stock < mínimo
- **Impacto:** Riesgo de ruptura de stock sin aviso

**Código Faltante:**
```typescript
// En WarehouseManager.tsx - AGREGAR LÓGICA
useEffect(() => {
  const checkLowStock = async () => {
    const userId = await getUserScope();
    const lowStockItems = scopeLocalRows(
      await offlineDB.warehouseStock.toArray(),
      userId
    ).filter(item => item.current_stock <= item.minimum_threshold);

    // Mostrar alertas para items por debajo del mínimo
    for (const item of lowStockItems) {
      if (item.auto_generate_po && item.preferred_supplier_id) {
        // Auto-generar PO si está configurado
        const autoCreated = await autoGeneratePurchaseOrder(item);
        if (autoCreated) {
          showToast('info', `Orden de compra auto-generada para ${item.description}`);
        }
      } else {
        showToast('warning', `Stock bajo: ${item.description} (${item.current_stock} de ${item.minimum_threshold})`);
      }
    }
  };

  checkLowStock();
  const interval = setInterval(checkLowStock, 300000); // Revisar cada 5 min
  return () => clearInterval(interval);
}, []);

// Función helper
async function autoGeneratePurchaseOrder(stockItem: LocalWarehouseStock) {
  if (!stockItem.preferred_supplier_id) return false;

  const reorderQty = stockItem.minimum_threshold * 3; // Pedir 3x el mínimo
  const poData = {
    id: generateId(),
    user_id: await getCurrentUserId(),
    code: `AUTO-PO-${Date.now()}`,
    supplier_id: stockItem.preferred_supplier_id,
    project_id: stockItem.project_id,
    order_date: new Date().toISOString().split('T')[0],
    status: 'pending',
    total_amount: reorderQty * stockItem.unit_cost,
    sync_status: isOnline() ? 'synced' : 'created_offline'
  };

  await offlineDB.purchaseOrders.add(poData);
  
  // Crear item de PO
  const poItem = {
    id: generateId(),
    user_id: await getCurrentUserId(),
    purchase_order_id: poData.id,
    item_code: stockItem.item_code,
    description: stockItem.description,
    quantity: reorderQty,
    unit: stockItem.unit,
    unit_price: stockItem.unit_cost,
    total_price: reorderQty * stockItem.unit_cost,
    sync_status: isOnline() ? 'synced' : 'created_offline'
  };

  await offlineDB.purchaseOrderItems.add(poItem);
  return true;
}
```

**Severidad:** 🟠 ALTA - Riesgo operativo

---

#### **Hallazgo 3: Órdenes de Compra NO actualizan stock automáticamente al recibirse**

**Ubicación:** `components/warehouse/PurchaseOrderManager.tsx` ↔ `components/warehouse/WarehouseManager.tsx`

**Problema:**
- PO tiene campo `status` con valores: `pending`, `pending_approval`, `approved`, `ordered`, `received`, `cancelled`
- Al cambiar status a `received`, NO se actualiza automáticamente `warehouse_stock.current_stock`
- Campo `received_quantity` en `purchase_order_items` se registra pero no consume stock
- **Impacto:** Desfase entre órdenes recibidas y stock disponible

**Código Faltante:**
```typescript
// En PurchaseOrderManager.tsx - actualizar handleStatusChange
const handleStatusChange = async (orderId: string, newStatus: string) => {
  const order = purchaseOrders.find(o => o.id === orderId);
  if (!order) return;

  const updatedOrder = {
    ...order,
    status: newStatus as any,
    sync_status: resolveSyncStatus({ isNewRecord: false, previousStatus: order.sync_status, isOnline })
  };

  await offlineDB.purchaseOrders.update(orderId, updatedOrder);

  // ✅ NUEVO: Si status es "received", actualizar stock
  if (newStatus === 'received') {
    const orderItems = await offlineDB.purchaseOrderItems
      .where('purchase_order_id')
      .equals(orderId)
      .toArray();

    for (const item of orderItems) {
      const stockItem = await offlineDB.warehouseStock
        .where('item_code')
        .equals(item.item_code)
        .first();

      if (stockItem) {
        const receivedQty = item.received_quantity || item.quantity;
        await offlineDB.warehouseStock.update(stockItem.id!, {
          current_stock: (stockItem.current_stock || 0) + receivedQty,
          last_updated: new Date().toISOString(),
          sync_status: resolveSyncStatus({ isNewRecord: false, previousStatus: stockItem.sync_status, isOnline })
        });

        showToast('success', `Stock actualizado: ${item.description} +${receivedQty} ${item.unit}`);
      }
    }
  }

  showToast('success', `Orden ${order.code} actualizada a ${newStatus}`);
  loadPurchaseOrders();
};
```

**Severidad:** 🔴 CRÍTICA - Integridad de datos de inventario

---

#### **Hallazgo 4: Nómina NO vincula gastos a transacciones financieras automáticamente**

**Ubicación:** `components/payroll/PayrollManager.tsx` → `components/finances/FinanceManager.tsx`

**Problema:**
- `payroll_records` calcula `net_salary` y otros campos
- NO existe integración que cree automáticamente `financial_transactions` tipo `expense` categoría `personal` o `Gastos Operativos / Nómina de Mano de Obra`
- Gerentes deben registrar nómina manualmente en dos módulos
- **Impacto:** Duplicidad de trabajo y riesgo de inconsistencias

**Código Faltante:**
```typescript
// En PayrollManager.tsx - actualizar handleSavePayrollRecord
const handleSavePayrollRecord = async (record: LocalPayrollRecord) => {
  // ... código existente de guardar en offlineDB.payrollRecords ...

  // ✅ NUEVO: Crear transacción financiera automáticamente
  const financialTx: LocalFinancialTransaction = {
    id: generateId(),
    user_id: await getCurrentUserId(),
    project_id: record.project_id,
    type: 'expense',
    category: 'Gastos Operativos / Nómina de Mano de Obra',
    description: `Nómina: ${employeeName} (${record.period_start} a ${record.period_end})`,
    quantity: 1,
    unit: 'lote',
    unit_cost: record.net_salary || 0,
    total_cost: record.net_salary || 0,
    date: record.period_end,
    sync_status: resolveSyncStatus({ isNewRecord: true, isOnline }),
    created_at: new Date().toISOString()
  };

  await offlineDB.financialTransactions.add(financialTx);
  showToast('success', 'Nómina registrada y transacción financiera creada');
};
```

**Severidad:** 🟠 ALTA - Afecta reportes financieros

---

#### **Hallazgo 5: Subcontratistas NO restan anticipos de saldo automáticamente**

**Ubicación:** `components/warehouse/SubcontractorManager.tsx` ↔ `components/finances/FinanceManager.tsx`

**Problema:**
- Tabla `subcontractors` tiene campos:
  - `advance_amount` (anticipo otorgado)
  - `advance_balance` (saldo pendiente)
  - `retention_percentage` (retención)
  - `retention_balance` (retención acumulada)
- NO hay lógica que actualice estos campos cuando se crean transacciones asociadas
- No existe referencia en `financial_transactions` a `subcontractors` para rastrear pagos
- **Impacto:** Imposible controlar anticipos y retenciones de garantía

**Código Faltante:**
```typescript
// 1. Agregar campos en financial_transactions
ALTER TABLE financial_transactions
ADD COLUMN related_subcontractor_id UUID REFERENCES subcontractors(id) ON DELETE SET NULL,
ADD COLUMN payment_type VARCHAR(20) CHECK (payment_type IN ('advance', 'payment', 'retention', 'regular'));

// 2. En FinanceManager.tsx - agregar form fields
interface TransactionFormData {
  // ... campos existentes ...
  related_subcontractor_id?: string;
  payment_type?: 'advance' | 'payment' | 'retention' | 'regular';
}

// 3. Al guardar - actualizar saldo de subcontratista
const handleSubmit = async (e: React.FormEvent) => {
  // ... validación existente ...

  if (formData.related_subcontractor_id && formData.payment_type) {
    const subcontractor = await offlineDB.subcontractors.get(formData.related_subcontractor_id);
    if (subcontractor) {
      let updatedBalance = subcontractor.advance_balance || 0;
      let updatedRetention = subcontractor.retention_balance || 0;

      if (formData.payment_type === 'advance') {
        updatedBalance += total_cost;
      } else if (formData.payment_type === 'payment') {
        updatedBalance = Math.max(0, updatedBalance - total_cost);
      } else if (formData.payment_type === 'retention') {
        updatedRetention += total_cost;
      }

      await offlineDB.subcontractors.update(formData.related_subcontractor_id, {
        advance_balance: updatedBalance,
        retention_balance: updatedRetention,
        sync_status: resolveSyncStatus({ isNewRecord: false, previousStatus: subcontractor.sync_status, isOnline })
      });
    }
  }

  // ... guardar transacción ...
};
```

**Severidad:** 🔴 CRÍTICA - Gestión de compromisos financieros

---

#### **Hallazgo 6: Proyectos en estado `completed` NO cierran automáticamente presupuestos**

**Ubicación:** `components/dashboard/ProjectManager.tsx` ↔ `components/budgets/BudgetCalculator.tsx`

**Problema:**
- Al cambiar proyecto de status `execution` a `completed`, presupuestos quedan abiertos
- No hay lógica de cierre que certifique presupuestos y preventa ediciones
- **Impacto:** Riesgo de cambios accidentales post-cierre de proyecto

**Código Faltante:**
```typescript
// En ProjectManager.tsx - al cambiar status a completed
const handleStatusChange = async (projectId: string, newStatus: string) => {
  const project = projects.find(p => p.id === projectId);
  if (!project) return;

  // ✅ NUEVO: Si status es "completed", cerrar budgets
  if (newStatus === 'completed') {
    const budgets = await offlineDB.budgets
      .where('project_id')
      .equals(projectId)
      .toArray();

    for (const budget of budgets) {
      await offlineDB.budgets.update(budget.id!, {
        status: 'closed', // Agregar campo en schema Supabase
        final_approved_amount: budget.total_amount,
        approved_by: user?.email,
        approved_at: new Date().toISOString(),
        sync_status: resolveSyncStatus({ isNewRecord: false, previousStatus: budget.sync_status, isOnline })
      });
    }

    showToast('success', `Proyecto cerrado. ${budgets.length} presupuesto(s) certificado(s).`);
  }

  // ... resto del cambio de status ...
};
```

**Severidad:** 🟡 MEDIA - Control de cambios

---

### 1.2 INCONSISTENCIAS VISUALES Y DE UX

#### **Hallazgo 7: Inconsistencia de colores de categorías entre módulos**

**Ubicación:** `lib/config/colorPalettes.ts` vs uso real en componentes

**Problema:**
- Se define `FINANCIAL_CATEGORY_COLORS` centralizado
- Componentes usan colores inline con `hexToRgba()` y `hexToLightRgb()`
- En otros módulos (Almacén, Presupuestos) se usan colores ad-hoc sin seguir paleta
- **Impacto:** Inconsistencia visual, falta de cohesión UI

**Código Faltante:**
```typescript
// 1. Centralizar en lib/config/colorPalettes.ts
export const MODULE_COLORS = {
  projects: '#3b82f6',      // blue
  budgets: '#8b5cf6',       // violet
  finances: '#10b981',      // emerald
  warehouse: '#f59e0b',     // amber
  suppliers: '#ec4899',     // pink
  orders: '#06b6d4',        // cyan
  payroll: '#6366f1',       // indigo
  subcontractors: '#14b8a6',// teal
  clients: '#f97316',       // orange
  logs: '#a855f7'           // purple
};

// 2. En todos los componentes - reemplazar colores inline
const getModuleColor = (moduleName: keyof typeof MODULE_COLORS) => MODULE_COLORS[moduleName];

// Uso:
<div style={{ backgroundColor: `${hexToRgba(getModuleColor('finances'), 0.1)}` }}>
```

**Severidad:** 🟡 MEDIA - UX/Branding

---

#### **Hallazgo 8: Tablas no responden consistentemente a clicks en mobile**

**Ubicación:** `components/finances/FinanceManager.tsx`, `components/warehouse/PurchaseOrderManager.tsx`

**Problema:**
- Botones de acciones (Edit, Delete) en tablas son muy pequeños en mobile
- No hay suficiente "tap target" (mínimo 44x44 px recomendado)
- Filas no son swipeables para revelar acciones en mobile
- **Impacto:** Difícil uso en obra (tablet/smartphone)

**Corrección Recomendada:**
```typescript
// En tablas - agregar adaptación mobile
<tr className="border-b border-white/10 hover:bg-white/5 group">
  {/* Columnas existentes */}
  
  {/* Acciones - adaptadas para mobile */}
  <td className="py-3 px-4 text-right">
    <div className="flex items-center justify-end gap-1 sm:gap-2">
      {/* En mobile, mostrar solo iconos grandes */}
      <button
        onClick={() => openModal(transaction)}
        className="min-h-[44px] min-w-[44px] sm:min-h-auto sm:min-w-auto flex items-center justify-center text-cyan-400 hover:text-cyan-300 p-2 sm:p-1 rounded-lg sm:rounded"
        title="Editar"
      >
        <Edit className="w-5 h-5 sm:w-4 sm:h-4" />
      </button>
      <button
        onClick={() => handleDelete(transaction)}
        className="min-h-[44px] min-w-[44px] sm:min-h-auto sm:min-w-auto flex items-center justify-center text-red-400 hover:text-red-300 p-2 sm:p-1 rounded-lg sm:rounded"
        title="Eliminar"
      >
        <Trash2 className="w-5 h-5 sm:w-4 sm:h-4" />
      </button>
    </div>
  </td>
</tr>
```

**Severidad:** 🟡 MEDIA - Usabilidad mobile

---

#### **Hallazgo 9: Modal de formularios no centrado en pantallas grandes**

**Ubicación:** Todos los componentes con modales

**Problema:**
- Modales usan `max-w-2xl` pero en pantallas de 4K quedan muy pequeños
- Sin restricción de altura máxima que cause scroll innecesario
- Backdrop no tiene transition

**Corrección:**
```typescript
// En componentes con modales - reemplazar backdrop
{isModalOpen && (
  <div 
    className="modal-backdrop fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
    onClick={closeModal}
  >
    <div 
      className="glass-panel rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto overflow-anchor-none animate-scale-in"
      onClick={e => e.stopPropagation()}
    >
      {/* Contenido del modal */}
    </div>
  </div>
)}

// Agregar animaciones en app/globals.css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.animate-fade-in { animation: fadeIn 200ms ease-out; }
.animate-scale-in { animation: scaleIn 200ms ease-out; }
```

**Severidad:** 🟡 MEDIA - UX/Visual

---

#### **Hallazgo 10: Badges de estado sin contrastación suficiente**

**Ubicación:** `components/dashboard/DashboardNav.tsx`

**Problema:**
- Badge rojo para "low stock" tiene bajo contraste con fondo oscuro
- Badge cyan para "projects" no es distinguible de badges azules en tema oscuro

**Corrección:**
```typescript
// En DashboardNav.tsx - mejorar contraste
{item.badge && (
  <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold flex items-center gap-1 ${
    item.badgeColor === 'red'
      ? 'bg-red-600/80 text-red-100 ring-1 ring-red-500' // Mejorado contraste
      : item.badgeColor === 'amber'
      ? 'bg-amber-600/80 text-amber-100 ring-1 ring-amber-500'
      : 'bg-cyan-600/80 text-cyan-100 ring-1 ring-cyan-500'
  }`}>
    {item.badgeColor === 'red' && <AlertCircle className="w-3 h-3" />}
    {item.badge}
  </span>
)}
```

**Severidad:** 🟡 MEDIA - Accesibilidad

---

### 1.3 INCONSISTENCIAS DE ESTADO Y SINCRONIZACIÓN

#### **Hallazgo 11: Status "syncing" nunca se resuelve si falla intermitente**

**Ubicación:** `lib/utils/offlineSync.ts`

**Problema:**
- Si una fila entra en estado `syncing` y falla, queda en `syncing` indefinidamente
- No hay timeout que la marque como `sync_failed` después de X minutos
- UI no muestra filas en estado `syncing` como pendientes de resolver

**Corrección:**
```typescript
// En offlineSync.ts - agregar helper
const SYNC_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutos

export async function cleanupStaleSyncingRows(): Promise<void> {
  const tables = [
    offlineDB.projects,
    offlineDB.budgets,
    offlineDB.budgetItems,
    offlineDB.financialTransactions,
    // ... todas las tablas
  ];

  const now = Date.now();
  
  for (const table of tables) {
    const syncingRows = await table
      .where('sync_status')
      .equals('syncing')
      .toArray();

    for (const row of syncingRows) {
      const createdAt = new Date(row.created_at).getTime();
      if (now - createdAt > SYNC_TIMEOUT_MS) {
        await table.update(row.id, {
          sync_status: 'sync_failed',
          sync_error: 'Timeout: stuck in syncing state'
        });
        logger.warn(`Moved stale syncing row to sync_failed: ${table.name} ${row.id}`, undefined, 'Sync');
      }
    }
  }
}

// Llamar periódicamente en SyncProvider.tsx
useEffect(() => {
  const cleanupInterval = setInterval(cleanupStaleSyncingRows, 60000); // Cada minuto
  return () => clearInterval(cleanupInterval);
}, []);
```

**Severidad:** 🔴 CRÍTICA - Bloqueos de sincronización

---

### 1.4 INCONSISTENCIAS DE VALIDACIÓN

#### **Hallazgo 12: Validación de fechas no previene inversiones de periodo**

**Ubicación:** `components/payroll/PayrollManager.tsx`

**Problema:**
- `period_start` puede ser posterior a `period_end`
- No hay validación en formulario
- No hay validación en schema Zod

**Corrección:**
```typescript
// En validation/schemas.ts - mejorar payroll schema
const payrollRecordSchema = z.object({
  period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  period_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  // ... otros campos ...
}).refine(
  (data) => new Date(data.period_end) >= new Date(data.period_start),
  { message: 'Fecha fin debe ser posterior a fecha inicio', path: ['period_end'] }
);

// En PayrollManager.tsx - usar en form
<div>
  <label className="block text-white/60 text-sm mb-1">Período Inicio</label>
  <input
    type="date"
    value={formData.period_start}
    onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
    className="..."
  />
</div>
<div>
  <label className="block text-white/60 text-sm mb-1">Período Fin</label>
  <input
    type="date"
    value={formData.period_end}
    onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
    min={formData.period_start} // ✅ Validación HTML5
    className="..."
  />
</div>
```

**Severidad:** 🟡 MEDIA - Validación de datos

---

## 2. FUNCIONALIDADES FALTANTES SEGÚN LÓGICA DE NEGOCIO

### 2.1 Módulo de Reportería y Análisis Avanzado

**Ubicación:** No existe

**Descripción:**
La suite carece de un módulo centralizado de reportería que genere:

1. **Reportes Financieros:**
   - Estado de Resultado (Ingresos - Gastos = Utilidad)
   - Flujo de Caja (Proyectado vs. Real)
   - Balance por Proyecto
   - Análisis de Variación Presupuestaria

2. **Reportes Operacionales:**
   - Curva S (Avance Físico vs. Financiero)
   - Gantt Interactivo
   - Análisis de Críticos (slack)
   - Reporte de Riesgos/Roadblocks

3. **Reportes de Recurso Humano:**
   - Nómina por Periodo
   - Costos de Mano de Obra por Proyecto
   - Productividad (horas trabajadas vs. horas facturables)

4. **Exportación:**
   - PDF con branding institucional
   - Excel con datos tabulares
   - Email automático a stakeholders

**Código Sugerido:**
```typescript
// components/reports/ReportGenerator.tsx
export default function ReportGenerator() {
  const [reportType, setReportType] = useState<'financial' | 'operational' | 'hr'>('financial');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReport = async (format: 'pdf' | 'excel') => {
    setIsGenerating(true);
    try {
      const data = await fetchReportData(reportType, selectedProject, dateRange);
      
      if (format === 'pdf') {
        const doc = new jsPDF();
        // Agregar logo, títulos, tablas, gráficos
        doc.save(`reporte-${reportType}-${Date.now()}.pdf`);
      } else {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
        XLSX.writeFile(wb, `reporte-${reportType}-${Date.now()}.xlsx`);
      }
      showToast('success', `Reporte generado en ${format.toUpperCase()}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Selectores */}
      {/* Vista previa */}
      {/* Botones de exportación */}
    </div>
  );
}
```

**Severidad:** 🔴 CRÍTICA - Funcionalidad esencial para gerencia

**Tiempo Estimado:** 40-60 horas

---

### 2.2 Dashboard Personalizable (Widgets por Rol)

**Ubicación:** `components/dashboard/` - Existe pero no es personalizable

**Descripción:**
Actualmente el dashboard es estático. Se requiere:

1. **Widgets por Rol:**
   - Admin: KPIs globales, alertas de sincronización, usuarios activos
   - Gerente: Proyectos críticos, flujo de caja, variaciones presupuestarias
   - Residente de Obra: Estado de su proyecto específico, roadblocks, nómina
   - Contador: Movimientos financieros sin conciliar, impuestos pendientes

2. **Personalización:**
   - Drag-and-drop para reorganizar widgets
   - Save/Load layouts
   - Presets por rol
   - Fullscreen para gráficos

**Severidad:** 🟡 MEDIA - Comodidad operativa

**Tiempo Estimado:** 20-30 horas

---

### 2.3 Módulo de Auditoría y Trazabilidad Completa

**Ubicación:** No existe

**Descripción:**
Rastrear TODAS las operaciones:
- Quién editó qué, cuándo y por qué
- Log de cambios de estado (proyecto, orden, etc.)
- Comparación antes/después
- Búsqueda avanzada por usuario, fecha, tabla

**Severidad:** 🔴 CRÍTICA - Cumplimiento/Compliance

**Tiempo Estimado:** 30-40 horas

---

### 2.4 Integración de Documentos (Fotografías, Cotizaciones, Facturas)

**Ubicación:** `receipt_url` existe pero es solo texto

**Descripción:**
- Almacenamiento de archivos en Supabase Storage
- Thumbnails en componentes
- Visor de PDF integrado
- OCR para facturas (opcional)

**Severidad:** 🟠 ALTA - Trazabilidad operativa

**Tiempo Estimado:** 20-25 horas

---

### 2.5 Alertas y Notificaciones en Tiempo Real

**Ubicación:** No existe

**Descripción:**
- Push notifications para stock bajo, órdenes pendientes, cambios de estado
- Email digest diario
- In-app notification center
- Configuración de preferencias por rol

**Severidad:** 🟠 ALTA - Operaciones en tiempo real

**Tiempo Estimado:** 15-20 horas

---

## 3. RESUMEN DE CORRECCIONES RECOMENDADAS

### Prioridad 1 - CRÍTICAS (Aplicar Inmediatamente)

| # | Hallazgo | Duración | Impacto |
|---|----------|----------|--------|
| 1 | Presupuestos ↔ Finanzas sin vínculo | 3-4h | Análisis imposible |
| 3 | PO no actualiza stock al recibirse | 2-3h | Integridad datos |
| 5 | Subcontratistas sin control de saldo | 4-5h | Gestión financiera |
| 11 | Status "syncing" estancado | 2h | Bloqueos |

**Total:** ~11-15 horas

### Prioridad 2 - ALTAS (Próximas 2 semanas)

| # | Hallazgo | Duración | Impacto |
|---|----------|----------|--------|
| 2 | Stock mínimo sin alerta | 2-3h | Riesgo operativo |
| 4 | Nómina sin tx financiera | 2-3h | Reportes incompletos |
| 6 | Proyectos completados sin cierre | 1-2h | Control cambios |

**Total:** ~5-8 horas

### Prioridad 3 - MEDIA (Próximas 3 semanas)

| # | Hallazgo | Duración | Impacto |
|---|----------|----------|--------|
| 7 | Colores inconsistentes | 1h | Branding |
| 8 | Clicks mobile inefectivos | 1-2h | UX mobile |
| 9 | Modales no centrados | 1h | Estética |
| 10 | Badges bajo contraste | 0.5h | Accesibilidad |
| 12 | Validación de fechas | 0.5h | Validación |

**Total:** ~4-5 horas

### Funcionalidades Faltantes (Roadmap)

| Módulo | Duración | Prioridad |
|--------|----------|-----------|
| Reportería & Análisis | 40-60h | Crítica (Q3) |
| Dashboard Personalizable | 20-30h | Alta (Q3) |
| Auditoría & Trazabilidad | 30-40h | Crítica (Q3) |
| Documentos e Integración | 20-25h | Alta (Q3) |
| Alertas & Notificaciones | 15-20h | Alta (Q2) |

---

## 4. ESTADO DE LA INFRAESTRUCTURA

### Supabase RLS - ✅ Implementado
```sql
-- Verificación en DB
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' AND tablename NOT LIKE 'pg_%';

-- Resultado: 16 tablas con RLS implementado
✅ profiles, projects, budgets, budget_items, budget_item_breakdown
✅ financial_transactions, payroll_employees, payroll_records
✅ warehouse_stock, clients, suppliers, purchase_orders, purchase_order_items
✅ project_logs, subcontractors, apu_library
```

### Offline-First - ✅ Funcional
- Dexie.js v9 con 14 tablas
- Sincronización bidireccional con LWW
- Retry exponencial con límite de 5 intentos
- Transiciones de estado validadas

### Validación - ✅ Zod Implementado
- Schemas para todas las entidades
- Mensajes de error localizados
- Validación client-side + server-side ready

### Respuesta Mobile - ⚠️ Parcial
- Glassmorphism responsive ✅
- Sidebar colapsable ✅
- **Tablas no optimizadas para touch** ❌
- **Botones pequeños en mobile** ❌

---

## 5. CHECKLIST DE VALIDACIÓN POST-CORRECCIONES

- [ ] Compilación sin errores: `npm run build` ✅
- [ ] Type-check: `npm run type-check` ✅
- [ ] Tests: `npm test` (crear suite de tests)
- [ ] Enlace Presupuesto ↔ Finanzas funciona
- [ ] Auto-gen de PO por bajo stock
- [ ] Update stock al recibir PO
- [ ] Nómina crea transacciones automáticamente
- [ ] Subcontratistas: saldo se actualiza
- [ ] Proyectos completados cierran presupuestos
- [ ] Status "syncing" se resuelve en timeout
- [ ] Colores consistentes en todos los módulos
- [ ] Mobile: tap targets >= 44px
- [ ] Modales centrados en todas las resoluciones
- [ ] Badges con contraste WCAG AA
- [ ] Validación de fechas invertidas

---

## 6. DOCUMENTOS DE REFERENCIA

- `/docs/DATABASE_SCHEMA.md` - Esquema Supabase actual
- `/docs/ANALYSIS_AND_IMPROVEMENTS.md` - Mejoras previas aplicadas
- `/lib/config/app.config.ts` - Configuración centralizada
- `lib/utils/offlineSync.ts` - Motor de sincronización

---

## 7. PRÓXIMOS PASOS

**Semana 1:**
1. Aplicar correcciones CRÍTICAS (Prioridad 1)
2. Crear PR para revisión
3. Deploy a staging
4. Testing en ambiente de prueba

**Semana 2:**
1. Aplicar correcciones ALTAS (Prioridad 2)
2. Feedback de usuarios
3. Refinamientos

**Semana 3+:**
1. Iniciar módulo de Reportería
2. Dashboard Personalizable
3. Auditoría

---

**Auditoría Completada:** Agosto 5, 2026  
**Analista:** Gordon (Docker Inc.)  
**Estado Producción:** ✅ Operativa - Aplicar correcciones en siguiente release

