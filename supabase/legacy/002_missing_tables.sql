-- CONSTRUCTORA WM/M&S - MIGRACIÓN DE TABLAS FALTANTES
-- Solo crea las tablas que no existen en la base de datos actual

-- Habilitar extensión uuid-ossp si no está habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Crear tabla profiles (si no existe)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'engineer',
    company_name TEXT DEFAULT 'CONSTRUCTORA WM/M&S',
    avatar_url TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla apu_library (si no existe)
CREATE TABLE IF NOT EXISTS apu_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL,
    typology VARCHAR(20) DEFAULT 'residential',
    chronological_order INT NOT NULL,
    description TEXT NOT NULL,
    unit VARCHAR(20) NOT NULL,
    default_yield_per_day NUMERIC(10,2) DEFAULT 1.0,
    category VARCHAR(50) NOT NULL
);

-- Crear tabla budget_item_breakdown (si no existe)
CREATE TABLE IF NOT EXISTS budget_item_breakdown (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Insertar datos APU Library solo si la tabla está vacía
INSERT INTO apu_library (code, typology, chronological_order, description, unit, default_yield_per_day, category)
SELECT 
    '1.1', 'residential', 1, 'Limpieza y desbroce del terreno', 'm2', 150.0, 'movimiento_tierras'
WHERE NOT EXISTS (SELECT 1 FROM apu_library WHERE code = '1.1');

INSERT INTO apu_library (code, typology, chronological_order, description, unit, default_yield_per_day, category)
SELECT 
    '1.2', 'residential', 2, 'Excavación manual para cimientos', 'm3', 3.0, 'movimiento_tierras'
WHERE NOT EXISTS (SELECT 1 FROM apu_library WHERE code = '1.2');

INSERT INTO apu_library (code, typology, chronological_order, description, unit, default_yield_per_day, category)
SELECT 
    '1.3', 'residential', 3, 'Relleno y compactación de terreno', 'm3', 25.0, 'movimiento_tierras'
WHERE NOT EXISTS (SELECT 1 FROM apu_library WHERE code = '1.3');

INSERT INTO apu_library (code, typology, chronological_order, description, unit, default_yield_per_day, category)
SELECT 
    '2.1', 'residential', 4, 'Zapata de concreto armado 1.00x1.00x0.25m', 'unidad', 2.0, 'cimentaciones'
WHERE NOT EXISTS (SELECT 1 FROM apu_library WHERE code = '2.1');

INSERT INTO apu_library (code, typology, chronological_order, description, unit, default_yield_per_day, category)
SELECT 
    '2.2', 'residential', 5, 'Cadena de cimentación (cinta) 15x20cm', 'ml', 20.0, 'cimentaciones'
WHERE NOT EXISTS (SELECT 1 FROM apu_library WHERE code = '2.2');

INSERT INTO apu_library (code, typology, chronological_order, description, unit, default_yield_per_day, category)
SELECT 
    '2.3', 'residential', 6, 'Impermeabilización de cimientos con asfalto', 'm2', 50.0, 'cimentaciones'
WHERE NOT EXISTS (SELECT 1 FROM apu_library WHERE code = '2.3');

INSERT INTO apu_library (code, typology, chronological_order, description, unit, default_yield_per_day, category)
SELECT 
    '2.4', 'residential', 7, 'Drenaje alrededor de cimientos', 'ml', 40.0, 'cimentaciones'
WHERE NOT EXISTS (SELECT 1 FROM apu_library WHERE code = '2.4');

INSERT INTO apu_library (code, typology, chronological_order, description, unit, default_yield_per_day, category)
SELECT 
    '2.5', 'residential', 8, 'Replanteo y nivelación de cimientos', 'global', 1.0, 'cimentaciones'
WHERE NOT EXISTS (SELECT 1 FROM apu_library WHERE code = '2.5');

INSERT INTO apu_library (code, typology, chronological_order, description, unit, default_yield_per_day, category)
SELECT 
    '3.1', 'residential', 9, 'Muro de block 15x20x40cm levantado', 'm2', 15.0, 'mamposteria'
WHERE NOT EXISTS (SELECT 1 FROM apu_library WHERE code = '3.1');

INSERT INTO apu_library (code, typology, chronological_order, description, unit, default_yield_per_day, category)
SELECT 
    '3.2', 'residential', 10, 'Columna de block 15x20x40cm con varilla', 'unidad', 3.0, 'mamposteria'
WHERE NOT EXISTS (SELECT 1 FROM apu_library WHERE code = '3.2');

INSERT INTO apu_library (code, typology, chronological_order, description, unit, default_yield_per_day, category)
SELECT 
    '3.3', 'residential', 11, 'Cadena de amarre (dintel) 15x20cm', 'ml', 18.0, 'mamposteria'
WHERE NOT EXISTS (SELECT 1 FROM apu_library WHERE code = '3.3');

INSERT INTO apu_library (code, typology, chronological_order, description, unit, default_yield_per_day, category)
SELECT 
    '3.4', 'residential', 12, 'Castillo de concreto armado 15x20cm', 'ml', 15.0, 'mamposteria'
WHERE NOT EXISTS (SELECT 1 FROM apu_library WHERE code = '3.4');

INSERT INTO apu_library (code, typology, chronological_order, description, unit, default_yield_per_day, category)
SELECT 
    '3.5', 'residential', 13, 'Aplanado de mortero en muros interiores', 'm2', 25.0, 'mamposteria'
WHERE NOT EXISTS (SELECT 1 FROM apu_library WHERE code = '3.5');

INSERT INTO apu_library (code, typology, chronological_order, description, unit, default_yield_per_day, category)
SELECT 
    '3.6', 'residential', 14, 'Aplanado de mortero en muros exteriores', 'm2', 20.0, 'mamposteria'
WHERE NOT EXISTS (SELECT 1 FROM apu_library WHERE code = '3.6');

INSERT INTO apu_library (code, typology, chronological_order, description, unit, default_yield_per_day, category)
SELECT 
    '4.1', 'residential', 15, 'Losa sólida de concreto 0.10m espesor', 'm2', 12.0, 'losas_cubiertas'
WHERE NOT EXISTS (SELECT 1 FROM apu_library WHERE code = '4.1');

INSERT INTO apu_library (code, typology, chronological_order, description, unit, default_yield_per_day, category)
SELECT 
    '4.2', 'residential', 16, 'Losa prefabricada vigueta y bovedilla', 'm2', 25.0, 'losas_cubiertas'
WHERE NOT EXISTS (SELECT 1 FROM apu_library WHERE code = '4.2');

INSERT INTO apu_library (code, typology, chronological_order, description, unit, default_yield_per_day, category)
SELECT 
    '4.3', 'residential', 17, 'Losa prefabricada capa de compresión 0.05m', 'm2', 40.0, 'losas_cubiertas'
WHERE NOT EXISTS (SELECT 1 FROM apu_library WHERE code = '4.3');

INSERT INTO apu_library (code, typology, chronological_order, description, unit, default_yield_per_day, category)
SELECT 
    '4.4', 'residential', 18, 'Malla electrosoldada 6x6-10/10', 'm2', 60.0, 'losas_cubiertas'
WHERE NOT EXISTS (SELECT 1 FROM apu_library WHERE code = '4.4');

INSERT INTO apu_library (code, typology, chronological_order, description, unit, default_yield_per_day, category)
SELECT 
    '4.5', 'residential', 19, 'Pérgola metálica estructural', 'm2', 8.0, 'losas_cubiertas'
WHERE NOT EXISTS (SELECT 1 FROM apu_library WHERE code = '4.5');

INSERT INTO apu_library (code, typology, chronological_order, description, unit, default_yield_per_day, category)
SELECT 
    '4.6', 'residential', 20, 'Tejado de teja de barro tradicional', 'm2', 18.0, 'losas_cubiertas'
WHERE NOT EXISTS (SELECT 1 FROM apu_library WHERE code = '4.6');

INSERT INTO apu_library (code, typology, chronological_order, description, unit, default_yield_per_day, category)
SELECT 
    '5.1', 'residential', 21, 'Piso de loseta cerámica 30x30cm', 'm2', 12.0, 'acabados_interiores'
WHERE NOT EXISTS (SELECT 1 FROM apu_library WHERE code = '5.1');

INSERT INTO apu_library (code, typology, chronological_order, description, unit, default_yield_per_day, category)
SELECT 
    '5.2', 'residential', 22, 'Piso de porcelanato 60x60cm', 'm2', 8.0, 'acabados_interiores'
WHERE NOT EXISTS (SELECT 1 FROM apu_library WHERE code = '5.2');

INSERT INTO apu_library (code, typology, chronological_order, description, unit, default_yield_per_day, category)
SELECT 
    '5.3', 'residential', 23, 'Piso de mármol natural', 'm2', 6.0, 'acabados_interiores'
WHERE NOT EXISTS (SELECT 1 FROM apu_library WHERE code = '5.3');

INSERT INTO apu_library (code, typology, chronological_order, description, unit, default_yield_per_day, category)
SELECT 
    '5.4', 'residential', 24, 'Aplanado fino en paredes interiores', 'm2', 30.0, 'acabados_interiores'
WHERE NOT EXISTS (SELECT 1 FROM apu_library WHERE code = '5.4');

INSERT INTO apu_library (code, typology, chronological_order, description, unit, default_yield_per_day, category)
SELECT 
    '5.5', 'residential', 25, 'Pintura látex interior (2 manos)', 'm2', 40.0, 'acabados_interiores'
WHERE NOT EXISTS (SELECT 1 FROM apu_library WHERE code = '5.5');

INSERT INTO apu_library (code, typology, chronological_order, description, unit, default_yield_per_day, category)
SELECT 
    '5.6', 'residential', 26, 'Cenefa decorativa interior', 'ml', 35.0, 'acabados_interiores'
WHERE NOT EXISTS (SELECT 1 FROM apu_library WHERE code = '5.6');

INSERT INTO apu_library (code, typology, chronological_order, description, unit, default_yield_per_day, category)
SELECT 
    '5.7', 'residential', 27, 'Molduras de yeso interiores', 'ml', 25.0, 'acabados_interiores'
WHERE NOT EXISTS (SELECT 1 FROM apu_library WHERE code = '5.7');

INSERT INTO apu_library (code, typology, chronological_order, description, unit, default_yield_per_day, category)
SELECT 
    '5.8', 'residential', 28, 'Plafón de PVC laminado', 'm2', 15.0, 'acabados_interiores'
WHERE NOT EXISTS (SELECT 1 FROM apu_library WHERE code = '5.8');

INSERT INTO apu_library (code, typology, chronological_order, description, unit, default_yield_per_day, category)
SELECT 
    '6.1', 'residential', 29, 'Aplanado fino en fachadas', 'm2', 25.0, 'acabados_exteriores'
WHERE NOT EXISTS (SELECT 1 FROM apu_library WHERE code = '6.1');

INSERT INTO apu_library (code, typology, chronological_order, description, unit, default_yield_per_day, category)
SELECT 
    '6.2', 'residential', 30, 'Pintura elastomérica exterior', 'm2', 35.0, 'acabados_exteriores'
WHERE NOT EXISTS (SELECT 1 FROM apu_library WHERE code = '6.2');

INSERT INTO apu_library (code, typology, chronological_order, description, unit, default_yield_per_day, category)
SELECT 
    '6.3', 'residential', 31, 'Revestimiento de piedra natural', 'm2', 8.0, 'acabados_exteriores'
WHERE NOT EXISTS (SELECT 1 FROM apu_library WHERE code = '6.3');

INSERT INTO apu_library (code, typology, chronological_order, description, unit, default_yield_per_day, category)
SELECT 
    '6.4', 'residential', 32, 'Cantera decorativa en fachadas', 'm2', 10.0, 'acabados_exteriores'
WHERE NOT EXISTS (SELECT 1 FROM apu_library WHERE code = '6.4');

INSERT INTO apu_library (code, typology, chronological_order, description, unit, default_yield_per_day, category)
SELECT 
    '6.5', 'residential', 33, 'Cornisas y molduras exteriores', 'ml', 20.0, 'acabados_exteriores'
WHERE NOT EXISTS (SELECT 1 FROM apu_library WHERE code = '6.5');

INSERT INTO apu_library (code, typology, chronological_order, description, unit, default_yield_per_day, category)
SELECT 
    '6.6', 'residential', 34, 'Impermeabilización de azoteas', 'm2', 40.0, 'acabados_exteriores'
WHERE NOT EXISTS (SELECT 1 FROM apu_library WHERE code = '6.6');

INSERT INTO apu_library (code, typology, chronological_order, description, unit, default_yield_per_day, category)
SELECT 
    '7.1', 'residential', 35, 'Puerta de madera sólida con marco', 'unidad', 2.0, 'carpinteria_herreria'
WHERE NOT EXISTS (SELECT 1 FROM apu_library WHERE code = '7.1');

INSERT INTO apu_library (code, typology, chronological_order, description, unit, default_yield_per_day, category)
SELECT 
    '7.2', 'residential', 36, 'Ventana de aluminio con vidrio', 'm2', 8.0, 'carpinteria_herreria'
WHERE NOT EXISTS (SELECT 1 FROM apu_library WHERE code = '7.2');

INSERT INTO apu_library (code, typology, chronological_order, description, unit, default_yield_per_day, category)
SELECT 
    '7.3', 'residential', 37, 'Estructura metálica para cubierta', 'kg', 15.0, 'carpinteria_herreria'
WHERE NOT EXISTS (SELECT 1 FROM apu_library WHERE code = '7.3');

INSERT INTO apu_library (code, typology, chronological_order, description, unit, default_yield_per_day, category)
SELECT 
    '7.4', 'residential', 38, 'Barandales de hierro forjado', 'ml', 12.0, 'carpinteria_herreria'
WHERE NOT EXISTS (SELECT 1 FROM apu_library WHERE code = '7.4');

INSERT INTO apu_library (code, typology, chronological_order, description, unit, default_yield_per_day, category)
SELECT 
    '8.1', 'residential', 39, 'Instalación hidráulica completa', 'global', 1.0, 'instalaciones'
WHERE NOT EXISTS (SELECT 1 FROM apu_library WHERE code = '8.1');

INSERT INTO apu_library (code, typology, chronological_order, description, unit, default_yield_per_day, category)
SELECT 
    '8.2', 'residential', 40, 'Instalación eléctrica completa', 'global', 1.0, 'instalaciones'
WHERE NOT EXISTS (SELECT 1 FROM apu_library WHERE code = '8.2');
