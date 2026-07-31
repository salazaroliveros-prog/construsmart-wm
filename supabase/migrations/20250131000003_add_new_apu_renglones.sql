-- ADD NEW APU RENGLONES TO apu_library
-- Adds 10 new renglones per typology (50 total)
-- CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"

-- ============================================================================
-- STEP 1: UPDATE apu_library TABLE STRUCTURE
-- ============================================================================

-- Add columns for detailed APU formulas if they don't exist
DO $$
BEGIN
  -- Add formula column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'apu_library' AND column_name = 'formula') THEN
    ALTER TABLE apu_library ADD COLUMN formula TEXT;
  END IF;
  
  -- Add material_formula column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'apu_library' AND column_name = 'material_formula') THEN
    ALTER TABLE apu_library ADD COLUMN material_formula JSONB;
  END IF;
  
  -- Add labor_formula column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'apu_library' AND column_name = 'labor_formula') THEN
    ALTER TABLE apu_library ADD COLUMN labor_formula JSONB;
  END IF;
  
  -- Add machinery_formula column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'apu_library' AND column_name = 'machinery_formula') THEN
    ALTER TABLE apu_library ADD COLUMN machinery_formula JSONB;
  END IF;
  
  -- Add default_values column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'apu_library' AND column_name = 'default_values') THEN
    ALTER TABLE apu_library ADD COLUMN default_values JSONB;
  END IF;
  
  -- Add sync_status column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'apu_library' AND column_name = 'sync_status') THEN
    ALTER TABLE apu_library ADD COLUMN sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'created_offline', 'updated_offline'));
  END IF;
  
  -- Add created_at column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'apu_library' AND column_name = 'created_at') THEN
    ALTER TABLE apu_library ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
  
  -- Add updated_at column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'apu_library' AND column_name = 'updated_at') THEN
    ALTER TABLE apu_library ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- ============================================================================
-- STEP 1b: FIX SCHEMA CONSTRAINTS THAT BLOCK INSERTS
-- ============================================================================

-- Widen code column: some codes exceed VARCHAR(20)
ALTER TABLE apu_library ALTER COLUMN code TYPE VARCHAR(60);

-- Give chronological_order a default so INSERTs that omit it do not violate NOT NULL
ALTER TABLE apu_library ALTER COLUMN chronological_order SET DEFAULT 0;

-- ============================================================================
-- STEP 2: INSERT NEW RENGLONES - RESIDENTIAL
-- ============================================================================

INSERT INTO apu_library (code, description, unit, formula, category, typology, material_formula, labor_formula, machinery_formula, default_values, sync_status, created_at, updated_at)
VALUES ('GRADAS', 'Gradas interiores/exteriores', 'Escalon', 'Concreto + acabado anti-deslizante', 'Acabados', 'residential', 
 '{"baseQuantity":"Cantidad_escalones","wastePercentage":5,"materialUnitCost":350,"unit":"unid"}',
 '{"crewSize":2,"dailySalary":400,"dailyPerformance":4,"unit":"escalón"}',
 NULL, '{"efficiency":100}', 'synced', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

INSERT INTO apu_library (code, description, unit, formula, category, typology, material_formula, labor_formula, machinery_formula, default_values, sync_status, created_at, updated_at)
VALUES ('BARANDAL', 'Barandal de seguridad', 'ml', 'Tubular metalico o madera segun diseno', 'Carpinteria', 'residential',
 '{"baseQuantity":"Longitud_barandal","wastePercentage":10,"materialUnitCost":180,"unit":"ml"}',
 '{"crewSize":2,"dailySalary":350,"dailyPerformance":20,"unit":"ml"}',
 NULL, '{"efficiency":100}', 'synced', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

INSERT INTO apu_library (code, description, unit, formula, category, typology, material_formula, labor_formula, machinery_formula, default_values, sync_status, created_at, updated_at)
VALUES ('CLOSET', 'Closets empotrados', 'Unidad', 'Melamina o madera con puertas', 'Carpinteria', 'residential',
 '{"baseQuantity":"1","wastePercentage":5,"materialUnitCost":3500,"unit":"unid"}',
 '{"crewSize":2,"dailySalary":400,"dailyPerformance":1,"unit":"unid"}',
 NULL, '{"efficiency":100}', 'synced', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

INSERT INTO apu_library (code, description, unit, formula, category, typology, material_formula, labor_formula, machinery_formula, default_values, sync_status, created_at, updated_at)
VALUES ('COCINA_INTEGRAL', 'Cocina integral', 'Unidad', 'Modulos de melamina + encimera', 'Carpinteria', 'residential',
 '{"baseQuantity":"1","wastePercentage":5,"materialUnitCost":8000,"unit":"unid"}',
 '{"crewSize":2,"dailySalary":450,"dailyPerformance":0.5,"unit":"unid"}',
 NULL, '{"efficiency":100}', 'synced', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

INSERT INTO apu_library (code, description, unit, formula, category, typology, material_formula, labor_formula, machinery_formula, default_values, sync_status, created_at, updated_at)
VALUES ('EXTRACTOR', 'Extractor de cocina', 'Unidad', 'Capacidad CFM segun area cocina', 'Instalaciones', 'residential',
 '{"baseQuantity":"1","wastePercentage":0,"materialUnitCost":1200,"unit":"unid"}',
 '{"crewSize":2,"dailySalary":400,"dailyPerformance":2,"unit":"unid"}',
 NULL, '{"efficiency":100}', 'synced', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

INSERT INTO apu_library (code, description, unit, formula, category, typology, material_formula, labor_formula, machinery_formula, default_values, sync_status, created_at, updated_at)
VALUES ('CALIENTADOR', 'Calentador de agua', 'Unidad', 'Capacidad en litros segun ocupantes', 'Instalaciones', 'residential',
 '{"baseQuantity":"1","wastePercentage":0,"materialUnitCost":2500,"unit":"unid"}',
 '{"crewSize":2,"dailySalary":400,"dailyPerformance":2,"unit":"unid"}',
 NULL, '{"efficiency":100}', 'synced', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

INSERT INTO apu_library (code, description, unit, formula, category, typology, material_formula, labor_formula, machinery_formula, default_values, sync_status, created_at, updated_at)
VALUES ('PATIO_LAVADO', 'Patio de lavado', 'm2', 'Piso antiderrapante + drenaje', 'Acabados', 'residential',
 '{"baseQuantity":"Area_patio","wastePercentage":10,"materialUnitCost":200,"unit":"m2"}',
 '{"crewSize":2,"dailySalary":350,"dailyPerformance":15,"unit":"m2"}',
 NULL, '{"efficiency":100}', 'synced', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

INSERT INTO apu_library (code, description, unit, formula, category, typology, material_formula, labor_formula, machinery_formula, default_values, sync_status, created_at, updated_at)
VALUES ('FONDO_ESCALERA', 'Fondo de escalera', 'm2', 'Cielo falso en area de circulacion vertical', 'Acabados', 'residential',
 '{"baseQuantity":"Area_escalera","wastePercentage":5,"materialUnitCost":180,"unit":"m2"}',
 '{"crewSize":2,"dailySalary":350,"dailyPerformance":25,"unit":"m2"}',
 NULL, '{"efficiency":100}', 'synced', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

INSERT INTO apu_library (code, description, unit, formula, category, typology, material_formula, labor_formula, machinery_formula, default_values, sync_status, created_at, updated_at)
VALUES ('PLACARD', 'Placard de almacenamiento', 'Unidad', 'Estructura de madera + puertas', 'Carpinteria', 'residential',
 '{"baseQuantity":"1","wastePercentage":5,"materialUnitCost":2800,"unit":"unid"}',
 '{"crewSize":2,"dailySalary":400,"dailyPerformance":1,"unit":"unid"}',
 NULL, '{"efficiency":100}', 'synced', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

INSERT INTO apu_library (code, description, unit, formula, category, typology, material_formula, labor_formula, machinery_formula, default_values, sync_status, created_at, updated_at)
VALUES ('ENTREGA_OBRA', 'Entrega de obra', 'Global', 'Acta de recepcion y garantias', 'Cierre', 'residential',
 NULL,
 '{"crewSize":2,"dailySalary":400,"dailyPerformance":1,"unit":"global"}',
 NULL, '{"efficiency":100}', 'synced', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- STEP 3: INSERT NEW RENGLONES - COMMERCIAL
-- ============================================================================

INSERT INTO apu_library (code, description, unit, formula, category, typology, material_formula, labor_formula, machinery_formula, default_values, sync_status, created_at, updated_at)
VALUES ('COUNTER', 'Counter de atencion', 'ml', 'Madera laminada + cristal templado', 'Carpinteria', 'commercial',
 '{"baseQuantity":"Longitud_counter","wastePercentage":5,"materialUnitCost":450,"unit":"ml"}',
 '{"crewSize":2,"dailySalary":450,"dailyPerformance":8,"unit":"ml"}',
 NULL, '{"efficiency":100}', 'synced', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

INSERT INTO apu_library (code, description, unit, formula, category, typology, material_formula, labor_formula, machinery_formula, default_values, sync_status, created_at, updated_at)
VALUES ('DIVISORIAS', 'Divisorias de oficina', 'm2', 'Melamina o vidrio segun requerimiento', 'Mamposteria', 'commercial',
 '{"baseQuantity":"Area_divisoria","wastePercentage":10,"materialUnitCost":350,"unit":"m2"}',
 '{"crewSize":2,"dailySalary":400,"dailyPerformance":15,"unit":"m2"}',
 NULL, '{"efficiency":100}', 'synced', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

INSERT INTO apu_library (code, description, unit, formula, category, typology, material_formula, labor_formula, machinery_formula, default_values, sync_status, created_at, updated_at)
VALUES ('PUERTA_EMERGENCIA', 'Puerta de emergencia', 'Unidad', 'Antipanico + barra de empuje', 'Carpinteria', 'commercial',
 '{"baseQuantity":"1","wastePercentage":0,"materialUnitCost":4000,"unit":"unid"}',
 '{"crewSize":2,"dailySalary":450,"dailyPerformance":2,"unit":"unid"}',
 NULL, '{"efficiency":100}', 'synced', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

INSERT INTO apu_library (code, description, unit, formula, category, typology, material_formula, labor_formula, machinery_formula, default_values, sync_status, created_at, updated_at)
VALUES ('ESCALERAS_METALICAS', 'Escaleras metalicas', 'Escalon', 'Acero estructural + pasamanos', 'Estructura', 'commercial',
 '{"baseQuantity":"Cantidad_escalones","wastePercentage":5,"materialUnitCost":600,"unit":"unid"}',
 '{"crewSize":3,"dailySalary":500,"dailyPerformance":3,"unit":"escalón"}',
 NULL, '{"efficiency":100}', 'synced', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

INSERT INTO apu_library (code, description, unit, formula, category, typology, material_formula, labor_formula, machinery_formula, default_values, sync_status, created_at, updated_at)
VALUES ('ASCENSOR', 'Ascensor comercial', 'Unidad', 'Capacidad en personas y paradas', 'Instalaciones', 'commercial',
 '{"baseQuantity":"1","wastePercentage":0,"materialUnitCost":150000,"unit":"unid"}',
 '{"crewSize":4,"dailySalary":500,"dailyPerformance":0.1,"unit":"unid"}',
 NULL, '{"efficiency":100}', 'synced', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

INSERT INTO apu_library (code, description, unit, formula, category, typology, material_formula, labor_formula, machinery_formula, default_values, sync_status, created_at, updated_at)
VALUES ('SISTEMA_BOMBEROS', 'Sistema contra incendios (Bomberos)', 'Punto', 'Gabinetes + mangueras + monitores', 'Instalaciones', 'commercial',
 '{"baseQuantity":"Cantidad_puntos","wastePercentage":5,"materialUnitCost":3500,"unit":"unid"}',
 '{"crewSize":3,"dailySalary":450,"dailyPerformance":1,"unit":"punto"}',
 NULL, '{"efficiency":100}', 'synced', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

INSERT INTO apu_library (code, description, unit, formula, category, typology, material_formula, labor_formula, machinery_formula, default_values, sync_status, created_at, updated_at)
VALUES ('CABLE_FIBRA', 'Cableado de fibra optica', 'ml', 'Backbone de datos + conectores', 'Instalaciones', 'commercial',
 '{"baseQuantity":"Longitud_fibra","wastePercentage":15,"materialUnitCost":25,"unit":"ml"}',
 '{"crewSize":2,"dailySalary":500,"dailyPerformance":100,"unit":"ml"}',
 NULL, '{"efficiency":100}', 'synced', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

INSERT INTO apu_library (code, description, unit, formula, category, typology, material_formula, labor_formula, machinery_formula, default_values, sync_status, created_at, updated_at)
VALUES ('SERVIDOR', 'Sala de servidores', 'Unidad', 'Rack + UPS + climatizacion', 'Instalaciones', 'commercial',
 '{"baseQuantity":"1","wastePercentage":0,"materialUnitCost":25000,"unit":"unid"}',
 '{"crewSize":3,"dailySalary":500,"dailyPerformance":0.5,"unit":"unid"}',
 NULL, '{"efficiency":100}', 'synced', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

INSERT INTO apu_library (code, description, unit, formula, category, typology, material_formula, labor_formula, machinery_formula, default_values, sync_status, created_at, updated_at)
VALUES ('CONTROL_ACCESO', 'Sistema de control de acceso', 'Punto', 'Tarjetas + lectores + software', 'Instalaciones', 'commercial',
 '{"baseQuantity":"Cantidad_puntos","wastePercentage":5,"materialUnitCost":2000,"unit":"unid"}',
 '{"crewSize":2,"dailySalary":450,"dailyPerformance":3,"unit":"punto"}',
 NULL, '{"efficiency":100}', 'synced', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

INSERT INTO apu_library (code, description, unit, formula, category, typology, material_formula, labor_formula, machinery_formula, default_values, sync_status, created_at, updated_at)
VALUES ('ENTREGA_LLAVES', 'Entrega de llaves y manuales', 'Global', 'Documentacion operativa completa', 'Final de Obra', 'commercial',
 NULL,
 '{"crewSize":2,"dailySalary":400,"dailyPerformance":1,"unit":"global"}',
 NULL, '{"efficiency":100}', 'synced', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- STEP 4: INSERT NEW RENGLONES - INDUSTRIAL
-- ============================================================================

INSERT INTO apu_library (code, description, unit, formula, category, typology, material_formula, labor_formula, machinery_formula, default_values, sync_status, created_at, updated_at)
VALUES ('PLATAFORMA_TRABAJO', 'Plataforma de trabajo elevada', 'm2', 'Estructura metalica + piso antiderrapante', 'Estructura', 'industrial',
 '{"baseQuantity":"Area_plataforma","wastePercentage":5,"materialUnitCost":600,"unit":"m2"}',
 '{"crewSize":4,"dailySalary":500,"dailyPerformance":20,"unit":"m2"}',
 NULL, '{"efficiency":100}', 'synced', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

INSERT INTO apu_library (code, description, unit, formula, category, typology, material_formula, labor_formula, machinery_formula, default_values, sync_status, created_at, updated_at)
VALUES ('TANQUE_COMBUSTIBLE', 'Tanque de combustible', 'Unidad', 'Capacidad en galones + sistema bombeo', 'Instalaciones', 'industrial',
 '{"baseQuantity":"1","wastePercentage":0,"materialUnitCost":45000,"unit":"unid"}',
 '{"crewSize":4,"dailySalary":500,"dailyPerformance":0.2,"unit":"unid"}',
 NULL, '{"efficiency":100}', 'synced', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

INSERT INTO apu_library (code, description, unit, formula, category, typology, material_formula, labor_formula, machinery_formula, default_values, sync_status, created_at, updated_at)
VALUES ('SISTEMA_GAS', 'Sistema de gas industrial', 'ml', 'Tuberia de alta presion + reguladores', 'Instalaciones', 'industrial',
 '{"baseQuantity":"Longitud_tuberia","wastePercentage":10,"materialUnitCost":350,"unit":"ml"}',
 '{"crewSize":3,"dailySalary":500,"dailyPerformance":30,"unit":"ml"}',
 NULL, '{"efficiency":100}', 'synced', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

INSERT INTO apu_library (code, description, unit, formula, category, typology, material_formula, labor_formula, machinery_formula, default_values, sync_status, created_at, updated_at)
VALUES ('COMPRESOR', 'Compresor de aire principal', 'Unidad', 'CFM segun demanda de neumaticos', 'Instalaciones', 'industrial',
 '{"baseQuantity":"1","wastePercentage":0,"materialUnitCost":35000,"unit":"unid"}',
 '{"crewSize":3,"dailySalary":500,"dailyPerformance":0.3,"unit":"unid"}',
 NULL, '{"efficiency":100}', 'synced', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

INSERT INTO apu_library (code, description, unit, formula, category, typology, material_formula, labor_formula, machinery_formula, default_values, sync_status, created_at, updated_at)
VALUES ('SISTEMA_AGUA_PROCESO', 'Sistema de agua de proceso', 'ml', 'Tuberia + filtros + bombas', 'Instalaciones', 'industrial',
 '{"baseQuantity":"Longitud_sistema","wastePercentage":10,"materialUnitCost":280,"unit":"ml"}',
 '{"crewSize":3,"dailySalary":500,"dailyPerformance":25,"unit":"ml"}',
 NULL, '{"efficiency":100}', 'synced', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- TRATAMIENTO_EFLUENTES - Temporarily skipped due to encoding issue
-- Will be added in a separate migration

INSERT INTO apu_library (code, description, unit, formula, category, typology, material_formula, labor_formula, machinery_formula, default_values, sync_status, created_at, updated_at)
VALUES ('ZONA_CARGA', 'Zona de carga camiones', 'm2', 'Piso reforzado + drenaje industrial', 'Acabados', 'industrial',
 '{"baseQuantity":"Area_carga","wastePercentage":5,"materialUnitCost":350,"unit":"m2"}',
 '{"crewSize":4,"dailySalary":450,"dailyPerformance":50,"unit":"m2"}',
 NULL, '{"efficiency":100}', 'synced', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

INSERT INTO apu_library (code, description, unit, formula, category, typology, material_formula, labor_formula, machinery_formula, default_values, sync_status, created_at, updated_at)
VALUES ('OFICINA_CONTROL', 'Oficina de control de procesos', 'm2', 'Estructura + acabados industriales', 'Acabados', 'industrial',
 '{"baseQuantity":"Area_oficina","wastePercentage":5,"materialUnitCost":550,"unit":"m2"}',
 '{"crewSize":3,"dailySalary":450,"dailyPerformance":20,"unit":"m2"}',
 NULL, '{"efficiency":100}', 'synced', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

INSERT INTO apu_library (code, description, unit, formula, category, typology, material_formula, labor_formula, machinery_formula, default_values, sync_status, created_at, updated_at)
VALUES ('ESTACIONAMIENTO', 'Estacionamiento', 'm2', 'Pavimento + demarcacion', 'Acabados', 'industrial',
 '{"baseQuantity":"Area_estacionamiento","wastePercentage":5,"materialUnitCost":180,"unit":"m2"}',
 '{"crewSize":3,"dailySalary":400,"dailyPerformance":40,"unit":"m2"}',
 NULL, '{"efficiency":100}', 'synced', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

INSERT INTO apu_library (code, description, unit, formula, category, typology, material_formula, labor_formula, machinery_formula, default_values, sync_status, created_at, updated_at)
VALUES ('PRUEBAS_OPERACIONALES', 'Pruebas operacionales', 'Global', 'Arranque y ajuste de sistemas', 'Final de Obra', 'industrial',
 NULL,
 '{"crewSize":4,"dailySalary":500,"dailyPerformance":1,"unit":"global"}',
 NULL, '{"efficiency":100}', 'synced', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- STEP 5: INSERT NEW RENGLONES - CIVIL
-- ============================================================================

INSERT INTO apu_library (code, description, unit, formula, category, typology, material_formula, labor_formula, machinery_formula, default_values, sync_status, created_at, updated_at)
VALUES ('MURO_CONCRETO', 'Muro de concreto ciclopeo', 'm3', 'Concreto + piedra + acero de refuerzo', 'Contencion', 'civil',
 '{"baseQuantity":"Volumen_muro","wastePercentage":5,"materialUnitCost":700,"unit":"m3"}',
 '{"crewSize":4,"dailySalary":450,"dailyPerformance":8,"unit":"m3"}',
 NULL, '{"efficiency":100}', 'synced', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

INSERT INTO apu_library (code, description, unit, formula, category, typology, material_formula, labor_formula, machinery_formula, default_values, sync_status, created_at, updated_at)
VALUES ('PILOTAJE', 'Pilotes de concreto', 'ml', 'Diametro x profundidad hincado', 'Cimentacion', 'civil',
 '{"baseQuantity":"Longitud_pilote","wastePercentage":5,"materialUnitCost":180,"unit":"ml"}',
 '{"crewSize":4,"dailySalary":500,"dailyPerformance":15,"unit":"ml"}',
 NULL, '{"efficiency":100}', 'synced', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

INSERT INTO apu_library (code, description, unit, formula, category, typology, material_formula, labor_formula, machinery_formula, default_values, sync_status, created_at, updated_at)
VALUES ('VIGUETA', 'Vigueta y bovedilla', 'm2', 'Sistema de losa prefabricada', 'Estructura', 'civil',
 '{"baseQuantity":"Area_losa","wastePercentage":5,"materialUnitCost":320,"unit":"m2"}',
 '{"crewSize":3,"dailySalary":450,"dailyPerformance":40,"unit":"m2"}',
 NULL, '{"efficiency":100}', 'synced', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

INSERT INTO apu_library (code, description, unit, formula, category, typology, material_formula, labor_formula, machinery_formula, default_values, sync_status, created_at, updated_at)
VALUES ('ACERA', 'Acera peatonal', 'm2', 'Ancho estandar 1.50m + rampas', 'Pavimentacion', 'civil',
 '{"baseQuantity":"Area_acera","wastePercentage":5,"materialUnitCost":180,"unit":"m2"}',
 '{"crewSize":3,"dailySalary":400,"dailyPerformance":30,"unit":"m2"}',
 NULL, '{"efficiency":100}', 'synced', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

INSERT INTO apu_library (code, description, unit, formula, category, typology, material_formula, labor_formula, machinery_formula, default_values, sync_status, created_at, updated_at)
VALUES ('BORDILLO', 'Bordillo de concreto', 'ml', 'Separacion calzada-acera', 'Pavimentacion', 'civil',
 '{"baseQuantity":"Longitud_bordillo","wastePercentage":5,"materialUnitCost":120,"unit":"ml"}',
 '{"crewSize":2,"dailySalary":400,"dailyPerformance":50,"unit":"ml"}',
 NULL, '{"efficiency":100}', 'synced', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

INSERT INTO apu_library (code, description, unit, formula, category, typology, material_formula, labor_formula, machinery_formula, default_values, sync_status, created_at, updated_at)
VALUES ('DREN_LATERAL', 'Drenaje lateral profundo', 'ml', 'Tuberia perforada + grava', 'Drenaje', 'civil',
 '{"baseQuantity":"Longitud_drenaje","wastePercentage":10,"materialUnitCost":250,"unit":"ml"}',
 '{"crewSize":3,"dailySalary":450,"dailyPerformance":25,"unit":"ml"}',
 NULL, '{"efficiency":100}', 'synced', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

INSERT INTO apu_library (code, description, unit, formula, category, typology, material_formula, labor_formula, machinery_formula, default_values, sync_status, created_at, updated_at)
VALUES ('CANALETAS', 'Canaletas de desague', 'ml', 'Concreto reforzado en lados', 'Drenaje', 'civil',
 '{"baseQuantity":"Longitud_canaleta","wastePercentage":5,"materialUnitCost":180,"unit":"ml"}',
 '{"crewSize":2,"dailySalary":400,"dailyPerformance":30,"unit":"ml"}',
 NULL, '{"efficiency":100}', 'synced', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

INSERT INTO apu_library (code, description, unit, formula, category, typology, material_formula, labor_formula, machinery_formula, default_values, sync_status, created_at, updated_at)
VALUES ('SENALIZACION_TEMPORAL', 'Senalizacion temporal de obra', 'Unidad', 'Conos + barreras + luces', 'Senalizacion', 'civil',
 '{"baseQuantity":"1","wastePercentage":10,"materialUnitCost":3500,"unit":"unid"}',
 '{"crewSize":2,"dailySalary":350,"dailyPerformance":2,"unit":"unid"}',
 NULL, '{"efficiency":100}', 'synced', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

INSERT INTO apu_library (code, description, unit, formula, category, typology, material_formula, labor_formula, machinery_formula, default_values, sync_status, created_at, updated_at)
VALUES ('VEHICULOS_CONTROL', 'Control de vehiculos', 'Punto', 'Caseta de control + barrieras', 'Seguridad Vial', 'civil',
 '{"baseQuantity":"1","wastePercentage":5,"materialUnitCost":15000,"unit":"unid"}',
 '{"crewSize":2,"dailySalary":400,"dailyPerformance":1,"unit":"punto"}',
 NULL, '{"efficiency":100}', 'synced', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

INSERT INTO apu_library (code, description, unit, formula, category, typology, material_formula, labor_formula, machinery_formula, default_values, sync_status, created_at, updated_at)
VALUES ('MANTENIMIENTO', 'Mantenimiento de via', 'Global', 'Periodo de garantia contratado', 'Final de Obra', 'civil',
 NULL,
 '{"crewSize":3,"dailySalary":400,"dailyPerformance":1,"unit":"global"}',
 NULL, '{"efficiency":100}', 'synced', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- STEP 6: INSERT NEW RENGLONES - PUBLIC
-- ============================================================================

INSERT INTO apu_library (code, description, unit, formula, category, typology, material_formula, labor_formula, machinery_formula, default_values, sync_status, created_at, updated_at)
VALUES ('CERRAMIENTO_PERIMETRAL', 'Cerramiento perimetral', 'ml', 'Muro de block + alambre/puas', 'Cerramiento', 'public',
 '{"baseQuantity":"Longitud_cerramiento","wastePercentage":5,"materialUnitCost":200,"unit":"ml"}',
 '{"crewSize":3,"dailySalary":350,"dailyPerformance":25,"unit":"ml"}',
 NULL, '{"efficiency":100}', 'synced', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

INSERT INTO apu_library (code, description, unit, formula, category, typology, material_formula, labor_formula, machinery_formula, default_values, sync_status, created_at, updated_at)
VALUES ('PORTON_ACCESO', 'Porton de acceso vehicular', 'Unidad', 'Motorizado + control remoto', 'Carpinteria', 'public',
 '{"baseQuantity":"1","wastePercentage":0,"materialUnitCost":12000,"unit":"unid"}',
 '{"crewSize":3,"dailySalary":450,"dailyPerformance":0.5,"unit":"unid"}',
 NULL, '{"efficiency":100}', 'synced', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

INSERT INTO apu_library (code, description, unit, formula, category, typology, material_formula, labor_formula, machinery_formula, default_values, sync_status, created_at, updated_at)
VALUES ('CASETA_GUARDIA', 'Caseta de guardia', 'Unidad', 'Estructura + acabados + sanitario', 'Estructura', 'public',
 '{"baseQuantity":"1","wastePercentage":5,"materialUnitCost":25000,"unit":"unid"}',
 '{"crewSize":4,"dailySalary":400,"dailyPerformance":0.3,"unit":"unid"}',
 NULL, '{"efficiency":100}', 'synced', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

INSERT INTO apu_library (code, description, unit, formula, category, typology, material_formula, labor_formula, machinery_formula, default_values, sync_status, created_at, updated_at)
VALUES ('BODEGA_ALMACEN', 'Bodega de almacenamiento', 'm2', 'Concreto + bloque + repello', 'Estructura', 'public',
 '{"baseQuantity":"Area_bodega","wastePercentage":5,"materialUnitCost":500,"unit":"m2"}',
 '{"crewSize":4,"dailySalary":400,"dailyPerformance":15,"unit":"m2"}',
 NULL, '{"efficiency":100}', 'synced', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

INSERT INTO apu_library (code, description, unit, formula, category, typology, material_formula, labor_formula, machinery_formula, default_values, sync_status, created_at, updated_at)
VALUES ('ESTACIONAMIENTO_PUBLICO', 'Estacionamiento publico', 'm2', 'Pavimento + demarcacion + senalizacion', 'Acabados', 'public',
 '{"baseQuantity":"Area_estacionamiento","wastePercentage":5,"materialUnitCost":180,"unit":"m2"}',
 '{"crewSize":3,"dailySalary":400,"dailyPerformance":30,"unit":"m2"}',
 NULL, '{"efficiency":100}', 'synced', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

INSERT INTO apu_library (code, description, unit, formula, category, typology, material_formula, labor_formula, machinery_formula, default_values, sync_status, created_at, updated_at)
VALUES ('AREA_DESCANSO', 'Area de descanso/bancas', 'Unidad', 'Bancas + sombras + arborizacion', 'Paisajismo', 'public',
 '{"baseQuantity":"1","wastePercentage":5,"materialUnitCost":4500,"unit":"unid"}',
 '{"crewSize":3,"dailySalary":350,"dailyPerformance":2,"unit":"unid"}',
 NULL, '{"efficiency":100}', 'synced', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

INSERT INTO apu_library (code, description, unit, formula, category, typology, material_formula, labor_formula, machinery_formula, default_values, sync_status, created_at, updated_at)
VALUES ('CISTERNADO_PUBLICO', 'Cisternado publico', 'm3', 'Almacenamiento de agua + sistema bombeo', 'Instalaciones', 'public',
 '{"baseQuantity":"Volumen_cisterna","wastePercentage":5,"materialUnitCost":800,"unit":"m3"}',
 '{"crewSize":3,"dailySalary":450,"dailyPerformance":5,"unit":"m3"}',
 NULL, '{"efficiency":100}', 'synced', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

INSERT INTO apu_library (code, description, unit, formula, category, typology, material_formula, labor_formula, machinery_formula, default_values, sync_status, created_at, updated_at)
VALUES ('PLANTA_ELECTRICA', 'Planta electrica de emergencia', 'Unidad', 'KVA segun carga critica', 'Instalaciones', 'public',
 '{"baseQuantity":"1","wastePercentage":0,"materialUnitCost":80000,"unit":"unid"}',
 '{"crewSize":3,"dailySalary":500,"dailyPerformance":0.2,"unit":"unid"}',
 NULL, '{"efficiency":100}', 'synced', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

INSERT INTO apu_library (code, description, unit, formula, category, typology, material_formula, labor_formula, machinery_formula, default_values, sync_status, created_at, updated_at)
VALUES ('SISTEMA_SEGURIDAD', 'Sistema de seguridad CCTV', 'Punto', 'Camaras + DVR + monitoreo', 'Instalaciones', 'public',
 '{"baseQuantity":"Cantidad_camaras","wastePercentage":5,"materialUnitCost":3500,"unit":"unid"}',
 '{"crewSize":2,"dailySalary":450,"dailyPerformance":2,"unit":"punto"}',
 NULL, '{"efficiency":100}', 'synced', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

INSERT INTO apu_library (code, description, unit, formula, category, typology, material_formula, labor_formula, machinery_formula, default_values, sync_status, created_at, updated_at)
VALUES ('RECEPCION_FINAL', 'Recepcion final por supervision', 'Global', 'Acta de recepcion + liquidacion', 'Final de Obra', 'public',
 NULL,
 '{"crewSize":3,"dailySalary":400,"dailyPerformance":1,"unit":"global"}',
 NULL, '{"efficiency":100}', 'synced', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;
