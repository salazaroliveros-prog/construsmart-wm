-- Repair missing column in budgets
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS duration_days INTEGER DEFAULT 0;

-- Repair realtime: add budget_item_breakdowns if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'budget_item_breakdowns'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.budget_item_breakdowns;
  END IF;
END $$;
