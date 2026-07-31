# Database Schema Status - Renglon Calculation System

## Verification Result ✅

**Date:** Generated after implementing automatic renglon calculation system

---

## Database Schema Compatibility

### Current Schema Status
- ✅ All 12 required tables exist
- ✅ APU integration columns exist (`apu_result`, `apu_params` in `budget_items`)
- ✅ `apu_params` is JSONB type (flexible for new fields)

### New Fields Storage Strategy

**New fields added to APUFormulaParams:**
- `crewSize?: number` - Tamaño de cuadrilla (personas)
- `efficiency?: number` - % Eficiencia (50-150)

**Storage:**
- These fields are stored in `budget_items.apu_params` (JSONB)
- No schema migration required (JSONB is flexible)
- Fields added automatically on next save

**Example structure in apu_params:**
```json
{
  "theoreticalQuantity": 100,
  "wastePercentage": 5,
  "volumetricFactor": 1.0,
  "crewDailySalary": 300,
  "dailyPerformance": 50,
  "indirectPercentage": 15,
  "crewSize": 3,
  "efficiency": 100
}
```

---

## Time Data Storage

**Strategy:** Calculated on-demand, stored in localStorage

**Why localStorage?**
- Time data is dynamic (recalculated when crew sizes change)
- Needs fast access for UI updates
- Not critical for persistence across sessions
- Can be recalculated from budget items

**Storage location:**
- `localStorage['wm_presupuesto_activo']`
- Fields in `ActiveBudgetState`:
  - `timeImpact: ProjectTimeImpact`
  - `renglonTimeData: Record<string, number>`

**If needed in future:**
- Could add columns to `budgets` table:
  - `total_days` (calculated duration)
  - `renglon_time_data` (JSONB with days per renglon)
- Migration SQL:
```sql
ALTER TABLE budgets 
ADD COLUMN IF NOT EXISTS total_days INTEGER,
ADD COLUMN IF NOT EXISTS renglon_time_data JSONB;
```

---

## Material Breakdown Integration

**Warehouse Integration:**
- Material breakdown calculated using `RenglonCalculator.calculateMaterialBreakdown()`
- Stored in `warehouse_stock` table
- Updates existing stock or creates new items
- No schema changes required (using existing table)

**Flow:**
1. User saves budget with renglones
2. System calculates material breakdown per renglon
3. Adds materials to `warehouse_stock` with quantities
4. Updates `current_stock` if item exists, creates new if not

---

## Summary

| Component | Schema Change Required | Storage Location |
|-----------|------------------------|-----------------|
| crewSize, efficiency fields | ❌ No (JSONB flexible) | `budget_items.apu_params` |
| Time data | ❌ No (localStorage) | `localStorage` + `budgetState` |
| Material breakdown | ❌ No (existing table) | `warehouse_stock` |
| Gantt chart data | ⚠️ Optional future | Could add to `budgets` |

---

## Conclusion

✅ **No database migration required for current implementation**

The existing schema with JSONB fields (`apu_result`, `apu_params`) is sufficient to store all new data from the renglon calculation system. Time data is stored in localStorage for performance and dynamic recalculation.

If future requirements demand persistent time data across sessions, a simple migration can add time tracking columns to the `budgets` table.
