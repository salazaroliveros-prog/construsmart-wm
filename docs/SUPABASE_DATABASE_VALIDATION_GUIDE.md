# SUPABASE DATABASE VALIDATION GUIDE
## CONSTRUCTORA WM/M&S ERP Suite - "CONSTRUYENDO EL FUTURO"

---

## 📋 OVERVIEW

This guide provides step-by-step instructions for validating and aligning the remote Supabase database with the exponential upgrade changes implemented in the local suite.

---

## 🔍 VALIDATION PROCESS

### Step 1: Validate Current Schema Status

Run the schema validation script to check the current state of your Supabase database:

```bash
npx tsx scripts/validate-supabase-schema.ts
```

This will:
- Check all 12 tables for existence
- Verify column alignment with TypeScript interfaces
- Generate a detailed validation report
- Provide recommendations for any misalignments

**Expected Output:**
- ✅ Aligned: All tables and columns match
- ⚠️ Partial: Some columns missing
- ❌ Misaligned: Tables missing or major column discrepancies

---

## 🔄 MIGRATION PROCESS

### Step 2: Apply Migration Script (if needed)

If the validation report indicates misalignments, apply the migration script:

**Option A: Via Supabase SQL Editor**
1. Go to Supabase Dashboard → SQL Editor
2. Copy the entire content of `supabase/migrations/upgrade_to_v8.sql`
3. Paste into SQL Editor
4. Execute the script
5. Review execution logs for any errors

**Option B: Via Supabase CLI**
```bash
supabase db push
```

This will automatically apply any pending migrations.

---

## 📊 NEW TABLE STRUCTURES

### Projects Table
**New Columns:**
- `has_critical_roadblock` (BOOLEAN) - Flag for critical roadblocks
- `roadblock_type` (TEXT) - Type of roadblock (clima, material, personal, técnico, permiso, financiero, otro)
- `roadblock_description` (TEXT) - Description of the roadblock
- `roadblock_date` (DATE) - Date when roadblock was detected
- `completion_buffer_days` (INTEGER) - Days remaining before deadline

**New Indexes:**
- `idx_projects_has_critical_roadblock`
- `idx_projects_roadblock_type`

### Clients Table
**New Columns:**
- `account_balance` (DECIMAL) - Current account balance in GTQ
- `credit_limit` (DECIMAL) - Credit limit for the client
- `payment_terms_days` (INTEGER) - Payment terms in days
- `is_delinquent` (BOOLEAN) - Flag for overdue payments

**New Indexes:**
- `idx_clients_account_balance`
- `idx_clients_is_delinquent`

### Warehouse Stock Table
**New Columns:**
- `preferred_supplier_id` (TEXT) - Reference to preferred supplier
- `auto_generate_po` (BOOLEAN) - Auto-generate PO flag
- `last_po_date` (DATE) - Date of last purchase order
- `category` (TEXT) - Material category for supplier routing

**New Indexes:**
- `idx_warehouse_stock_preferred_supplier`
- `idx_warehouse_stock_auto_generate_po`
- `idx_warehouse_stock_category`

**Foreign Key:**
- `fk_warehouse_stock_supplier` → suppliers(id)

### Suppliers Table
**New Columns:**
- `categories` (TEXT[]) - Array of material categories
- `is_preferred` (BOOLEAN) - Preferred supplier flag

**New Indexes:**
- `idx_suppliers_categories` (GIN index)
- `idx_suppliers_is_preferred`

### Payroll Records Table
**New Columns:**
- `total_hours` (DECIMAL) - Total hours worked (regular + overtime)
- `hourly_rate` (DECIMAL) - Hourly rate calculated from daily rate
- `planned_hours` (DECIMAL) - Planned hours for the task
- `budget_item_id` (TEXT) - Reference to budget item
- `cost_overrun_amount` (DECIMAL) - Calculated cost overrun
- `is_overrun_warning_fired` (BOOLEAN) - Flag for warning transaction

**New Indexes:**
- `idx_payroll_records_budget_item`
- `idx_payroll_records_overrun_warning`

**Foreign Key:**
- `fk_payroll_records_budget_item` → budget_items(id)

### Project Logs Table
**New Columns:**
- `is_critical_roadblock` (BOOLEAN) - Flag for critical roadblock logs
- `roadblock_category` (TEXT) - Category of roadblock
- `severity` (TEXT) - Severity level (low, medium, high, critical)

**New Indexes:**
- `idx_project_logs_is_critical_roadblock`
- `idx_project_logs_roadblock_category`
- `idx_project_logs_severity`

### Financial Transactions Table
**New Columns:**
- `reference` (TEXT) - Reference to related record (e.g., payroll ID)

**New Indexes:**
- `idx_financial_transactions_reference`

---

## 🔒 ROW LEVEL SECURITY (RLS)

The migration script includes RLS policy updates. Ensure your authentication strategy is properly configured:

**Policies Added:**
- Projects: Read/Write based on user_id
- Similar policies for other tables (adjust based on your auth strategy)

**Important:** Review and customize RLS policies based on your actual authentication and authorization requirements.

---

## ✅ VALIDATION CHECKLIST

After migration, verify:

- [ ] All 12 tables exist in Supabase
- [ ] All new columns are present
- [ ] Foreign key constraints are created
- [ ] Indexes are created for performance
- [ ] RLS policies are enabled
- [ ] Default values are applied
- [ ] Existing data is migrated correctly
- [ ] Validation script shows all tables as "aligned"

---

## 🚀 POST-MIGRATION STEPS

1. **Test Sync Functionality**
   - Create a test project
   - Add a project log with critical keywords
   - Verify roadblock detection works
   - Check that Supabase sync operates correctly

2. **Test New Features**
   - Test client balance integration
   - Test auto-PO generation
   - Test EVM calculations
   - Test labor cost overrun detection

3. **Monitor Performance**
   - Check query performance with new indexes
   - Monitor sync operations
   - Review Supabase logs for any errors

---

## 📝 TROUBLESHOOTING

### Migration Errors

**Error: Column already exists**
- Solution: The migration script uses `IF NOT EXISTS`, so this should not occur. If it does, manually check the column and skip that step.

**Error: Foreign key constraint fails**
- Solution: Ensure the referenced table and ID exist before adding the constraint. Run in stages if needed.

**Error: RLS policy conflicts**
- Solution: Review existing policies and adjust the migration script to match your current setup.

### Validation Errors

**Error: Supabase client not initialized**
- Solution: Ensure environment variables `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set correctly.

**Error: Permission denied**
- Solution: Ensure your Supabase user has sufficient permissions to query the database schema.

---

## 📚 ADDITIONAL RESOURCES

- Supabase Documentation: https://supabase.com/docs
- TypeScript Interfaces: `lib/db/offlineStore.ts`
- Migration Script: `supabase/migrations/upgrade_to_v8.sql`
- Validation Script: `scripts/validate-supabase-schema.ts`

---

**Generated:** 2026-08-03  
**Migration Version:** 7 → 8  
**Status:** Ready for execution
