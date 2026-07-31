# Database Migration Guide - CONSTRUCTORA WM/M&S

## Database Status ✅

All required tables exist in Supabase:
- ✅ projects
- ✅ budgets
- ✅ budget_items
- ✅ budget_item_breakdowns
- ✅ financial_transactions
- ✅ payroll_employees
- ✅ payroll_records
- ✅ warehouse_stock
- ✅ suppliers
- ✅ purchase_orders
- ✅ purchase_order_items
- ✅ clients
- ✅ project_logs

## Missing APU Integration Columns ❌

The following columns need to be added to support APU functionality:
- ❌ `budget_items.apu_result` (JSONB)
- ❌ `budget_items.apu_params` (JSONB)

## Migration Steps

### Option 1: Using Supabase SQL Editor (Recommended)

1. Go to your Supabase project dashboard: https://app.supabase.com
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar
4. Click **"New Query"**
5. Copy and paste the SQL below:
```sql
-- ============================================================================
-- APU Integration for CONSTRUCTORA WM/M&S
-- ============================================================================

-- Update budget_items table to include APU fields
ALTER TABLE budget_items 
ADD COLUMN IF NOT EXISTS apu_result JSONB,
ADD COLUMN IF NOT EXISTS apu_params JSONB;

-- Add comment to explain APU fields
COMMENT ON COLUMN budget_items.apu_result IS 'APU calculation results including breakdown (materials, labor, machinery)';
COMMENT ON COLUMN budget_items.apu_params IS 'APU input parameters for re-calculation';

-- Add index for budget_id to improve query performance
CREATE INDEX IF NOT EXISTS idx_budget_items_budget_id ON budget_items(budget_id);

-- Add index for project_id via budget for budget queries
CREATE INDEX IF NOT EXISTS idx_budgets_project_id ON budgets(project_id);
```

6. Click **"Run"** to execute the migration
7. Verify success by checking the Schema tab

### Option 2: Using the Verification Script

Run the verification script to check the current status:
```bash
node scripts/sync-database.js
```

This will show you which tables/columns are missing and provide the SQL to run.

## What These Columns Do

### `apu_result` (JSONB)
Stores the complete APU calculation results including:
- `totalMaterialQuantity`: Total material quantity after waste and volumetric factors
- `unitLaborCost`: Cost per unit of labor
- `directCost`: Total direct cost
- `indirectCost`: Total indirect cost
- `totalCost`: Final total cost
- `breakdown`: Breakdown by category (materials, labor, machinery)

### `apu_params` (JSONB)
Stores the input parameters used for APU calculation:
- `theoreticalQuantity`: Base quantity before adjustments
- `wastePercentage`: Waste percentage applied
- `volumetricFactor`: Volumetric factor from topography
- `crewDailySalary`: Daily salary of the crew
- `dailyPerformance`: Daily performance rate
- `indirectPercentage`: Indirect cost percentage
- `materialUnitCost`: Cost per unit of material
- `machineryCost`: Machinery cost

## Verification After Migration

After running the migration, verify by running:
```bash
node scripts/sync-database.js
```

You should see:
```
✅ budget_items.apu_result
✅ budget_items.apu_params
```

## Complete Schema Reference

For the complete database schema, see:
- `supabase/migrations/create_all_tables.sql` - Full schema definition
- `lib/db/offlineStore.ts` - TypeScript interfaces matching the schema

## Troubleshooting

### Permission Errors
If you get permission errors, ensure your Supabase project has the correct RLS policies or use the service role key for migrations.

### Column Already Exists
The migration uses `IF NOT EXISTS` so it's safe to run multiple times. It will skip columns that already exist.

### Rollback
If needed, you can remove the columns:
```sql
ALTER TABLE budget_items DROP COLUMN IF EXISTS apu_result;
ALTER TABLE budget_items DROP COLUMN IF EXISTS apu_params;
```
