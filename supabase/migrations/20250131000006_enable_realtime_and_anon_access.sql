-- 20250131000006: Acceso anon para módulos nuevos + Realtime
--
-- La app usa la anon key sin login. Las tablas de módulos nuevos solo tenían
-- políticas para "authenticated", por lo que el motor de sync y Realtime no
-- podían leerlas/escribirlas. Se agregan políticas "all access" para anon
-- (mismo modelo que las tablas originales) y se habilita la publicación
-- Realtime para todas las tablas de la app.
begin;

-- 1) Políticas RLS "all access" (anon) para tablas de módulos nuevos
do $$
declare
  t text;
begin
  foreach t in array array['clients','project_logs','suppliers','purchase_orders','purchase_order_items']
  loop
    execute format('DROP POLICY IF EXISTS "Enable all access for %s" ON %I', t, t);
    execute format('CREATE POLICY "Enable all access for %s" ON %I FOR ALL USING (true) WITH CHECK (true)', t, t);
  end loop;
end $$;

-- 2) Habilitar Realtime (publicación supabase_realtime) para las tablas de la app
do $$
declare
  t text;
begin
  foreach t in array array['projects','budgets','budget_items','financial_transactions','payroll_employees','payroll_records','warehouse_stock','clients','project_logs','suppliers','purchase_orders','purchase_order_items']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    end if;
  end loop;
end $$;

commit;
