-- Reconcile columns required by the local sync model.
-- Additive and idempotent: safe to apply to an existing remote database.

ALTER TABLE public.project_logs
  ADD COLUMN IF NOT EXISTS sync_attempts integer NOT NULL DEFAULT 0;

ALTER TABLE public.budget_items
  ADD COLUMN IF NOT EXISTS category text;

ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS sync_attempts integer NOT NULL DEFAULT 0;

ALTER TABLE public.purchase_order_items
  ADD COLUMN IF NOT EXISTS sync_attempts integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.project_logs.sync_attempts IS 'Number of remote synchronization attempts';
COMMENT ON COLUMN public.budget_items.category IS 'Budget item category used by warehouse and analytics integrations';
COMMENT ON COLUMN public.purchase_orders.sync_attempts IS 'Number of remote synchronization attempts';
COMMENT ON COLUMN public.purchase_order_items.sync_attempts IS 'Number of remote synchronization attempts';
