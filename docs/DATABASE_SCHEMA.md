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
    'administrativo', 'personal', 'transporte', 'fijos', 'hogar', 'aporte', 'trabajos_extra'
);
```

---

## 2. TABLES

### 2.1 profiles

| Columna       | Tipo                        | Default              | Restricciones               |
|---------------|-----------------------------|----------------------|-----------------------------|
| id            | UUID                        |                      | PK → auth.users(id) CASCADE |
| full_name     | TEXT                        | NOT NULL             |                             |
| role          | user_role                   | 'engineer'           |                             |
| company_name  | TEXT                        | 'CONSTRUCTORA WM/M&S' |                           |
| avatar_url    | TEXT                        | NULL                 |                             |
| phone         | TEXT                        | NULL                 |                             |
| created_at    | TIMESTAMP WITH TIME ZONE    | NOW()                |                             |

### 2.2 projects

| Columna            | Tipo                     | Default     | Restricciones               |
|--------------------|--------------------------|-------------|------------------------------|
| id                 | UUID                     | gen_random_uuid() | PK                  |
| code               | VARCHAR(50)              |             | UNIQUE NOT NULL              |
| name               | TEXT                     | NOT NULL    |                              |
| client_name        | TEXT                     | NOT NULL    |                              |
| client_phone       | TEXT                     | NULL        |                              |
| client_email       | TEXT                     | NULL        |                              |
| location           | TEXT                     | NOT NULL    |                              |
| typology           | project_typology         | 'residential' |                            |
| area_m2            | NUMERIC(10,2)            | 0           | NOT NULL                     |
| quality_level      | VARCHAR(20)              | NULL        | CHECK IN ('basic','moderate','premium') |
| status             | project_status           | 'planning'  |                              |
| start_date         | DATE                     | NULL        |                              |
| estimated_end_date | DATE                     | NULL        |                              |
| duration_days      | INT                      | 0           |                              |
| total_budget       | NUMERIC(14,2)            | 0           |                              |
| sync_status        | TEXT                     | 'synced'    | CHECK IN ('synced','created_offline','updated_offline') |
| created_at         | TIMESTAMP WITH TIME ZONE | NOW()       |                              |
| updated_at         | TIMESTAMP WITH TIME ZONE | NOW()       |                              |

**Índices:** `idx_projects_status`, `idx_projects_typology`

### 2.3 apu_library

| Columna              | Tipo            | Default       | Restricciones          |
|----------------------|-----------------|---------------|------------------------|
| id                   | UUID            | gen_random_uuid() | PK               |
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
| project_id             | UUID                     |         | FK → projects(id) ON DELETE CASCADE    |
| version                | INT                      | 1       |                                        |
| direct_cost            | NUMERIC(14,2)            | 0       |                                        |
| indirect_percentage    | NUMERIC(5,2)             | 15.0    |                                        |
| contingency_percentage | NUMERIC(5,2)             | 5.0     |                                        |
| profit_percentage      | NUMERIC(5,2)             | 10.0    |                                        |
| total_amount           | NUMERIC(14,2)            | 0       |                                        |
| duration_days          | INT                      | 0       |                                        |
| sync_status            | TEXT                     | 'synced'| CHECK IN ('synced','created_offline','updated_offline') |
| created_at             | TIMESTAMP WITH TIME ZONE | NOW()   |                                        |
| updated_at             | TIMESTAMP WITH TIME ZONE | NOW()   |                                        |

**Índice:** `idx_budgets_project_id`

### 2.5 budget_items

| Columna     | Tipo                     | Default | Restricciones                              |
|-------------|--------------------------|---------|---------------------------------------------|
| id          | UUID                     | gen_random_uuid() | PK                          |
| budget_id   | UUID                     |         | FK → budgets(id) ON DELETE CASCADE          |
| parent_id   | UUID                     | NULL    | FK → budget_items(id) ON DELETE CASCADE     |
| item_order  | INT                      | NOT NULL|                                              |
| code        | VARCHAR(30)              | NOT NULL|                                              |
| description | TEXT                     | NOT NULL|                                              |
| unit        | VARCHAR(20)              | NOT NULL|                                              |
| quantity    | NUMERIC(12,2)            | 0       |                                              |
| unit_cost   | NUMERIC(12,2)            | 0       |                                              |
| total_cost  | NUMERIC(14,2)            | 0       |                                              |
| is_custom   | BOOLEAN                  | FALSE   |                                              |
| length_m    | NUMERIC(8,2)             | NULL    |                                              |
| width_m     | NUMERIC(8,2)             | NULL    |                                              |
| depth_m     | NUMERIC(8,2)             | NULL    |                                              |
| height_m    | NUMERIC(8,2)             | NULL    |                                              |
| slab_type   | VARCHAR(50)              | NULL    |                                              |
| sync_status | TEXT                     | 'synced'| CHECK IN ('synced','created_offline','updated_offline') |
| created_at  | TIMESTAMP WITH TIME ZONE | NOW()   |                                              |
| updated_at  | TIMESTAMP WITH TIME ZONE | NOW()   |                                              |

**Índices:** `idx_budget_items_budget_id`, `idx_budget_items_parent_id`

### 2.6 budget_item_breakdown

| Columna            | Tipo                     | Default | Restricciones                                      |
|--------------------|--------------------------|---------|-----------------------------------------------------|
| id                 | UUID                     | gen_random_uuid() | PK                              |
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
| sync_status | TEXT                     | 'synced'      | CHECK IN ('synced','created_offline','updated_offline') |
| created_at  | TIMESTAMP WITH TIME ZONE | NOW()         |                                                  |
| updated_at  | TIMESTAMP WITH TIME ZONE | NOW()         |                                                  |

**Índices:** `idx_financial_transactions_project_id`, `idx_financial_transactions_date`, `idx_financial_transactions_type`

### 2.8 payroll_employees

| Columna     | Tipo                     | Default | Restricciones                                   |
|-------------|--------------------------|---------|--------------------------------------------------|
| id          | UUID                     | gen_random_uuid() | PK                                           |
| name        | TEXT                     | NOT NULL|                                                  |
| position    | TEXT                     | NOT NULL|                                                  |
| daily_rate  | NUMERIC(15,2)            | NOT NULL|                                                  |
| category    | TEXT                     | NOT NULL| CHECK IN ('obrero','empleado')                   |
| department  | TEXT                     | NOT NULL|                                                  |
| hire_date   | DATE                     | NOT NULL|                                                  |
| active      | BOOLEAN                  | TRUE    |                                                  |
| sync_status | TEXT                     | 'synced'| CHECK IN ('synced','created_offline','updated_offline') |
| created_at  | TIMESTAMP WITH TIME ZONE | NOW()   |                                                  |
| updated_at  | TIMESTAMP WITH TIME ZONE | NOW()   |                                                  |

### 2.9 payroll_records

| Columna             | Tipo                     | Default | Restricciones                                   |
|---------------------|--------------------------|---------|--------------------------------------------------|
| id                  | UUID                     | gen_random_uuid() | PK                                           |
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
| sync_status         | TEXT                     | 'synced'| CHECK IN ('synced','created_offline','updated_offline') |
| created_at          | TIMESTAMP WITH TIME ZONE | NOW()   |                                                  |
| updated_at          | TIMESTAMP WITH TIME ZONE | NOW()   |                                                  |

**Índices:** `idx_payroll_records_employee_id`, `idx_payroll_records_period`

### 2.10 warehouse_stock

| Columna           | Tipo                     | Default | Restricciones                                   |
|-------------------|--------------------------|---------|--------------------------------------------------|
| id                | UUID                     | gen_random_uuid() | PK                                           |
| item_code         | TEXT                     | NOT NULL| UNIQUE NOT NULL                                  |
| description       | TEXT                     | NOT NULL|                                                  |
| unit              | TEXT                     | NOT NULL|                                                  |
| current_stock     | NUMERIC(10,2)            | 0       |                                                  |
| minimum_threshold | NUMERIC(10,2)            | 10      |                                                  |
| unit_cost         | NUMERIC(15,2)            | 0       |                                                  |
| sync_status       | TEXT                     | 'synced'| CHECK IN ('synced','created_offline','updated_offline') |
| created_at        | TIMESTAMP WITH TIME ZONE | NOW()   |                                                  |
| updated_at        | TIMESTAMP WITH TIME ZONE | NOW()   |                                                  |

**Índice:** `idx_warehouse_stock_item_code`

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
warehouse_stock
```

---

## 6. OFFLINE-FIRST ARCHITECTURE

Cada tabla incluye un campo `sync_status` con valores:
- `synced`: Datos sincronizados con Supabase
- `created_offline`: Creado localmente, pendiente de subir
- `updated_offline`: Actualizado localmente, pendiente de sincronizar

El motor de sincronización bidireccional (offline-first) está implementado en `lib/utils/offlineSync.ts` usando Dexie.js (IndexedDB) como almacén local y Supabase como almacén remoto.
