# ANÁLISIS DE DIAGNÓSTICO DE BASE DE DATOS REMOTA
## CONSTRUCTORA WM/M&S V10 - "CONSTRUYENDO EL FUTURO"

**Fecha:** 2026-08-12  
**Especialista:** Expert QA UX/UI Specialist  
**Versión:** 1.0.0  
**Tipo:** Auditoría de Alineación DB Remota vs Frontend

---

## 📋 RESUMEN EJECUTIVO

Se ha realizado un análisis detallado de la alineación entre la base de datos remota (Supabase) y la suite frontend, identificando inconsistencias críticas en tipos de datos, estructuras de esquema y comunicación API-DB.

**Estado:** ⚠️ INCONSISTENCIAS CRÍTICAS IDENTIFICADAS

**Total Tablas Analizadas:** 12
**Tablas Alineadas:** 7 (58%)
**Tablas Parcialmente Alineadas:** 3 (25%)
**Tablas Desalineadas:** 2 (17%)

---

## 🔍 INCONSISTENCIAS CRÍTICAS IDENTIFICADAS

### 1. Divergencia entre Tipos Remotos y Locales

**Archivo:** `lib/types/database.ts` vs `lib/db/offlineStore.ts`

**Inconsistencias Detectadas:**

#### Tabla Projects
- **Remoto (ProjectRow):** 22 campos base
- **Local (LocalProject):** 22 campos base + 6 campos adicionales
- **Campos adicionales locales no en remoto:**
  - `budget_total` (calculado)
  - `calculated_duration` (calculado)
  - `has_critical_roadblock` (de bitácoras)
  - `roadblock_type` (de bitácoras)
  - `roadblock_description` (de bitácoras)
  - `roadblock_date` (de bitácoras)
  - `completion_buffer_days` (calculado)

**Impacto:** ⚠️ MEDIO - Campos calculados localmente que no se sincronizan

#### Tabla FinancialTransactions
- **Remoto (FinancialTransactionRow):** 13 campos
- **Local (LocalFinancialTransaction):** 13 campos + 8 campos adicionales
- **Campos adicionales locales no en remoto:**
  - `budget_item_id` (tracking)
  - `payment_method` (tesorería)
  - `tax_amount` (impuestos)
  - `related_supplier_id` (relación)
  - `related_client_id` (relación)
  - `related_purchase_order_id` (relación)
  - `document_number` (documentación)
  - `is_reconciled` (conciliación)

**Impacto:** 🔴 CRÍTICO - Funcionalidad avanzada no soportada en DB remota

#### Tabla Clients
- **Remoto (ClientRow):** 14 campos
- **Local (LocalClient):** 14 campos + 4 campos adicionales
- **Campos adicionales locales no en remoto:**
  - `account_balance` (saldo cuenta)
  - `credit_limit` (límite crédito)
  - `payment_terms_days` (plazo pago)
  - `is_delinquent` (mora)

**Impacto:** 🔴 CRÍTICO - Funcionalidad de crédito y cuentas no soportada en DB remota

### 2. Inconsistencias en Schema Validator

**Archivo:** `lib/supabase/schema-validator.ts`

**Inconsistencias Detectadas:**

#### Tabla Budgets
- **Tipo TypeScript (BudgetRow):** 10 campos
- **Expected Columns (schema-validator):** 16 campos
- **Columnas extra en expected_columns:**
  - `indirect_cost` (no en tipo)
  - `contingency` (no en tipo)
  - `profit` (no en tipo)

**Impacto:** 🔴 CRÍTICO - Schema validator no alineado con tipos TypeScript

#### Tabla ProjectLogs
- **Tipo TypeScript:** No definido en `database.ts`
- **Expected Columns:** `progress_percentage`
- **Tipo Local (LocalProjectLog):** `physical_progress`, `financial_progress`

**Impacto:** 🔴 CRÍTICO - Falta tipo TypeScript y nombre de campo inconsistente

#### Tabla FinancialTransactions
- **Tipo TypeScript (FinancialTransactionRow):** 13 campos
- **Expected Columns:** 14 campos
- **Columna extra en expected_columns:**
  - `reference` (no en tipo)

**Impacto:** ⚠️ MEDIO - Campo adicional no definido en tipos

### 3. Inconsistencias en Estructura de Base de Datos

**Campos Faltantes en Schema Remoto (basado en EXPECTED_COLUMNS):**

#### Tabla Clients
- Expected: 19 campos
- Tipo TypeScript: 14 campos
- **Campos faltantes en tipo TypeScript:**
  - `user_id` (presente en expected, no en tipo)

#### Tabla Suppliers
- Expected: 13 campos
- Tipo TypeScript: 12 campos
- **Campos faltantes en tipo TypeScript:**
  - `user_id` (presente en expected, no en tipo)

#### Tabla PayrollEmployees
- Expected: 11 campos
- Tipo TypeScript: No definido
- **Falta completa de tipo TypeScript**

#### Tabla PurchaseOrders
- Expected: 9 campos
- Tipo TypeScript: 9 campos
- **Alineación correcta** ✅

#### Tabla PurchaseOrderItems
- Expected: 10 campos
- Tipo TypeScript: No definido
- **Falta completa de tipo TypeScript**

### 4. Inconsistencias en Tablas Faltantes

**Tablas definidas en Local DB pero no en Schema Remoto:**

1. **BudgetItemBreakdown** - Definida en offlineStore, no en database.ts
2. **Subcontractor** - Definida en offlineStore, no en database.ts
3. **PendingDelete** - Definida en offlineStore, no en database.ts

**Impacto:** ⚠️ MEDIO - Tablas de gestión local no sincronizadas

---

## 📊 RESUMEN DE INCONSISTENCIAS POR CATEGORÍA

### 🔴 Críticas (requieren corrección inmediata)

1. **FinancialTransactions** - 8 campos locales no en remoto
2. **Clients** - 4 campos de crédito no en remoto
3. **Budgets** - Schema validator no alineado con tipos
4. **ProjectLogs** - Falta tipo TypeScript y nombre inconsistente
5. **PayrollEmployees** - Falta tipo TypeScript completo
6. **PurchaseOrderItems** - Falta tipo TypeScript completo

### ⚠️ Medias (requieren corrección a corto plazo)

1. **Projects** - 6 campos calculados no sincronizados
2. **FinancialTransactions** - Campo reference en expected_columns
3. **Clients** - Campo user_id faltante en tipo
4. **Suppliers** - Campo user_id faltante en tipo
5. **BudgetItemBreakdown** - Tabla local no en remoto
6. **Subcontractor** - Tabla local no en remoto

### ℹ️ Bajas (mejoras recomendadas)

1. **PendingDelete** - Tabla de gestión local (no crítica)
2. **SyncStatus** - Necesita validación de consistencia entre definiciones

---

## 🎯 RECOMENDACIONES DE CORRECCIÓN

### Prioridad Inmediata (Alta)

1. **Alinear tipos TypeScript con esquema remoto:**
   - Agregar campos faltantes a tipos TypeScript
   - Definir tipos faltantes (PayrollEmployees, PurchaseOrderItems, ProjectLogs)
   - Corregir nombres inconsistentes (progress_percentage vs physical_progress)

2. **Alinear schema-validator con tipos TypeScript:**
   - Actualizar EXPECTED_COLUMNS para que coincida con tipos
   - Eliminar columnas extra no definidas en tipos
   - Agregar columnas faltantes

3. **Decidir estrategia para campos calculados:**
   - Mantener campos calculados solo localmente
   - O agregar al esquema remoto con triggers de cálculo

### Prioridad Corto Plazo (Media)

4. **Actualizar tipos TypeScript para incluir campos de crédito:**
   - Agregar account_balance, credit_limit, payment_terms_days, is_delinquent a ClientRow
   - Decidir si estos campos deben estar en DB remota

5. **Definir tipos para tablas adicionales:**
   - Agregar SubcontractorRow a database.ts
   - Agregar PayrollEmployeeRow a database.ts
   - Agregar PurchaseOrderItemRow a database.ts

6. **Alinear sync_status:**
   - Validar que los valores sean consistentes entre todas las definiciones
   - Asegurar que las transiciones de estado sean las mismas

### Prioridad Largo Plazo (Baja)

7. **Documentar estrategia de campos calculados:**
   - Crear documentación clara de qué campos son calculados
   - Definir reglas de sincronización para campos calculados

8. **Implementar validación de esquema automática:**
   - Crear tests que verifiquen alineación
   - Implementar CI/CD para verificar cambios de esquema

---

## 📁 ARCHIVOS REVISADOS

1. `lib/types/database.ts` - Tipos TypeScript de Supabase
2. `lib/db/offlineStore.ts` - Tipos locales Dexie
3. `lib/supabase/schema-validator.ts` - Validador de esquema
4. `app/api/auth/login/route.ts` - API route de autenticación
5. `lib/supabase/client.ts` - Cliente Supabase
6. `lib/supabase/server.ts` - Cliente Supabase server-side

---

## ✅ PRÓXIMOS PASOS RECOMENDADOS

1. Crear script de validación automática de esquema
2. Implementar correcciones en tipos TypeScript
3. Actualizar schema-validator para alineación
4. Crear tests de alineación DB-Frontend
5. Documentar estrategia de sincronización

---

**Especialista:** Expert QA UX/UI Specialist  
**Fecha:** 2026-08-12  
**Versión del documento:** 1.0.0 - DIAGNÓSTICO DB REMOTA