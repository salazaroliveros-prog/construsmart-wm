-- ============================================================================
-- 20260808000000: Fix financial_transactions missing fields
-- ============================================================================
-- Agrega campos críticos faltantes para soportar integración Payroll → Financial,
-- tracking de impuestos, y conciliación bancaria. Resuelve desalineación con offlineDB v10.
-- ============================================================================

begin;

-- Agregar campos faltantes críticos a financial_transactions
ALTER TABLE financial_transactions 
ADD COLUMN IF NOT EXISTS payment_method TEXT 
CHECK (payment_method IN ('efectivo', 'transferencia', 'cheque', 'tarjeta', 'anticipo'));

ALTER TABLE financial_transactions 
ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(14,2) DEFAULT 0;

ALTER TABLE financial_transactions 
ADD COLUMN IF NOT EXISTS related_supplier_id UUID 
REFERENCES suppliers(id) ON DELETE SET NULL;

ALTER TABLE financial_transactions 
ADD COLUMN IF NOT EXISTS related_client_id UUID 
REFERENCES clients(id) ON DELETE SET NULL;

ALTER TABLE financial_transactions 
ADD COLUMN IF NOT EXISTS related_purchase_order_id UUID 
REFERENCES purchase_orders(id) ON DELETE SET NULL;

ALTER TABLE financial_transactions 
ADD COLUMN IF NOT EXISTS document_number TEXT;

ALTER TABLE financial_transactions 
ADD COLUMN IF NOT EXISTS is_reconciled BOOLEAN DEFAULT FALSE;

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_financial_transactions_payment_method 
ON financial_transactions(payment_method);

CREATE INDEX IF NOT EXISTS idx_financial_transactions_related_supplier_id 
ON financial_transactions(related_supplier_id);

CREATE INDEX IF NOT EXISTS idx_financial_transactions_related_client_id 
ON financial_transactions(related_client_id);

CREATE INDEX IF NOT EXISTS idx_financial_transactions_related_purchase_order_id 
ON financial_transactions(related_purchase_order_id);

CREATE INDEX IF NOT EXISTS idx_financial_transactions_document_number 
ON financial_transactions(document_number);

CREATE INDEX IF NOT EXISTS idx_financial_transactions_is_reconciled 
ON financial_transactions(is_reconciled);

-- Comentarios para documentación
COMMENT ON COLUMN financial_transactions.payment_method IS 'Método de pago (efectivo, transferencia, cheque, tarjeta, anticipo)';
COMMENT ON COLUMN financial_transactions.tax_amount IS 'Monto de impuestos/IVA incluidos en la transacción';
COMMENT ON COLUMN financial_transactions.related_supplier_id IS 'Vinculación con proveedor para tracking de pagos';
COMMENT ON COLUMN financial_transactions.related_client_id IS 'Vinculación con cliente para tracking de pagos';
COMMENT ON COLUMN financial_transactions.related_purchase_order_id IS 'Vinculación con orden de compra relacionada';
COMMENT ON COLUMN financial_transactions.document_number IS 'Número de factura/recibo/comprobante';
COMMENT ON COLUMN financial_transactions.is_reconciled IS 'Estado de conciliación bancaria (true=reconciliado)';

commit;