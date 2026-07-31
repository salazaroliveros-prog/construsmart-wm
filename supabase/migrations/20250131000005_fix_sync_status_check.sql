-- CONSTRUCTORA WM/M&S - REPARACIÓN CHECK sync_status
-- El bloque 6 de 20250131000004 generó el CHECK como un único literal
-- (IN ('synced,created_offline,...')) debido al uso de %L. Esta migración
-- reconstruye el constraint con la lista de valores correcta.
DO $$
DECLARE
  t text;
  cons text;
BEGIN
  FOREACH t IN ARRAY ARRAY['clients', 'project_logs', 'suppliers', 'purchase_orders', 'purchase_order_items'] LOOP
    FOR cons IN
      SELECT c.conname
      FROM pg_constraint c
      JOIN pg_class rel ON rel.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = rel.relnamespace
      WHERE rel.relname = t AND n.nspname = 'public' AND c.contype = 'c'
        AND pg_get_constraintdef(c.oid) LIKE '%sync_status%'
    LOOP
      EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', t, cons);
    END LOOP;

    EXECUTE format(
      'ALTER TABLE %I ADD CONSTRAINT %I CHECK (sync_status IN (%s))',
      t,
      t || '_sync_status_check',
      (SELECT string_agg(quote_literal(v), ',' ORDER BY v)
       FROM unnest(ARRAY['synced','created_offline','updated_offline','pending','deleted']) v)
    );
  END LOOP;
END $$;
