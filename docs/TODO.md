# TODO - Correcciones de Inconsistencias Auditadas

## CRÍTICAS
- [x] 1. Agregar `created_offline` y `updated_offline` a `PENDING_STATUSES` en `lib/utils/offlineSync.ts`
- [x] 2. Nueva migración SQL: ampliar CHECK de `financial_transactions.category` para incluir `'Gastos Operativos / Nómina de Mano de Obra'` (creado `20260901000000_fix_financial_category_check.sql`)
- [x] 3. Eliminar AuthGuard anidado en `app/page.tsx` (layout.tsx ya lo provee)
- [x] 4. Unificar categoría de nómina entre `useLaborCostOverrun.ts` y `PayrollManager.tsx`

## ALTA PRIORIDAD
- [x] 5. Alinear `ExpenseCategory` en `lib/types/database.ts` con el CHECK real de la BD (ya incluye la categoría; la migración SQL ahora la soporta)
- [x] 6. Eliminar escritura dual directa a Supabase en módulos (delegar al motor de sync)

## MEDIA PRIORIDAD
- [x] 7. `budgetToWarehouse.ts`: detectar conectividad real vía `navigator.onLine` en vez de hardcodear `isOnline: true`
- [x] 8. Validación de FK en schemas Zod — ya implementada: `warehouseStockSchema.project_id`, `payrollRecordSchema.employee_id`/`project_id`, `budgetItemSchema.budget_id`, `budgetSchema.project_id` usan `z.string().uuid()`

## BAJA PRIORIDAD
- [x] 9. Iconos duplicados `Users` en `NAVIGATION_TABS` (payroll vs clients → `Wallet`; clients → `UserCircle`)
