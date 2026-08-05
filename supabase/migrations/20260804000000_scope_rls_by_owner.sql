-- ============================================================================
-- 20260804000000: Scope RLS by owner (tenant isolation)
-- ============================================================================
-- Antes: las políticas de escritura para authenticated usaban `USING (true)`,
-- por lo que CUALQUIER usuario autenticado podía leer/escribir/borrar TODAS
-- las filas de todas las tablas. Este cambio define tenencia por proyecto:
-- un usuario solo puede operar sobre filas cuyo proyecto pertenezca a su
-- auth.uid() (vía projects.user_id o vía la ruta project_id → projects).
--
-- Tablas compartidas/catálogo (warehouse_stock y payroll_employees pueden
-- considerarse globales según el diseño) se conservan como authenticated-all,
-- pero las tablas del núcleo del tenant quedan aisladas por dueño.
-- ============================================================================

begin;

-- La tabla projects debe tener user_id (la marcan las Server Actions).
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'projects' and column_name = 'user_id'
  ) then
    alter table public.projects add column user_id uuid references auth.users(id) on delete set null;
  end if;
end $$;

-- Migrar filas de projects existentes sin dueño al usuario que corresponda
-- si es posible deducirlo (en upgrades no hay forma segura; se deja el valor).
-- Cualquier proyecto sin user_id no será visible en modo aislado.

-- Aplica políticas aisladas por dueño para cada tabla del tenant.
-- Formato de cada entrada: tabla|expresion_de_project_id
do $$
declare
  t text;
  tname text;
  expr text;
begin
  foreach t in array array[
    'projects|id',
    'budgets|project_id',
    'financial_transactions|project_id',
    'budget_items|project_id',
    'budget_item_breakdowns|(select project_id from public.budget_items where id = budget_item_breakdowns.budget_item_id)',
    'project_logs|project_id',
    'purchase_orders|project_id',
    'payroll_records|project_id'
  ] loop
    tname := split_part(t, '|', 1);
    expr  := split_part(t, '|', 2);

    -- Saltar tablas inexistentes (idempotente)
    perform 1 from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname = tname;
    if not found then
      raise notice 'Table % missing, skip', tname;
      continue;
    end if;

    raise notice 'Scoping RLS for %', tname;

    -- Limpiar políticas previas (todos los nombres usados en migraciones)
    execute format('DROP POLICY IF EXISTS "Enable all access for %s" ON %I', tname, tname);
    execute format('DROP POLICY IF EXISTS "Allow read access for anon on %s" ON %I', tname, tname);
    execute format('DROP POLICY IF EXISTS "Allow read access for authenticated on %s" ON %I', tname, tname);
    execute format('DROP POLICY IF EXISTS "Allow insert for authenticated on %s" ON %I', tname, tname);
    execute format('DROP POLICY IF EXISTS "Allow update for authenticated on %s" ON %I', tname, tname);
    execute format('DROP POLICY IF EXISTS "Allow delete for authenticated on %s" ON %I', tname, tname);
    execute format('DROP POLICY IF EXISTS "Users can view projects" ON %I', tname);
    execute format('DROP POLICY IF EXISTS "Users can insert projects" ON %I', tname);
    execute format('DROP POLICY IF EXISTS "Users can update projects" ON %I', tname);
    execute format('DROP POLICY IF EXISTS "Users can delete projects" ON %I', tname);

    -- SELECT: dueño del proyecto
    execute format(
      'CREATE POLICY "Owner select %s" ON %I FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = %s AND p.user_id = auth.uid()))',
      tname, tname, expr
    );

    -- INSERT: debe pertenecer a un proyecto del dueño
    execute format(
      'CREATE POLICY "Owner insert %s" ON %I FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = %s AND p.user_id = auth.uid()))',
      tname, tname, expr
    );

    -- UPDATE: dueño del proyecto
    execute format(
      'CREATE POLICY "Owner update %s" ON %I FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = %s AND p.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = %s AND p.user_id = auth.uid()))',
      tname, tname, expr, expr
    );

    -- DELETE: dueño del proyecto
    execute format(
      'CREATE POLICY "Owner delete %s" ON %I FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = %s AND p.user_id = auth.uid()))',
      tname, tname, expr
    );

    -- RLS habilitado y forzado
    execute format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tname);
    execute format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', tname);
  end loop;
end $$;

-- Catálogos/globales: mantener acceso de solo-lectura para anon y escritura para authenticated
-- (sin aislamiento, por diseño 1-tenant). warehouse_stock es un inventario compartido que
-- alimenta las alertas de material en todos los proyectos.
do $$
declare
  t text;
begin
  foreach t in array array['warehouse_stock','payroll_employees','suppliers','clients'] loop
    perform 1 from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname = t;
    if not found then
      continue;
    end if;
    execute format('DROP POLICY IF EXISTS "Enable all access for %s" ON %I', t, t);
    execute format('DROP POLICY IF EXISTS "Allow read access for anon on %s" ON %I', t, t);
    execute format('DROP POLICY IF EXISTS "Allow read access for authenticated on %s" ON %I', t, t);
    execute format('DROP POLICY IF EXISTS "Allow insert for authenticated on %s" ON %I', t, t);
    execute format('DROP POLICY IF EXISTS "Allow update for authenticated on %s" ON %I', t, t);
    execute format('DROP POLICY IF EXISTS "Allow delete for authenticated on %s" ON %I', t, t);
    execute format('CREATE POLICY "Read anon %s" ON %I FOR SELECT TO anon USING (true)', t, t);
    execute format('CREATE POLICY "Read authenticated %s" ON %I FOR SELECT TO authenticated USING (true)', t, t);
    execute format('CREATE POLICY "Write authenticated %s" ON %I FOR INSERT TO authenticated WITH CHECK (true)', t, t);
    execute format('CREATE POLICY "Update authenticated %s" ON %I FOR UPDATE TO authenticated USING (true) WITH CHECK (true)', t, t);
    execute format('CREATE POLICY "Delete authenticated %s" ON %I FOR DELETE TO authenticated USING (true)', t, t);
    execute format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    execute format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
  end loop;
end $$;

commit;