-- 20250201000000: Fix Security - Restrict RLS policies for anon role

-- SECURITY FIX: Replace "all access" policies with read-only for anon role
-- and authenticated-only write policies.
--
-- This migration addresses the Supabase Security Advisors warning about
-- overly permissive RLS policies that allow anonymous users to read AND
-- write to all tables.
--
-- The app currently uses the anon key without authentication, so anon
-- still gets SELECT access. Write operations (INSERT/UPDATE/DELETE) are
-- restricted to authenticated users only.

begin;

-- Helper function to apply security fix to a single table
-- Replaces the "Enable all access" policy with secure policies
do $$
declare
  t text;
  policy_name text;
begin
  -- List of all tables that need policy fixes
  for t in array array[
    'projects',
    'budgets',
    'budget_items',
    'budget_item_breakdowns',
    'financial_transactions',
    'payroll_employees',
    'payroll_records',
    'warehouse_stock',
    'clients',
    'project_logs',
    'suppliers',
    'purchase_orders',
    'purchase_order_items'
  ] loop
    -- Drop the existing "all access" policy
    execute format('DROP POLICY IF EXISTS "Enable all access for %s" ON %I', t, t);

    -- Create secure SELECT policy for anon (read-only)
    execute format('
      CREATE POLICY "Allow read access for anon on %s"
      ON %I FOR SELECT
      USING (true)
    ', t, t);

    -- Create secure INSERT policy for authenticated users only
    execute format('
      CREATE POLICY "Allow insert for authenticated on %s"
      ON %I FOR INSERT
      TO authenticated
      WITH CHECK (true)
    ', t, t);

    -- Create secure UPDATE policy for authenticated users only
    execute format('
      CREATE POLICY "Allow update for authenticated on %s"
      ON %I FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true)
    ', t, t);

    -- Create secure DELETE policy for authenticated users only
    execute format('
      CREATE POLICY "Allow delete for authenticated on %s"
      ON %I FOR DELETE
      TO authenticated
      USING (true)
    ', t, t);

    raise notice 'Fixed policies for table: %', t;
  end loop;
end $$;

-- Verify RLS is enabled on all tables
alter table projects force row level security;
alter table budgets force row level security;
alter table budget_items force row level security;
alter table budget_item_breakdowns force row level security;
alter table financial_transactions force row level security;
alter table payroll_employees force row level security;
alter table payroll_records force row level security;
alter table warehouse_stock force row level security;
alter table clients force row level security;
alter table project_logs force row level security;
alter table suppliers force row level security;
alter table purchase_orders force row level security;
alter table purchase_order_items force row level security;

commit;
