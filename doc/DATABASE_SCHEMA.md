# DATABASE SCHEMA & SUPABASE / DEXIE ARCHITECTURE
## CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"

This document defines the complete relational PostgreSQL schema for Supabase and the client-side IndexedDB schema managed via Dexie.js for offline functionality.

---

## 1. SUPABASE (POSTGRESQL) DDL SCRIPT

```sql
-- ENABLE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUMS
CREATE TYPE user_role AS ENUM ('admin', 'director', 'engineer', 'architect', 'resident', 'warehouse', 'client');
CREATE TYPE project_status AS ENUM ('planning', 'execution', 'paused', 'completed');
CREATE TYPE project_typology AS ENUM ('residential', 'commercial', 'industrial', 'civil', 'public');
CREATE TYPE expense_category AS ENUM (
    'materiales', 'mano_de_obra', 'herramienta', 'sub_contrato', 
    'administrativo', 'personal', 'transporte', 'fijos', 'hogar', 'aporte', 'trabajos_extra'
);

-- 2. PROFILES TABLE
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role user_role DEFAULT 'engineer',
    company_name TEXT DEFAULT 'CONSTRUCTORA WM/M&S',
    avatar_url TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. PROJECTS TABLE
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name TEXT NOT NULL,
    client_name TEXT NOT NULL,
    client_phone TEXT,
    client_email TEXT,
    location TEXT NOT NULL,
    typology project_typology DEFAULT 'residential',
    area_m2 NUMERIC(10,2) NOT NULL DEFAULT 0,
    quality_level VARCHAR(20) CHECK (quality_level IN ('basic', 'moderate', 'premium')),
    status project_status DEFAULT 'planning',
    start_date DATE,
    estimated_end_date DATE,
    duration_days INT DEFAULT 0,
    total_budget NUMERIC(14,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. STANDARD APU LIBRARY
CREATE TABLE apu_library (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE NOT NULL,
    typology project_typology DEFAULT 'residential',
    chronological_order INT NOT NULL,
    description TEXT NOT NULL,
    unit VARCHAR(20) NOT NULL,
    default_yield_per_day NUMERIC(10,2) DEFAULT 1.0,
    category VARCHAR(50) NOT NULL
);

-- 5. BUDGETS & LINE ITEMS (PARENT-CHILD TREE)
CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    version INT DEFAULT 1,
    direct_cost NUMERIC(14,2) DEFAULT 0,
    indirect_percentage NUMERIC(5,2) DEFAULT 15.0,
    contingency_percentage NUMERIC(5,2) DEFAULT 5.0,
    profit_percentage NUMERIC(5,2) DEFAULT 10.0,
    total_amount NUMERIC(14,2) DEFAULT 0,
    duration_days INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE budget_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id UUID REFERENCES budgets(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES budget_items(id) ON DELETE CASCADE,
    item_order INT NOT NULL,
    code VARCHAR(30) NOT NULL,
    description TEXT NOT NULL,
    unit VARCHAR(20) NOT NULL,
    quantity NUMERIC(12,2) NOT NULL DEFAULT 0,
    unit_cost NUMERIC(12,2) DEFAULT 0,
    total_cost NUMERIC(14,2) DEFAULT 0,
    is_custom BOOLEAN DEFAULT FALSE,
    length_m NUMERIC(8,2),
    width_m NUMERIC(8,2),
    depth_m NUMERIC(8,2),
    height_m NUMERIC(8,2),
    slab_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE budget_item_breakdown (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_item_id UUID REFERENCES budget_items(id) ON DELETE CASCADE,
    resource_type VARCHAR(20) CHECK (resource_type IN ('material', 'labor', 'equipment', 'subcontract')),
    code VARCHAR(30),
    description TEXT NOT NULL,
    unit VARCHAR(20) NOT NULL,
    quantity_unitary NUMERIC(10,4) NOT NULL,
    total_quantity NUMERIC(12,2) NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    waste_percentage NUMERIC(5,2) DEFAULT 5.0,
    total_price NUMERIC(14,2) NOT NULL
);

-- 6. FINANCIAL TRANSACTIONS
CREATE TABLE financial_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    type VARCHAR(10) CHECK (type IN ('income', 'expense')),
    category expense_category NOT NULL,
    description TEXT NOT NULL,
    quantity NUMERIC(10,2) DEFAULT 1,
    unit VARCHAR(20) DEFAULT 'unid',
    unit_cost NUMERIC(12,2) NOT NULL,
    total_cost NUMERIC(14,2) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    receipt_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. PAYROLL & WAREHOUSE
CREATE TABLE payroll_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    worker_name TEXT NOT NULL,
    role_title TEXT NOT NULL,
    daily_rate NUMERIC(10,2) NOT NULL,
    days_worked NUMERIC(4,1) NOT NULL,
    total_pay NUMERIC(12,2) NOT NULL,
    week_ending_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending'
);

CREATE TABLE warehouse_stock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_code VARCHAR(30) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    unit VARCHAR(20) NOT NULL,
    current_stock NUMERIC(12,2) DEFAULT 0,
    minimum_threshold NUMERIC(12,2) DEFAULT 10,
    unit_cost NUMERIC(12,2) NOT NULL
);
```

---

## 2. DEXIE.JS (INDEXEDDB) OFFLINE SCHEMA SPECIFICATION

File: `/lib/db/offlineStore.ts`

```typescript
import Dexie, { Table } from 'dexie';

export interface LocalProject {
  id?: string;
  code: string;
  name: string;
  client_name: string;
  total_budget: number;
  sync_status: 'synced' | 'created_offline' | 'updated_offline';
}

export interface LocalBudgetItem {
  id?: string;
  budget_id: string;
  code: string;
  description: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  sync_status: 'synced' | 'pending';
}

export class WMDatabase extends Dexie {
  projects!: Table<LocalProject>;
  budgetItems!: Table<LocalBudgetItem>;

  constructor() {
    super('ConstructoraWM_OfflineDB');
    this.version(1).stores({
      projects: 'id, code, name, sync_status',
      budgetItems: 'id, budget_id, code, sync_status'
    });
  }
}

export const offlineDB = new WMDatabase();
```
