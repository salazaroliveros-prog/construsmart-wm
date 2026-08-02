-- ============================================================================
-- 20260201000000: Fix Security Advisor warnings
-- ============================================================================
-- Corrige los warnings detectados por el Security Advisor de Supabase:
--
-- 1. function_search_path_mutable: `public.update_updated_at_column()` tiene
--    search_path mutable → se fija `SET search_path = ''`.
-- 2. rls_policy_always_true (13 tablas): se eliminan las políticas inseguras
--    "Enable all access for X" (`FOR ALL USING(true) WITH CHECK(true)`) y se
--    garantizan políticas por rol: SELECT solo-lectura para anon (necesario,
--    la app usa la anon key sin auth) y escritura solo para authenticated.
-- 3. anon_security_definer_function_executable: `public.rls_auto_enable()`
--    (SECURITY DEFINER) deja de ser ejecutable por anon.
-- 4. authenticated_security_definer_function_executable: la misma función deja
--    de ser ejecutable por authenticated.
-- 5. auth_leaked_password_protection: requiere plan Pro (HaveIBeenPwned).
--    No se puede resolver vía SQL; se habilita en el dashboard (Settings → Auth)
--    o vía Management API PATCH /config/auth con `password_hibp_enabled: true`.
-- ============================================================================

begin;

-- ============================================================================
-- 1. FIX function_search_path_mutable
--    Fija search_path seguro para la función de triggers update_updated_at_column
-- ============================================================================
do $$
begin
  if exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'update_updated_at_column'
  ) then
    execute 'ALTER FUNCTION public.update_updated_at_column() SET search_path = ''''';
  end if;
end $$;

-- ============================================================================
-- 3 & 4. FIX anon/authenticated_security_definer_function_executable
--    Revocar EXECUTE de rls_auto_enable a los roles de la API y PUBLIC
--    (La función no es usada por la app: no existe en el repo, solo fue
--     creada manualmente en la DB. No debe ser invocable vía /rest/v1/rpc.)
-- ============================================================================
do $$
begin
  if exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'rls_auto_enable'
  ) then
    revoke execute on function public.rls_auto_enable() from public;
    revoke execute on function public.rls_auto_enable() from anon;
    revoke execute on function public.rls_auto_enable() from authenticated;
  end if;
end $$;

-- ============================================================================
-- 2. FIX rls_policy_always_true
--    Eliminar políticas inseguras y garantizar políticas por rol.
--    Solo se procesan tablas que existen (pg_class) para ser idempotente.
--    NOTA: se usa FOREACH (no `for t in array array[...]`) porque el runner
--    de migraciones de Supabase (pg-meta) rechaza la sintaxis `array array[...]`.
-- ============================================================================
do $$
declare
  t text;
  tbl oid;
  tables text[] := array[
    'projects','budgets','budget_items','budget_item_breakdowns',
    'financial_transactions','payroll_employees','payroll_records',
    'warehouse_stock','clients','project_logs','suppliers',
    'purchase_orders','purchase_order_items'
  ];
begin
  foreach t in array tables loop
    -- Saltar tablas inexistentes
    select c.oid into tbl
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = t;

    if tbl is null then
      raise notice 'Table % does not exist, skipping', t;
      continue;
    end if;

    -- Drop la política insegura "all access" si existe (la recreó repair-remote-db.sql)
    execute format('DROP POLICY IF EXISTS "Enable all access for %s" ON %I', t, t);

    -- SELECT para anon: solo-lectura (la app usa anon key sin auth, requiere leer)
    execute format('DROP POLICY IF EXISTS "Allow read access for anon on %s" ON %I', t, t);
    execute format(
      'CREATE POLICY "Allow read access for anon on %s" ON %I FOR SELECT TO anon USING (true)',
      t, t
    );

    -- SELECT para authenticated
    execute format('DROP POLICY IF EXISTS "Allow read access for authenticated on %s" ON %I', t, t);
    execute format(
      'CREATE POLICY "Allow read access for authenticated on %s" ON %I FOR SELECT TO authenticated USING (true)',
      t, t
    );

    -- INSERT solo para authenticated
    execute format('DROP POLICY IF EXISTS "Allow insert for authenticated on %s" ON %I', t, t);
    execute format(
      'CREATE POLICY "Allow insert for authenticated on %s" ON %I FOR INSERT TO authenticated WITH CHECK (true)',
      t, t
    );

    -- UPDATE solo para authenticated
    execute format('DROP POLICY IF EXISTS "Allow update for authenticated on %s" ON %I', t, t);
    execute format(
      'CREATE POLICY "Allow update for authenticated on %s" ON %I FOR UPDATE TO authenticated USING (true) WITH CHECK (true)',
      t, t
    );

    -- DELETE solo para authenticated
    execute format('DROP POLICY IF EXISTS "Allow delete for authenticated on %s" ON %I', t, t);
    execute format(
      'CREATE POLICY "Allow delete for authenticated on %s" ON %I FOR DELETE TO authenticated USING (true)',
      t, t
    );

    -- RLS: habilitar y forzar (FORCE requiere RLS ya habilitado)
    execute format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    execute format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);

    raise notice 'Fixed policies for table: %', t;
  end loop;
end $$;

commit;

-- ============================================================================
-- 5. auth_leaked_password_protection (NO vía SQL)
--    Habilitar en dashboard: Authentication → Policies → "Leaked password protection"
--    o vía Management API:
--      PATCH https://api.supabase.com/v1/projects/{ref}/config/auth
--      Body: { "password_hibp_enabled": true }
--    Requiere plan Pro (HaveIBeenPwned.org).
-- ============================================================================

