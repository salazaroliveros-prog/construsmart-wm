# 🚀 Database Migration - APU Integration

## Current Status

✅ **All tables exist** in Supabase database  
❌ **Missing APU columns** in `budget_items` table

## Quick Migration (2 minutes)

### Step 1: Go to Supabase SQL Editor
1. Open: https://app.supabase.com
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **"New Query"**

### Step 2: Copy and Paste This SQL

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

### Step 3: Execute
1. Click **"Run"** button
2. Wait for success message
3. Verify: You should see "Success. No rows returned"

### Step 4: Verify Migration
Run this command in your project directory:
```bash
node scripts/sync-database.js
```

Expected output:
```
✅ budget_items.apu_result
✅ budget_items.apu_params
```

## What This Migration Does

Adds two JSONB columns to the `budget_items` table:

- **`apu_result`**: Stores complete APU calculation results (materials, labor, machinery breakdown)
- **`apu_params`**: Stores input parameters for re-calculation (volumetric factors, waste percentages, etc.)

This enables:
- ✅ Full APU data persistence in remote database
- ✅ Detailed breakdown tracking by category
- ✅ Re-calculation capabilities
- ✅ Topography integration with volumetric factors

## Troubleshooting

### "Column already exists"
This is normal. The migration uses `IF NOT EXISTS` so it's safe to run multiple times.

### Permission denied
Ensure you have admin access to the Supabase project. Use the project owner's account.

### Need to rollback?
Run this in SQL Editor:
```sql
ALTER TABLE budget_items DROP COLUMN IF EXISTS apu_result;
ALTER TABLE budget_items DROP COLUMN IF EXISTS apu_params;
```

## Files Created

- `supabase/migrations/add_apu_integration.sql` - Migration SQL
- `supabase/migrations/create_all_tables.sql` - Complete schema reference
- `scripts/sync-database.js` - Verification script
- `DATABASE_MIGRATION.md` - Detailed migration guide

## Support

If you encounter issues:
1. Check Supabase project status: https://app.supabase.com
2. Verify your credentials in `.env.local`
3. Run verification script: `node scripts/sync-database.js`
