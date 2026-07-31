-- CONSTRUCTORA WM/M&S - SUPABASE DATABASE SCHEMA
-- Slogan: "CONSTRUYENDO EL FUTURO"
-- Version: 1.0.0

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

-- 8. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_item_breakdown ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_stock ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read their own profile, admins can read all
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Projects: All authenticated users can read, specific roles can write
CREATE POLICY "Authenticated users can view projects" ON projects FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Engineers and above can create projects" ON projects FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'director', 'engineer', 'architect'))
);
CREATE POLICY "Engineers and above can update projects" ON projects FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'director', 'engineer', 'architect'))
);
CREATE POLICY "Admins can delete projects" ON projects FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Budgets: Related to projects
CREATE POLICY "Authenticated users can view budgets" ON budgets FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Engineers and above can manage budgets" ON budgets FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'director', 'engineer', 'architect'))
);

-- Budget Items: Related to budgets
CREATE POLICY "Authenticated users can view budget items" ON budget_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Engineers and above can manage budget items" ON budget_items FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'director', 'engineer', 'architect'))
);

-- Budget Item Breakdown: Related to budget items
CREATE POLICY "Authenticated users can view breakdowns" ON budget_item_breakdown FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Engineers and above can manage breakdowns" ON budget_item_breakdown FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'director', 'engineer', 'architect'))
);

-- Financial Transactions: Related to projects
CREATE POLICY "Authenticated users can view transactions" ON financial_transactions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Engineers and above can manage transactions" ON financial_transactions FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'director', 'engineer', 'architect'))
);

-- Payroll Records: Related to projects
CREATE POLICY "Authenticated users can view payroll" ON payroll_records FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Engineers and above can manage payroll" ON payroll_records FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'director', 'engineer'))
);

-- Warehouse Stock: All authenticated can read, warehouse role can write
CREATE POLICY "Authenticated users can view stock" ON warehouse_stock FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Warehouse role can manage stock" ON warehouse_stock FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'director', 'warehouse'))
);

-- 9. FUNCTIONS & TRIGGERS FOR AUTOMATIC CALCULATIONS

-- Function to update budget total when items change
CREATE OR REPLACE FUNCTION update_budget_total()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE budgets 
    SET direct_cost = (
        SELECT COALESCE(SUM(total_cost), 0) 
        FROM budget_items 
        WHERE budget_id = NEW.budget_id
    ),
    total_amount = direct_cost * (1 + (indirect_percentage / 100) + (contingency_percentage / 100) + (profit_percentage / 100))
    WHERE id = NEW.budget_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER budget_items_total_trigger
AFTER INSERT OR UPDATE OR DELETE ON budget_items
FOR EACH ROW EXECUTE FUNCTION update_budget_total();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (new.id, new.raw_user_meta_data->>'full_name', 'engineer');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. INITIAL DATA - STANDARD APU LIBRARY (Residential - 40 items)

INSERT INTO apu_library (code, typology, chronological_order, description, unit, default_yield_per_day, category) VALUES
-- MOVIMIENTO DE TIERRAS (1-3)
('1.1', 'residential', 1, 'Limpieza y desbroce del terreno', 'm2', 150.0, 'movimiento_tierras'),
('1.2', 'residential', 2, 'Excavación manual para cimientos', 'm3', 3.0, 'movimiento_tierras'),
('1.3', 'residential', 3, 'Relleno y compactación de terreno', 'm3', 25.0, 'movimiento_tierras'),

-- CIMENTACIONES (4-8)
('2.1', 'residential', 4, 'Zapata de concreto armado 1.00x1.00x0.25m', 'unidad', 2.0, 'cimentaciones'),
('2.2', 'residential', 5, 'Cadena de cimentación (cinta) 15x20cm', 'ml', 20.0, 'cimentaciones'),
('2.3', 'residential', 6, 'Impermeabilización de cimientos con asfalto', 'm2', 50.0, 'cimentaciones'),
('2.4', 'residential', 7, 'Drenaje alrededor de cimientos', 'ml', 40.0, 'cimentaciones'),
('2.5', 'residential', 8, 'Replanteo y nivelación de cimientos', 'global', 1.0, 'cimentaciones'),

-- ESTRUCTURA DE MAMPOSTERÍA (9-14)
('3.1', 'residential', 9, 'Muro de block 15x20x40cm levantado', 'm2', 15.0, 'mamposteria'),
('3.2', 'residential', 10, 'Columna de block 15x20x40cm con varilla', 'unidad', 3.0, 'mamposteria'),
('3.3', 'residential', 11, 'Cadena de amarre (dintel) 15x20cm', 'ml', 18.0, 'mamposteria'),
('3.4', 'residential', 12, 'Castillo de concreto armado 15x20cm', 'ml', 15.0, 'mamposteria'),
('3.5', 'residential', 13, 'Aplanado de mortero en muros interiores', 'm2', 25.0, 'mamposteria'),
('3.6', 'residential', 14, 'Aplanado de mortero en muros exteriores', 'm2', 20.0, 'mamposteria'),

-- LOSAS Y CUBIERTAS (15-20)
('4.1', 'residential', 15, 'Losa sólida de concreto 0.10m espesor', 'm2', 12.0, 'losas_cubiertas'),
('4.2', 'residential', 16, 'Losa prefabricada vigueta y bovedilla', 'm2', 25.0, 'losas_cubiertas'),
('4.3', 'residential', 17, 'Losa prefabricada capa de compresión 0.05m', 'm2', 40.0, 'losas_cubiertas'),
('4.4', 'residential', 18, 'Malla electrosoldada 6x6-10/10', 'm2', 60.0, 'losas_cubiertas'),
('4.5', 'residential', 19, 'Pérgola metálica estructural', 'm2', 8.0, 'losas_cubiertas'),
('4.6', 'residential', 20, 'Tejado de teja de barro tradicional', 'm2', 18.0, 'losas_cubiertas'),

-- ACABADOS INTERIORES (21-28)
('5.1', 'residential', 21, 'Piso de loseta cerámica 30x30cm', 'm2', 12.0, 'acabados_interiores'),
('5.2', 'residential', 22, 'Piso de porcelanato 60x60cm', 'm2', 8.0, 'acabados_interiores'),
('5.3', 'residential', 23, 'Piso de mármol natural', 'm2', 6.0, 'acabados_interiores'),
('5.4', 'residential', 24, 'Aplanado fino en paredes interiores', 'm2', 30.0, 'acabados_interiores'),
('5.5', 'residential', 25, 'Pintura látex interior (2 manos)', 'm2', 40.0, 'acabados_interiores'),
('5.6', 'residential', 26, 'Cenefa decorativa interior', 'ml', 35.0, 'acabados_interiores'),
('5.7', 'residential', 27, 'Molduras de yeso interiores', 'ml', 25.0, 'acabados_interiores'),
('5.8', 'residential', 28, 'Plafón de PVC laminado', 'm2', 15.0, 'acabados_interiores'),

-- ACABADOS EXTERIORES (29-34)
('6.1', 'residential', 29, 'Aplanado fino en fachadas', 'm2', 25.0, 'acabados_exteriores'),
('6.2', 'residential', 30, 'Pintura elastomérica exterior', 'm2', 35.0, 'acabados_exteriores'),
('6.3', 'residential', 31, 'Revestimiento de piedra natural', 'm2', 8.0, 'acabados_exteriores'),
('6.4', 'residential', 32, 'Cantera decorativa en fachadas', 'm2', 10.0, 'acabados_exteriores'),
('6.5', 'residential', 33, 'Cornisas y molduras exteriores', 'ml', 20.0, 'acabados_exteriores'),
('6.6', 'residential', 34, 'Impermeabilización de azoteas', 'm2', 40.0, 'acabados_exteriores'),

-- CARPINTERÍA Y HERRERÍA (35-38)
('7.1', 'residential', 35, 'Puerta de madera sólida con marco', 'unidad', 2.0, 'carpinteria_herreria'),
('7.2', 'residential', 36, 'Ventana de aluminio con vidrio', 'm2', 8.0, 'carpinteria_herreria'),
('7.3', 'residential', 37, 'Estructura metálica para cubierta', 'kg', 15.0, 'carpinteria_herreria'),
('7.4', 'residential', 38, 'Barandales de hierro forjado', 'ml', 12.0, 'carpinteria_herreria'),

-- INSTALACIONES (39-40)
('8.1', 'residential', 39, 'Instalación hidráulica completa', 'global', 1.0, 'instalaciones'),
('8.2', 'residential', 40, 'Instalación eléctrica completa', 'global', 1.0, 'instalaciones');

-- 11. INDEXES FOR PERFORMANCE
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_typology ON projects(typology);
CREATE INDEX idx_budgets_project ON budgets(project_id);
CREATE INDEX idx_budget_items_budget ON budget_items(budget_id);
CREATE INDEX idx_budget_items_parent ON budget_items(parent_id);
CREATE INDEX idx_financial_transactions_project ON financial_transactions(project_id);
CREATE INDEX idx_financial_transactions_date ON financial_transactions(date);
CREATE INDEX idx_payroll_records_project ON payroll_records(project_id);
CREATE INDEX idx_warehouse_stock_code ON warehouse_stock(item_code);
