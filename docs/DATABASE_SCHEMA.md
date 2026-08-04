# CONSTRUCTORA WM/M&S - DATABASE SCHEMA

**Slogan:** "CONSTRUYENDO EL FUTURO"
**Plataforma:** Supabase (PostgreSQL 17)
**Project Ref:** `yibjsruoxjlgdnkgylld`

---

## 1. ENUMS

```sql
CREATE TYPE user_role AS ENUM ('admin', 'director', 'engineer', 'architect', 'resident', 'warehouse', 'client');
CREATE TYPE project_status AS ENUM ('planning', 'execution', 'paused', 'completed');
CREATE TYPE project_typology AS ENUM ('residential', 'commercial', 'industrial', 'civil', 'public');
CREATE TYPE expense_category AS ENUM (
    'materiales', 'mano_de_obra', 'herramienta', 'sub_contrato', 
    'administrativo', 'personal', 'transporte', 'fijos', 'hogar', 'aporte', 'trabajos_extra',
    'Gastos Operativos / Nómina de Mano de Obra'
);
CREATE TYPE order_status AS ENUM ('pending', 'approved', 'ordered', 'received', 'cancelled');
CREATE TYPE client_type AS ENUM ('individual', 'corporate');
```

---

## 2. TABLES

**NOTA:** Todas las tablas incluyen una columna `user_id` para aislamiento de tenants (FK → auth.users(id) ON DELETE CASCADE)

### 2.1 profiles

| Columna       | Tipo                        | Default              | Restricciones               |
|---------------|-----------------------------|----------------------|-----------------------------|
| id            | UUID                        |                      | PK → auth.users(id) CASCADE |
| user_id       | UUID                        |                      | FK → auth.users(id) CASCADE |
| full_name     | TEXT                        | NOT NULL             |                             |
| role          | user_role                   | 'engineer'           |                             |
| company_name  | TEXT                        | 'CONSTRUCTORA WM/M&S' |                           |
| avatar_url    | TEXT                        | NULL                 |                             |
| phone         | TEXT                        | NULL                 |                             |
| created_at    | TIMESTAMP WITH TIME ZONE    | NOW()                |                             |

### 2.2 projects

| Columna               | Tipo                     | Default     | Restricciones               |
|-----------------------|--------------------------|-------------|------------------------------|
| id                    | UUID                     | gen_random_uuid() | PK                  |
| user_id               | UUID                     |             | FK → auth.users(id) ON DELETE CASCADE |
| code                  | VARCHAR(50)              |             | UNIQUE NOT NULL              |
| name                  | TEXT                     | NOT NULL    |                              |
| client_name           | TEXT                     | NOT NULL    |                              |
| client_phone          | TEXT                     | NULL        |                              |
| client_email          | TEXT                     | NULL        |                              |
| location              | TEXT                     | NOT NULL    |                              |
| typology              | project_typology         | 'residential' |                            |
| area_m2               | NUMERIC(10,2)            | 0           | NOT NULL                     |
| quality_level         | VARCHAR(20)              | NULL        | CHECK IN ('basic','moderate','premium') |
| status                | project_status           | 'planning'  |                              |
| start_date            | DATE                     | NULL        |                              |
| estimated_end_date    | DATE                     | NULL        |                              |
| duration_days         | INT                      | 0           |                              |
| total_budget          | NUMERIC(14,2)            | 0           |                              |
| budget_total          | NUMERIC(14,2)            | NULL        | (campo calculado localmente) |
| calculated_duration   | INT                      | NULL        | (campo calculado localmente) |
| has_critical_roadblock| BOOLEAN                  | FALSE       | (campo calculado localmente) |
| roadblock_type        | VARCHAR(20)              | NULL        | (campo calculado localmente) |
| roadblock_description | TEXT                     | NULL        | (campo calculado localmente) |
| roadblock_date        | DATE                     | NULL        | (campo calculado localmente) |
| completion_buffer_days| INT                      | NULL        | (campo calculado localmente) |
| sync_status           | TEXT                     | 'synced'    | CHECK IN ('synced','created_offline','updated_offline','syncing','pending','sync_failed') |
| created_at            | TIMESTAMP WITH TIME ZONE | NOW()       |                              |
| updated_at            | TIMESTAMP WITH TIME ZONE | NOW()       |                              |

**Índices:** `idx_projects_status`, `idx_projects_typology`, `idx_projects_user_id`

### 2.3 apu_library

| Columna              | Tipo            | Default       | Restricciones          |
|----------------------|-----------------|---------------|------------------------|
| id                   | UUID            | gen_random_uuid() | PK               |
| user_id              | UUID            |               | FK → auth.users(id) ON DELETE CASCADE |
| code                 | VARCHAR(20)     |               | UNIQUE NOT NULL        |
| typology             | VARCHAR(20)     | 'residential' |                        |
| chronological_order  | INT             | NOT NULL      |                        |
| description          | TEXT            | NOT NULL      |                        |
| unit                 | VARCHAR(20)     | NOT NULL      |                        |
| default_yield_per_day| NUMERIC(10,2)   | 1.0           |                        |
| category             | VARCHAR(50)     | NOT NULL      |                        |

**Datos iniciales:** 40 items residenciales estándar cargados.

### 2.4 budgets

| Columna                | Tipo                     | Default | Restricciones                         |
|------------------------|--------------------------|---------|----------------------------------------|
| id                     | UUID                     | gen_random_uuid() | PK                  |
| user_id                | UUID                     |         | FK → auth.users(id) ON DELETE CASCADE |
| project_id             | UUID                     |         | FK → projects(id) ON DELETE CASCADE    |
| version                | INT                      | 1       |                                        |
| direct_cost            | NUMERIC(14,2)            | 0       |                                        |
| indirect_percentage    | NUMERIC(5,2)             | 15.0    |                                        |
| contingency_percentage | NUMERIC(5,2)             | 5.0     |                                        |
| profit_percentage      | NUMERIC(5,2)             | 10.0    |                                        |
| total_amount           | NUMERIC(14,2)            | 0       |                                        |
| duration_days          | INT                      | 0       |                                        |
| sync_status            | TEXT                     | 'synced'| CHECK IN ('synced','created_offline','updated_offline','syncing','pending','sync_failed') |
| created_at             | TIMESTAMP WITH TIME ZONE | NOW()   |                                        |
| updated_at             | TIMESTAMP WITH TIME ZONE | NOW()   |                                        |

**Índice:** `idx_budgets_project_id`, `idx_budgets_user_id`

### 2.5 budget_items

| Columna       | Tipo                     | Default | Restricciones                              |
|---------------|--------------------------|---------|---------------------------------------------|
| id            | UUID                     | gen_random_uuid() | PK                          |
| user_id       | UUID                     |         | FK → auth.users(id) ON DELETE CASCADE |
| budget_id     | UUID                     |         | FK → budgets(id) ON DELETE CASCADE          |
| project_id    | UUID                     | NULL    | FK → projects(id) ON DELETE CASCADE (para integración warehouse) |
| parent_id     | UUID                     | NULL    | FK → budget_items(id) ON DELETE CASCADE     |
| item_order    | INT                      | NOT NULL|                                              |
| code          | VARCHAR(30)              | NOT NULL|                                              |
| description   | TEXT                     | NOT NULL|                                              |
| unit          | VARCHAR(20)              | NOT NULL|                                              |
| quantity      | NUMERIC(12,2)            | 0       |                                              |
| unit_cost     | NUMERIC(12,2)            | 0       |                                              |
| total_cost    | NUMERIC(14,2)            | 0       |                                              |
| is_custom     | BOOLEAN                  | FALSE   |                                              |
| length_m      | NUMERIC(8,2)             | NULL    |                                              |
| width_m       | NUMERIC(8,2)             | NULL    |                                              |
| depth_m       | NUMERIC(8,2)             | NULL    |                                              |
| height_m      | NUMERIC(8,2)             | NULL    |                                              |
| slab_type     | VARCHAR(50)              | NULL    |                                              |
| category      | VARCHAR(50)              | NULL    | (para integración warehouse) |
| unidades_comerciales_estimadas | NUMERIC(12,2) | NULL | (unidades comerciales para warehouse) |
| actual_consumption | NUMERIC(12,2)      | NULL    | (consumo real desde warehouse) |
| consumption_variance | NUMERIC(12,2)       | NULL    | (diferencia estimado vs real) |
| sync_status   | TEXT                     | 'synced'| CHECK IN ('synced','created_offline','updated_offline','syncing','pending','sync_failed') |
| created_at    | TIMESTAMP WITH TIME ZONE | NOW()   |                                              |
| updated_at    | TIMESTAMP WITH TIME ZONE | NOW()   |                                              |

**Índices:** `idx_budget_items_budget_id`, `idx_budget_items_parent_id`, `idx_budget_items_project_id`, `idx_budget_items_category`

### 2.6 budget_item_breakdown

| Columna            | Tipo                     | Default | Restricciones                                      |
|--------------------|--------------------------|---------|-----------------------------------------------------|
| id                 | UUID                     | gen_random_uuid() | PK                              |
| user_id            | UUID                     |         | FK → auth.users(id) ON DELETE CASCADE |
| budget_item_id     | UUID                     |         | FK → budget_items(id) ON DELETE CASCADE             |
| resource_type      | VARCHAR(20)              |         | CHECK IN ('material','labor','equipment','subcontract') |
| code               | VARCHAR(30)              | NULL    |                                                     |
| description        | TEXT                     | NOT NULL|                                                     |
| unit               | VARCHAR(20)              | NOT NULL|                                                     |
| quantity_unitary   | NUMERIC(10,4)            | NOT NULL|                                                     |
| total_quantity     | NUMERIC(12,2)            | NOT NULL|                                                     |
| unit_price         | NUMERIC(12,2)            | NOT NULL|                                                     |
| waste_percentage   | NUMERIC(5,2)             | 5.0     |                                                     |
| total_price        | NUMERIC(14,2)            | NOT NULL|                                                     |
| created_at         | TIMESTAMP WITH TIME ZONE | NOW()   |                                                     |

### 2.7 financial_transactions

| Columna     | Tipo                     | Default       | Restricciones                                   |
|-------------|--------------------------|---------------|--------------------------------------------------|
| id          | UUID                     | gen_random_uuid() | PK                                           |
| user_id     | UUID                     |               | FK → auth.users(id) ON DELETE CASCADE |
| project_id  | UUID                     | NULL          | FK → projects(id) ON DELETE SET NULL             |
| type        | VARCHAR(10)              |               | CHECK IN ('income','expense') NOT NULL           |
| category    | expense_category         |               | NOT NULL                                         |
| description | TEXT                     | NOT NULL      |                                                  |
| quantity    | NUMERIC(10,2)            | 1             |                                                  |
| unit        | VARCHAR(20)              | 'unid'        |                                                  |
| unit_cost   | NUMERIC(12,2)            | NOT NULL      |                                                  |
| total_cost  | NUMERIC(14,2)            | NOT NULL      |                                                  |
| date        | DATE                     | CURRENT_DATE  | NOT NULL                                         |
| receipt_url | TEXT                     | NULL          |                                                  |
| sync_status | TEXT                     | 'synced'      | CHECK IN ('synced','created_offline','updated_offline','syncing','pending','sync_failed') |
| created_at  | TIMESTAMP WITH TIME ZONE | NOW()         |                                                  |
| updated_at  | TIMESTAMP WITH TIME ZONE | NOW()         |                                                  |

**Índices:** `idx_financial_transactions_project_id`, `idx_financial_transactions_date`, `idx_financial_transactions_type`, `idx_financial_transactions_user_id`

### 2.8 payroll_employees

| Columna     | Tipo                     | Default | Restricciones                                   |
|-------------|--------------------------|---------|--------------------------------------------------|
| id          | UUID                     | gen_random_uuid() | PK                                           |
| user_id     | UUID                     |         | FK → auth.users(id) ON DELETE CASCADE |
| name        | TEXT                     | NOT NULL|                                                  |
| position    | TEXT                     | NOT NULL|                                                  |
| daily_rate  | NUMERIC(15,2)            | NOT NULL|                                                  |
| category    | TEXT                     | NOT NULL| CHECK IN ('obrero','empleado')                   |
| department  | TEXT                     | NOT NULL|                                                  |
| hire_date   | DATE                     | NOT NULL|                                                  |
| active      | BOOLEAN                  | TRUE    |                                                  |
| sync_status | TEXT                     | 'synced'| CHECK IN ('synced','created_offline','updated_offline','syncing','pending','sync_failed') |
| created_at  | TIMESTAMP WITH TIME ZONE | NOW()   |                                                  |
| updated_at  | TIMESTAMP WITH TIME ZONE | NOW()   |                                                  |

**Índices:** `idx_payroll_employees_user_id`

### 2.9 payroll_records

| Columna             | Tipo                     | Default | Restricciones                                   |
|---------------------|--------------------------|---------|--------------------------------------------------|
| id                  | UUID                     | gen_random_uuid() | PK                                           |
| user_id             | UUID                     |         | FK → auth.users(id) ON DELETE CASCADE |
| project_id          | UUID                     | NULL    | FK → projects(id) ON DELETE CASCADE (para integración con proyectos) |
| employee_id         | UUID                     |         | FK → payroll_employees(id) ON DELETE CASCADE     |
| period_start        | DATE                     | NOT NULL|                                                  |
| period_end          | DATE                     | NOT NULL|                                                  |
| days_worked         | INT                      | NOT NULL|                                                  |
| overtime_hours      | NUMERIC(10,2)            | 0       |                                                  |
| overtime_rate       | NUMERIC(15,2)            | 0       |                                                  |
| bonuses             | NUMERIC(15,2)            | 0       |                                                  |
| deductions          | NUMERIC(15,2)            | 0       |                                                  |
| base_salary         | NUMERIC(15,2)            | NULL    |                                                  |
| overtime_pay        | NUMERIC(15,2)            | NULL    |                                                  |
| gross_salary        | NUMERIC(15,2)            | NULL    |                                                  |
| igss_deduction      | NUMERIC(15,2)            | NULL    |                                                  |
| aguinaldo_provision | NUMERIC(15,2)            | NULL    |                                                  |
| vacaciones_provision| NUMERIC(15,2)            | NULL    |                                                  |
| net_salary          | NUMERIC(15,2)            | NULL    |                                                  |
| total_hours         | NUMERIC(10,2)            | NULL    | (total horas trabajadas: regular + overtime) |
| hourly_rate         | NUMERIC(15,2)            | NULL    | (tarifa por hora calculada de daily_rate) |
| task_allocation_id  | UUID                     | NULL    | (referencia a budget item siendo trabajado) |
| planned_hours       | NUMERIC(10,2)            | NULL    | (horas planificadas para la tarea) |
| budget_item_id      | UUID                     | NULL    | FK → budget_items(id) ON DELETE SET NULL (para detección overrun) |
| cost_overrun_amount | NUMERIC(15,2)            | NULL    | (calculo de overrun de costo) |
| is_overrun_warning_fired | BOOLEAN           | FALSE   | (flag para prevenir warnings duplicados) |
| sync_status         | TEXT                     | 'synced'| CHECK IN ('synced','created_offline','updated_offline','syncing','pending','sync_failed') |
| created_at          | TIMESTAMP WITH TIME ZONE | NOW()   |                                                  |
| updated_at          | TIMESTAMP WITH TIME ZONE | NOW()   |                                                  |

**Índices:** `idx_payroll_records_employee_id`, `idx_payroll_records_period`, `idx_payroll_records_project_id`, `idx_payroll_records_budget_item_id`

### 2.10 warehouse_stock

| Columna              | Tipo                     | Default | Restricciones                                   |
|----------------------|--------------------------|---------|--------------------------------------------------|
| id                   | UUID                     | gen_random_uuid() | PK                                           |
| user_id              | UUID                     |         | FK → auth.users(id) ON DELETE CASCADE |
| project_id           | UUID                     | NULL    | FK → projects(id) ON DELETE CASCADE (para stock por proyecto) |
| item_code            | TEXT                     | NOT NULL| UNIQUE NOT NULL                                  |
| description          | TEXT                     | NOT NULL|                                                  |
| unit                 | TEXT                     | NOT NULL|                                                  |
| current_stock        | NUMERIC(10,2)            | 0       |                                                  |
| minimum_threshold    | NUMERIC(10,2)            | 10      |                                                  |
| unit_cost            | NUMERIC(15,2)            | 0       |                                                  |
| preferred_supplier_id | UUID                     | NULL    | FK → suppliers(id) ON DELETE SET NULL (para auto-PO) |
| auto_generate_po     | BOOLEAN                  | FALSE   | (flag para auto-generar orden de compra) |
| last_po_date         | DATE                     | NULL    | (fecha de última orden de compra) |
| category             | VARCHAR(50)              | NULL    | (para routing a proveedores) |
| sync_status          | TEXT                     | 'synced'| CHECK IN ('synced','created_offline','updated_offline','syncing','pending','sync_failed') |
| created_at           | TIMESTAMP WITH TIME ZONE | NOW()   |                                                  |
| updated_at           | TIMESTAMP WITH TIME ZONE | NOW()   |                                                  |

**Índices:** `idx_warehouse_stock_item_code`, `idx_warehouse_stock_project_id`, `idx_warehouse_stock_category`, `idx_warehouse_stock_preferred_supplier_id`

### 2.11 clients

| Columna           | Tipo                     | Default | Restricciones                                   |
|-------------------|--------------------------|---------|--------------------------------------------------|
| id                | UUID                     | gen_random_uuid() | PK                                           |
| user_id           | UUID                     |         | FK → auth.users(id) ON DELETE CASCADE |
| code              | VARCHAR(20)              |         | UNIQUE NOT NULL                                  |
| name              | TEXT                     | NOT NULL|                                                  |
| company_name      | TEXT                     | NULL    |                                                  |
| phone             | TEXT                     | NOT NULL|                                                  |
| email             | TEXT                     | NULL    |                                                  |
| address           | TEXT                     | NOT NULL|                                                  |
| city              | TEXT                     | NOT NULL|                                                  |
| client_type       | client_type              | 'individual' |                                            |
| notes             | TEXT                     | NULL    |                                                  |
| account_balance   | NUMERIC(15,2)            | 0       | (saldo de cuenta en GTQ)                         |
| credit_limit      | NUMERIC(15,2)            | 0       | (límite de crédito para el cliente)              |
| payment_terms_days| INT                      | 30      | (términos de pago en días)                       |
| is_delinquent     | BOOLEAN                  | FALSE   | (flag para pagos atrasados)                      |
| sync_status       | TEXT                     | 'synced'| CHECK IN ('synced','created_offline','updated_offline','syncing','pending','sync_failed') |
| created_at        | TIMESTAMP WITH TIME ZONE | NOW()   |                                                  |
| updated_at        | TIMESTAMP WITH TIME ZONE | NOW()   |                                                  |

**Índices:** `idx_clients_code`, `idx_clients_user_id`, `idx_clients_is_delinquent`

### 2.12 suppliers

| Columna      | Tipo                     | Default | Restricciones                                   |
|--------------|--------------------------|---------|--------------------------------------------------|
| id           | UUID                     | gen_random_uuid() | PK                                           |
| user_id      | UUID                     |         | FK → auth.users(id) ON DELETE CASCADE |
| code         | VARCHAR(20)              |         | UNIQUE NOT NULL                                  |
| name         | TEXT                     | NOT NULL|                                                  |
| contact_person| TEXT                    | NOT NULL|                                                  |
| phone        | TEXT                     | NOT NULL|                                                  |
| email        | TEXT                     | NULL    |                                                  |
| address      | TEXT                     | NOT NULL|                                                  |
| city         | TEXT                     | NOT NULL|                                                  |
| payment_terms| TEXT                     | NULL    |                                                  |
| notes        | TEXT                     | NULL    |                                                  |
| categories   | TEXT[]                   | NULL    | (array de categorías de materiales que maneja) |
| is_preferred | BOOLEAN                  | FALSE   | (marcar como proveedor preferido para auto-PO)   |
| sync_status  | TEXT                     | 'synced'| CHECK IN ('synced','created_offline','updated_offline','syncing','pending','sync_failed') |
| created_at   | TIMESTAMP WITH TIME ZONE | NOW()   |                                                  |
| updated_at   | TIMESTAMP WITH TIME ZONE | NOW()   |                                                  |

**Índices:** `idx_suppliers_code`, `idx_suppliers_user_id`, `idx_suppliers_is_preferred`

### 2.13 purchase_orders

| Columna               | Tipo                     | Default | Restricciones                                   |
|-----------------------|--------------------------|---------|--------------------------------------------------|
| id                    | UUID                     | gen_random_uuid() | PK                                           |
| user_id               | UUID                     |         | FK → auth.users(id) ON DELETE CASCADE |
| code                  | VARCHAR(20)              |         | UNIQUE NOT NULL                                  |
| supplier_id           | UUID                     |         | FK → suppliers(id) ON DELETE CASCADE            |
| project_id            | UUID                     | NULL    | FK → projects(id) ON DELETE CASCADE (para asociar a proyecto) |
| order_date            | DATE                     | NOT NULL|                                                  |
| expected_delivery_date| DATE                     | NULL    |                                                  |
| status                | order_status             | 'pending' |                                             |
| total_amount          | NUMERIC(15,2)            | 0       |                                                  |
| notes                 | TEXT                     | NULL    |                                                  |
| sync_status           | TEXT                     | 'synced'| CHECK IN ('synced','created_offline','updated_offline','syncing','pending','sync_failed') |
| created_at            | TIMESTAMP WITH TIME ZONE | NOW()   |                                                  |
| updated_at            | TIMESTAMP WITH TIME ZONE | NOW()   |                                                  |

**Índices:** `idx_purchase_orders_code`, `idx_purchase_orders_supplier_id`, `idx_purchase_orders_project_id`, `idx_purchase_orders_status`, `idx_purchase_orders_user_id`

### 2.14 purchase_order_items

| Columna             | Tipo                     | Default | Restricciones                                   |
|---------------------|--------------------------|---------|--------------------------------------------------|
| id                  | UUID                     | gen_random_uuid() | PK                                           |
| user_id             | UUID                     |         | FK → auth.users(id) ON DELETE CASCADE |
| purchase_order_id   | UUID                     |         | FK → purchase_orders(id) ON DELETE CASCADE     |
| item_code           | TEXT                     | NOT NULL|                                                  |
| description         | TEXT                     | NOT NULL|                                                  |
| quantity            | NUMERIC(12,2)            | NOT NULL|                                                  |
| unit                | VARCHAR(20)              | NOT NULL|                                                  |
| unit_price          | NUMERIC(12,2)            | NOT NULL|                                                  |
| total_price         | NUMERIC(14,2)            | NOT NULL|                                                  |
| received_quantity   | NUMERIC(12,2)            | NULL    |                                                  |
| sync_status         | TEXT                     | 'synced'| CHECK IN ('synced','created_offline','updated_offline','syncing','pending','sync_failed') |
| created_at          | TIMESTAMP WITH TIME ZONE | NOW()   |                                                  |
| updated_at          | TIMESTAMP WITH TIME ZONE | NOW()   |                                                  |

**Índices:** `idx_purchase_order_items_purchase_order_id`, `idx_purchase_order_items_item_code`

### 2.15 project_logs

| Columna           | Tipo                     | Default | Restricciones                                   |
|-------------------|--------------------------|---------|--------------------------------------------------|
| id                | UUID                     | gen_random_uuid() | PK                                           |
| user_id           | UUID                     |         | FK → auth.users(id) ON DELETE CASCADE |
| project_id        | UUID                     |         | FK → projects(id) ON DELETE CASCADE             |
| log_date          | DATE                     | NOT NULL|                                                  |
| activity_type     | VARCHAR(20)              |         | CHECK IN ('progress','issue','milestone','note') |
| description       | TEXT                     | NOT NULL|                                                  |
| physical_progress | NUMERIC(5,2)             | NULL    |                                                  |
| financial_progress| NUMERIC(5,2)             | NULL    |                                                  |
| photos            | TEXT[]                   | NULL    |                                                  |
| created_by        | TEXT                     | NOT NULL|                                                  |
| is_critical_roadblock| BOOLEAN                 | FALSE   |                                                  |
| roadblock_category| VARCHAR(20)              | NULL    | CHECK IN ('clima','material','personal','técnico','permiso','financiero','otro') |
| severity          | VARCHAR(10)              | NULL    | CHECK IN ('low','medium','high','critical')       |
| sync_status       | TEXT                     | 'synced'| CHECK IN ('synced','created_offline','updated_offline','syncing','pending','sync_failed') |
| created_at        | TIMESTAMP WITH TIME ZONE | NOW()   |                                                  |
| updated_at        | TIMESTAMP WITH TIME ZONE | NOW()   |                                                  |

**Índices:** `idx_project_logs_project_id`, `idx_project_logs_log_date`, `idx_project_logs_activity_type`, `idx_project_logs_user_id`

---

## 3. TRIGGERS & FUNCTIONS

### 3.1 `update_budget_total()`
- **Disparo:** AFTER INSERT/UPDATE/DELETE ON `budget_items`
- **Acción:** Recalcula `budgets.direct_cost` como SUM de `budget_items.total_cost`, y actualiza `total_amount` como `direct_cost * (1 + indirect%/100 + contingency%/100 + profit%/100)`

### 3.2 `handle_new_user()`
- **Disparo:** AFTER INSERT ON `auth.users`
- **Acción:** Crea automáticamente un registro en `profiles` al registrarse un nuevo usuario

### 3.3 `update_updated_at_column()`
- **Disparo:** BEFORE UPDATE en todas las tablas con `updated_at`
- **Acción:** Actualiza `updated_at = NOW()` automáticamente

---

## 4. ROW LEVEL SECURITY (RLS)

| Tabla                   | Política                               |
|-------------------------|----------------------------------------|
| profiles                | Usuarios ven/editan su propio perfil; admins ven todos |
| projects                | Todos autenticados leen; engineers+ crean/editan; admins borran |
| budgets                 | Todos autenticados leen; engineers+ gestionan |
| budget_items            | Todos autenticados leen; engineers+ gestionan |
| budget_item_breakdown   | Todos autenticados leen; engineers+ gestionan |
| financial_transactions  | Todos autenticados leen; engineers+ gestionan |
| payroll_records         | Todos autenticados leen; engineers+ gestionan |
| warehouse_stock         | Todos autenticados leen; warehouse+ gestionan |
| clients                 | Todos autenticados leen; engineers+ gestionan |
| suppliers               | Todos autenticados leen; warehouse+ gestionan |
| purchase_orders         | Todos autenticados leen; warehouse+ gestionan |
| project_logs            | Todos autenticados leen; engineers+ gestionan |

---

## 5. RELATIONSHIP DIAGRAM

```
auth.users
    │ (1:1)
profiles
    │
projects ────┐
    │         │
    │    financial_transactions
    │         │
budgets ──────┘
    │
budget_items ────┐ (parent_id self-ref)
    │             │
budget_item_breakdown
    │
payroll_employees ──── payroll_records
    │
warehouse_stock ──── suppliers (preferred_supplier_id)
    │
purchase_orders ──── purchase_order_items
    │
clients
    │
project_logs
```

---

## 6. OFFLINE-FIRST ARCHITECTURE

Cada tabla incluye un campo `sync_status` con valores:
- `synced`: Datos sincronizados con Supabase
- `created_offline`: Creado localmente, pendiente de subir
- `updated_offline`: Actualizado localmente, pendiente de sincronizar
- `syncing`: En proceso de sincronización
- `pending`: Pendiente de procesamiento
- `sync_failed`: Falló la sincronización

El motor de sincronización bidireccional (offline-first) está implementado en `lib/utils/offlineSync.ts` usando Dexie.js (IndexedDB) como almacén local y Supabase como almacén remoto.
