-- ============================================================================
-- 20260808000001: Fix subcontractors missing fields
-- ============================================================================
-- Agrega campos faltantes para soportar gestión completa de contratos de
-- subcontratistas. Resuelve desalineación con offlineDB v10.
-- ============================================================================

begin;

-- Agregar campos faltantes a subcontractors
ALTER TABLE subcontractors 
ADD COLUMN IF NOT EXISTS contract_start_date DATE;

ALTER TABLE subcontractors 
ADD COLUMN IF NOT EXISTS contract_end_date DATE;

ALTER TABLE subcontractors 
ADD COLUMN IF NOT EXISTS contract_value NUMERIC(15,2) DEFAULT 0;

ALTER TABLE subcontractors 
ADD COLUMN IF NOT EXISTS status TEXT 
CHECK (status IN ('active', 'suspended', 'completed'));

ALTER TABLE subcontractors 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_subcontractors_status 
ON subcontractors(status);

CREATE INDEX IF NOT EXISTS idx_subcontractors_contract_dates 
ON subcontractors(contract_start_date, contract_end_date);

-- Comentarios para documentación
COMMENT ON COLUMN subcontractors.contract_start_date IS 'Fecha de inicio del contrato';
COMMENT ON COLUMN subcontractors.contract_end_date IS 'Fecha de finalización del contrato';
COMMENT ON COLUMN subcontractors.contract_value IS 'Valor total del contrato en GTQ';
COMMENT ON COLUMN subcontractors.status IS 'Estado del contrato (active, suspended, completed)';
COMMENT ON COLUMN subcontractors.notes IS 'Notas adicionales sobre el subcontratista';

commit;