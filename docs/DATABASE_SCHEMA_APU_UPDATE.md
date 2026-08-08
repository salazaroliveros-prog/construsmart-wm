# ACTUALIZACIÓN A DATABASE_SCHEMA.md - TABLA apu_library

**Fecha:** 2025-01-31  
**Motivo:** Corrección de documentación para reflejar la estructura actual de la tabla apu_library

---

## CAMBIOS EN TABLA apu_library

### Columnas Actualizadas

| Columna              | Tipo            | Default       | Restricciones          | Nota                             |
|----------------------|-----------------|---------------|------------------------|----------------------------------|
| id                   | UUID            | gen_random_uuid() | PK               | Sin cambios                     |
| user_id              | UUID            |               | FK → auth.users(id) ON DELETE CASCADE | Sin cambios |
| code                 | **VARCHAR(60)**  |               | UNIQUE NOT NULL        | **CAMBIADO** de VARCHAR(20) a VARCHAR(60) |
| typology             | VARCHAR(20)     | 'residential' |                        | Sin cambios                     |
| chronological_order  | **INT**         | **0**         |                        | **CAMBIADO** de NOT NULL a DEFAULT 0 |
| description          | TEXT            | NOT NULL      |                        | Sin cambios                     |
| unit                 | VARCHAR(20)     | NOT NULL      |                        | Sin cambios                     |
| default_yield_per_day| NUMERIC(10,2)   | 1.0           |                        | Sin cambios                     |
| category             | VARCHAR(50)     | NOT NULL      |                        | Sin cambios                     |
| formula              | **TEXT**        | **NULL**      |                        | **NUEVO** - Fórmula de cálculo del renglón        |
| material_formula     | **JSONB**       | **NULL**      |                        | **NUEVO** - Fórmula detallada de materiales       |
| labor_formula        | **JSONB**       | **NULL**      |                        | **NUEVO** - Fórmula detallada de mano de obra     |
| machinery_formula    | **JSONB**       | **NULL**      |                        | **NUEVO** - Fórmula detallada de maquinaria       |
| default_values       | **JSONB**       | **NULL**      |                        | **NUEVO** - Valores por defecto específicos      |
| sync_status          | **TEXT**        | **'synced'**   | CHECK IN ('synced','created_offline','updated_offline') | **NUEVO** - Para arquitectura offline-first |
| created_at           | **TIMESTAMP WITH TIME ZONE** | **NOW()**   |                        | **NUEVO** - Timestamp creación             |
| updated_at           | **TIMESTAMP WITH TIME ZONE** | **NOW()   |                        | **NUEVO** - Timestamp actualización         |

---

## DATOS INICIALES ACTUALIZADOS

**Antes:** 40 items residenciales estándar cargados  
**Después:** 175 items estándar (35 por tipología: residential, commercial, industrial, civil, public) cargados

---

## MIGRACIÓN SQL APLICADA

Estos cambios ya están implementados en la migración:
- `supabase/migrations/20250131000002_add_apu_columns.sql`
- `supabase/migrations/20250131000003_add_new_apu_renglones.sql`

---

## JUSTIFICACIÓN DE CAMBIOS

1. **VARCHAR(60) para code**: Los códigos de renglones exceden 20 caracteres (ej: "ENTREGA_LLAVES")
2. **DEFAULT 0 para chronological_order**: Permite INSERTs sin especificar orden manualmente
3. **Campos de fórmula (JSONB)**: Almacenan fórmulas matemáticas detalladas por renglón
4. **Campos de sync**: Necesarios para arquitectura offline-first de la aplicación

---

## ACCIÓN REQUERIDA

Actualizar `docs/DATABASE_SCHEMA.md` sección 2.3 para reflejar estos cambios.
