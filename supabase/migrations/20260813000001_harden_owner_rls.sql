-- Harden tenant isolation for legacy global policies.
-- The preflight confirmed one active owner and four legacy rows without user_id.
-- Backfill those rows before enforcing owner-only access.

BEGIN;

UPDATE public.purchase_order_items poi
SET user_id = po.user_id
FROM public.purchase_orders po
WHERE poi.purchase_order_id = po.id
  AND poi.user_id IS NULL
  AND po.user_id IS NOT NULL;

UPDATE public.purchase_order_items poi
SET user_id = p.user_id
FROM public.purchase_orders po
JOIN public.projects p ON p.id = po.project_id
WHERE poi.purchase_order_id = po.id
  AND poi.user_id IS NULL
  AND p.user_id IS NOT NULL;

UPDATE public.payroll_employees pe
SET user_id = owner.user_id
FROM (
  SELECT user_id
  FROM public.projects
  WHERE user_id IS NOT NULL
  GROUP BY user_id
  ORDER BY user_id
  LIMIT 1
) owner
WHERE pe.user_id IS NULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.purchase_order_items WHERE user_id IS NULL)
     OR EXISTS (SELECT 1 FROM public.payroll_employees WHERE user_id IS NULL) THEN
    RAISE EXCEPTION 'Cannot enforce owner RLS: legacy rows still have NULL user_id';
  END IF;
END $$;

-- Remove legacy policies that granted global reads/writes, including anonymous reads.
DROP POLICY IF EXISTS "Read anon clients" ON public.clients;
DROP POLICY IF EXISTS "Read authenticated clients" ON public.clients;
DROP POLICY IF EXISTS "Write authenticated clients" ON public.clients;
DROP POLICY IF EXISTS "Update authenticated clients" ON public.clients;
DROP POLICY IF EXISTS "Delete authenticated clients" ON public.clients;

DROP POLICY IF EXISTS "Read anon suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Read authenticated suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Write authenticated suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Update authenticated suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Delete authenticated suppliers" ON public.suppliers;

DROP POLICY IF EXISTS "Read anon warehouse_stock" ON public.warehouse_stock;
DROP POLICY IF EXISTS "Read authenticated warehouse_stock" ON public.warehouse_stock;
DROP POLICY IF EXISTS "Write authenticated warehouse_stock" ON public.warehouse_stock;
DROP POLICY IF EXISTS "Update authenticated warehouse_stock" ON public.warehouse_stock;
DROP POLICY IF EXISTS "Delete authenticated warehouse_stock" ON public.warehouse_stock;

DROP POLICY IF EXISTS "Read anon payroll_employees" ON public.payroll_employees;
DROP POLICY IF EXISTS "Read authenticated payroll_employees" ON public.payroll_employees;
DROP POLICY IF EXISTS "Write authenticated payroll_employees" ON public.payroll_employees;
DROP POLICY IF EXISTS "Update authenticated payroll_employees" ON public.payroll_employees;
DROP POLICY IF EXISTS "Delete authenticated payroll_employees" ON public.payroll_employees;

DROP POLICY IF EXISTS "Subcontractors are viewable by authenticated users" ON public.subcontractors;
DROP POLICY IF EXISTS "Subcontractors are insertable by authenticated users" ON public.subcontractors;
DROP POLICY IF EXISTS "Subcontractors are updatable by authenticated users" ON public.subcontractors;
DROP POLICY IF EXISTS "Subcontractors are deletable by authenticated users" ON public.subcontractors;

DROP POLICY IF EXISTS "Allow read access for authenticated on purchase_order_items" ON public.purchase_order_items;

-- Subcontractors previously had authenticated-global policies; make them owner-scoped.
DROP POLICY IF EXISTS "Users can view own subcontractors" ON public.subcontractors;
DROP POLICY IF EXISTS "Users can insert own subcontractors" ON public.subcontractors;
DROP POLICY IF EXISTS "Users can update own subcontractors" ON public.subcontractors;
DROP POLICY IF EXISTS "Users can delete own subcontractors" ON public.subcontractors;

CREATE POLICY "Users can view own subcontractors"
  ON public.subcontractors FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Users can insert own subcontractors"
  ON public.subcontractors FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own subcontractors"
  ON public.subcontractors FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own subcontractors"
  ON public.subcontractors FOR DELETE TO authenticated
  USING (user_id = auth.uid());

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients FORCE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers FORCE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_stock FORCE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_employees FORCE ROW LEVEL SECURITY;
ALTER TABLE public.subcontractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcontractors FORCE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items FORCE ROW LEVEL SECURITY;

COMMENT ON TABLE public.subcontractors IS 'Subcontratistas aislados por propietario autenticado';

COMMIT;
