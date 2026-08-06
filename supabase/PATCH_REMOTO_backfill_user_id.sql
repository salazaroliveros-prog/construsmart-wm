-- ============================================================================
-- PATCH SEGURO PARA DB REMOTA: Backfill de user_id (preparación para RLS por dueño)
-- CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"
--
-- ⚠️  EJECUTAR EN: Supabase Dashboard → SQL Editor (proyecto yibjsruoxjlgdnkgylld)
--
-- Motivo: antes de activar la RLS por dueño (migración 20260804000000), todos
-- los proyectos existentes deben tener un user_id que coincida con el admin.
-- Si no se rellena, la política `EXISTS (... AND p.user_id = auth.uid())`
-- ocultaría TODOS los registros existentes.
--
-- Este script es 100% idempotente y NO destructivo:
--   • Resuelve el user_id del admin desde auth.users por email.
--   • Asigna ese user_id a los proyectos que no tienen dueño.
--   • Por robustez, si alguna tabla del tenant tuviera columna user_id, la
--     rellena desde su proyecto padre (protegida por IF EXISTS).
-- Puede ejecutarse todas las veces sin efectos secundarios.
-- ============================================================================

-- 1) Identificar el user_id del administrador (ajusta el email si cambia).
DO $$
DECLARE
  v_admin_id uuid := NULL;
BEGIN
  SELECT id INTO v_admin_id
  FROM auth.users
  WHERE lower(email) = lower('salazaroliveros@gmail.com')
  LIMIT 1;

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró el usuario admin en auth.users. Revisa el email o crea el usuario primero.';
  END IF;

  -- 2) Backfill de PROYECTOS sin dueño (tabla raíz del tenant).
  UPDATE public.projects
     SET user_id = v_admin_id
   WHERE user_id IS NULL;

  RAISE NOTICE 'Admin user_id = %', v_admin_id;
END $$;

-- ============================================================================
-- REFUERZO DEFENSIVO (opcional, idempotente):
-- Si alguna de estas tablas del tenant tuviera columna user_id, se rellena
-- desde el user_id de su proyecto padre. Solo actúa si la columna existe.
-- ============================================================================
DO $$
DECLARE
  v_project_id_expr uuid := NULL;
  v_admin_id uuid := NULL;
BEGIN
  SELECT id INTO v_admin_id FROM auth.users
  WHERE lower(email) = lower('salazaroliveros@gmail.com') LIMIT 1;
  IF v_admin_id IS NULL THEN RETURN; END IF;

  -- budgets
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='budgets' AND column_name='user_id') THEN
    UPDATE public.budgets b SET user_id = COALESCE(p.user_id, v_admin_id)
    FROM public.projects p WHERE p.id = b.project_id AND b.user_id IS NULL;
  END IF;

  -- budget_items
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='budget_items' AND column_name='user_id') THEN
    UPDATE public.budget_items bi SET user_id = COALESCE(p.user_id, v_admin_id)
    FROM public.budgets b LEFT JOIN public.projects p ON p.id = b.project_id
    WHERE b.id = bi.budget_id AND bi.user_id IS NULL;
  END IF;

  -- financial_transactions
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='financial_transactions' AND column_name='user_id') THEN
    UPDATE public.financial_transactions ft SET user_id = COALESCE(p.user_id, v_admin_id)
    FROM public.projects p WHERE p.id = ft.project_id AND ft.user_id IS NULL;
  END IF;

  -- project_logs
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='project_logs' AND column_name='user_id') THEN
    UPDATE public.project_logs pl SET user_id = COALESCE(p.user_id, v_admin_id)
    FROM public.projects p WHERE p.id = pl.project_id AND pl.user_id IS NULL;
  END IF;

  -- purchase_orders
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='purchase_orders' AND column_name='user_id') THEN
    UPDATE public.purchase_orders po SET user_id = COALESCE(p.user_id, v_admin_id)
    FROM public.projects p WHERE p.id = po.project_id AND po.user_id IS NULL;
  END IF;

  -- payroll_records
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='payroll_records' AND column_name='user_id') THEN
    UPDATE public.payroll_records pr SET user_id = COALESCE(p.user_id, v_admin_id)
    FROM public.projects p WHERE p.id = pr.project_id AND pr.user_id IS NULL;
  END IF;
END $$;

-- ============================================================================
-- VERIFICACIÓN: tras ejecutar, confirma que no queden proyectos huérfanos.
--   SELECT count(*) FROM public.projects WHERE user_id IS NULL;
--   SELECT user_id, count(*) FROM public.projects GROUP BY user_id;
-- ============================================================================
