# ANÁLISIS DE MÓDULOS, INCONSISTENCIAS Y RECOMENDACIONES DE UI/UX PARA ERP CONSTRUCTORA
**Proyecto:** `construsmart-wm` (ERP para Constructora)
**Repositorio GitHub:** `https://github.com/salazaroliveros-prog/construsmart-wm.git`
**Dominio Vercel:** `https://construsmart-wm.vercel.app/`
**Supabase DB:** `https://yibjsruoxjlgdnkgylld.supabase.co`

---

## 1. RESUMEN EJECUTIVO Y ARQUITECTURA GENERAL

El ERP `construsmart-wm` está concebido como una plataforma integral de gestión para proyectos de construcción. Tras auditar la lógica de negocio, la arquitectura modular y los flujos de datos requeridos para producción, se identifica que la aplicación requiere cohesión entre el frontend (Next.js / React) y la persistencia relacional en Supabase (PostgreSQL), además de eliminar estados aislados ("mock data") y resolver inconsistencias críticas de compilación y experiencia de usuario (UX).

---

## 2. AUDITORÍA Y PLAN DE IMPLEMENTACIÓN POR MÓDULO

### 2.1 Módulo 1: Proyectos y Control de Obras

#### Inconsistencias Identificadas
* **Desconexión con Presupuestos y Avances:** Los proyectos figuran como entes aislados sin vincular el acumulado de partidas o estimaciones.
* **Falta de Seguimiento Geográfico y Fotográfico:** No existe soporte nativo para almacenamiento de bitácoras de obra con evidencia visual ni geolocalización de proyectos.
* **Estados Inconsistentes:** Se mezclan nomenclaturas de estados (`En Proceso`, `Activo`, `Iniciado`, `Finalizado`).

#### Implementación Técnica Recomendada
```sql
-- Estructura sugerida para Supabase (Tabla `projects`)
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  client_id UUID REFERENCES public.clients(id),
  budget_total NUMERIC(15,2) DEFAULT 0.00,
  status VARCHAR(30) CHECK (status IN ('draft', 'active', 'suspended', 'completed')) DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Sugerencias UI / UX
* **UI:** Implementar una vista tipo *Dashboard de Obra* con tarjetas resumen (*KPIS*: Progreso %, Presupuesto Ejecutado vs. Programado, Días Restantes).
* **UX:** Agregar vista Gantt o cronograma interactivo para visualización rápida de la ruta crítica del proyecto.

---

### 2.2 Módulo 2: Presupuestos, Partidas y Renglones de Trabajo

#### Inconsistencias Identificadas
* **Cálculo de Precios Unitarios (APU) Incompleto:** Falta desglose automático de Mano de Obra, Materiales, Equipo/Maquinaria y Costos Indirectos/Utilidad.
* **Falta de Sincronización:** Modificar un precio unitario en el catálogo maestro no recalcula en tiempo real los presupuestos vigentes sin guardar manualmente.

#### Implementación Técnica Recomendada
```typescript
// Lógica de cálculo en el frontend / hook customizado `useBudgetCalculator.ts`
export interface APUItem {
  materialCost: number;
  laborCost: number;
  equipmentCost: number;
  indirectPercentage: number; // Ej: 15%
}

export const calculateUnitPrice = (item: APUItem): number => {
  const directCost = item.materialCost + item.laborCost + item.equipmentCost;
  const indirects = directCost * (item.indirectPercentage / 100);
  return directCost + indirects;
};
```

#### Sugerencias UI / UX
* **UI:** Tabla editable tipo hoja de cálculo (Excel-like interface) para desglose rápido de renglones y APUs.
* **UX:** Indicadores de advertencia visuales (color ámbar/rojo) cuando el costo proyectado supere la oferta al cliente.

---

### 2.3 Módulo 3: Inventarios, Almacén y Control de Materiales

#### Inconsistencias Identificadas
* **Descalce con Control de Compras:** Los materiales ingresan al inventario sin requerir orden de compra ni recepción de bodega digital firmada.
* **Alertas de Stock Ausentes:** No existen validaciones de *stock mínimo* antes de asignar materiales a un proyecto especifico.

#### Implementación Técnica Recomendada
```sql
-- Movimientos de inventario integrados con Supabase
CREATE TABLE public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES public.inventory_items(id),
  project_id UUID REFERENCES public.projects(id),
  movement_type VARCHAR(20) CHECK (movement_type IN ('IN', 'OUT', 'TRANSFER', 'ADJUSTMENT')),
  quantity NUMERIC(12,4) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Sugerencias UI / UX
* **UI:** Badges de estado con código de colores según el stock (*Crítico*, *Aceptable*, *Excedente*).
* **UX:** Opción para escanear códigos QR/barras desde dispositivos móviles para registro rápido de salidas de almacén en obra.

---

### 2.4 Módulo 4: Compras, Proveedores y Subcontratos

#### Inconsistencias Identificadas
* **Flujo de Aprobaciones Ausente:** Las órdenes de compra se generan y aplican sin requerir firma/aprobación por niveles de jerarquía (Residente de Obra -> Gerencia).
* **Falta de Control de Subcontratos:** No existe desglose de retenciones de garantía ni amortización de anticipos a subcontratistas.

#### Implementación Técnica Recomendada
* Integrar máquina de estados para Órdenes de Compra: `Draft` ➔ `Pending_Approval` ➔ `Approved` ➔ `Received` ➔ `Billed`.

#### Sugerencias UI / UX
* **UI:** Modal interactivo de comparación de cotizaciones de proveedores lado a lado (Side-by-side comparison).
* **UX:** Botón de un solo clic para convertir una Solicitud de Materiales aprobada directamente en una Orden de Compra.

---

### 2.5 Módulo 5: Finanzas, Flujo de Caja y Facturación / Clientes

#### Inconsistencias Identificadas
* **Inconsistencia de Moneda y Decimales:** Manejo ambiguo del redondeo en Quetzales (GTQ) o dólares (USD), produciendo descuadres de centavos en reportes.
* **Sin Registro de Pagos e Impuestos:** Pagos a proveedores y cobros a clientes no quedan enlazados al flujo general de tesorería del ERP.

#### Sugerencias UI / UX
* **UI:** Dashboard Financiero con gráficos de barras apiladas (Ingresos vs. Egresos por Mes / Por Proyecto).
* **UX:** Generación automática de reportes de estado de cuenta para clientes exportables en formato PDF con el branding institucional de la constructora.

---

## 3. MEJORAS TRANSVERSALES DE UI / UX

1. **Diseño Adaptativo (Mobile-First para Obra):**
   * Ajustar tablas y formularios pesados para que los ingenieros/residentes de obra puedan registrar datos de manera fluida desde smartphones o tablets en campo.
2. **Sistemas de Retroalimentación en Tiempo Real (Toast & Loading States):**
   * Sustituir alertas genéricas (`alert()`) por notificaciones contextuales integradas y loaders esqueléticos (Skeleton UI) durante las peticiones a Supabase.
3. **Modo Oscuro / Claro Técnico:**
   * Garantizar alto contraste en áreas de trabajo expuestas al sol en campo.

---

## 4. LISTA DE COMPROBACIÓN DE DESPLIEGUE FINAL

- [ ] Unificación del cliente de Supabase (`@supabase/supabase-js`) y verificación de variables de entorno `.env.local` / Vercel.
- [ ] Ejecución de migraciones en Supabase para asegurar integridad referencial y RLS (Row Level Security).
- [ ] Verificación de compilación sin errores (`npm run build`).
- [ ] Despliegue automático en Vercel con integración contínua desde la rama `main` de GitHub.
