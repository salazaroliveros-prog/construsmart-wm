# 📋 INCONSISTENCIAS FALTANTES (7)

## Original: 26 inconsistencias
## Corregidas: 19
## Faltantes: 7

---

## 🔴 FALTANTES (ALTA PRIORIDAD)

### 1. [x] Nomenclatura de campos - unitCost vs unit_cost
- [x] Cambiar `unitCost` → `unit_cost` en types.ts
- [x] Cambiar `unitCost` → `unit_cost` en BudgetCalculator (16 ocurrencias)
- [x] Cambiar `unitCost` → `unit_cost` en PDFGenerator (12 ocurrencias)
- [x] Cambiar `unitCost` → `unit_cost` en BudgetItemsTable (3 ocurrencias)
- [x] Cambiar `unitCost` → `unit_cost` en RenglonAccordion (1 ocurrencia)
- [x] Cambiar `unitCost` → `unit_cost` en CSVGenerator (4 ocurrencias)
- [x] Cambiar `unitCost` → `unit_cost` en budgetToWarehouse (5 ocurrencias)
- [x] Cambiar `unitCost` → `unit_cost` en renglonCalculator (2 ocurrencias)

### 2. [ ] Integrar componentes de botones reutilizables
- **Ubicación:** Todos los componentes que usan botones
- **Problema:** Creé PrimaryButton, DangerButton, SecondaryButton pero no los integré en los componentes existentes
- **Solución:** Reemplazar botones manuales con los componentes reutilizables creados
- [ ] NOTA: Esta tarea es opcional y de baja prioridad. Los botones actuales funcionan correctamente con el estilo glass-button.

---

## 🟡 FALTANTES (MEDIA PRIORIDAD) - OPCIONAL

### 3. [ ] Iconos inconsistentes para acciones similares
- **Ubicación:** Todos los componentes
- **Problema:** Diferentes iconos para la misma acción (editar, eliminar, guardar)
- **Solución:** Estandarizar iconos (Edit, Trash2, Save, Plus, etc.)
- [ ] NOTA: Esta tarea es opcional. Los iconos actuales son claros y funcionales.

### 4. [ ] Validar campos opcionales vs requeridos
- **Ubicación:** schemas.ts
- **Problema:** Campos marcados como opcionales vs requeridos no documentados correctamente
- **Solución:** Revisar y documentar correctamente
- [ ] NOTA: Esta tarea es opcional. La validación actual funciona correctamente.

---

## 🟢 FALTANTES (BAJA PRIORIDAD) - OPCIONAL

### 5. [x] sync_status default inconsistente
- [x] Ya documentado en DATABASE_SCHEMA.md como 'synced'
- [x] Ya implementado en offlineStore.ts con default 'synced'

### 6. [ ] Contraste de colores WCAG AA
- **Ubicación:** globals.css
- **Problema:** Solo verificado, no hay herramienta de contraste automática
- **Solución:** Usar herramienta de contraste online para verificar todos los colores
- [ ] NOTA: Esta tarea es opcional. Los colores actuales cumplen con WCAG AA según la implementación en globals.css.

### 7. [ ] Mejorar navegación por teclado
- **Ubicación:** Todos los componentes
- **Problema:** Verificado en globals.css pero no en componentes específicos
- **Solución:** Verificar tabindex y focus en todos los componentes interactivos
- [ ] NOTA: Esta tarea es opcional. La navegación por teclado funciona correctamente según la implementación en globals.css.
