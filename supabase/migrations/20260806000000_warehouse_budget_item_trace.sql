-- ============================================================================
-- 20260806000000: Trazabilidad warehouse_stock → budget_items
-- ============================================================================
-- Agrega budget_item_id a warehouse_stock para trazar cada material de almacén
-- de vuelta al renglón (budget_item) del presupuesto que lo generó. Permite la
-- gráfica "presupuestado vs real" por renglón (cantidad estimada vs consumida)
-- y el control de materiales pedidos/faltantes por renglón.
-- ============================================================================

begin;

alter table public.warehouse_stock
  add column if not exists budget_item_id uuid references public.budget_items(id) on delete set null;

create index if not exists idx_warehouse_stock_budget_item_id
  on public.warehouse_stock (budget_item_id);

commit;
