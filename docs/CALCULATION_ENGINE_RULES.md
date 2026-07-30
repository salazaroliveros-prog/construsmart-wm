# CONSTRUCTORA WM/M&S - CALCULATION ENGINE RULES

**Slogan:** "CONSTRUYENDO EL FUTURO"
**Estándares:** Constructivos Guatemaltecos
**Moneda:** Quetzales (GTQ - Q.)

---

## 1. MATRIZ DE COSTO RESIDENCIAL POR m²

| Nivel          | Rango (GTQ/m²)       | Descripción               |
|----------------|----------------------|---------------------------|
| Básico         | Q. 3,000 - Q. 3,500  | Acabados económicos       |
| Moderado       | Q. 3,500 - Q. 4,000  | Acabados calidad media    |
| Premium        | Q. 4,000 - Q. 5,000  | Acabados alta gama        |

---

## 2. MOTOR DE CÁLCULO ESTRUCTURAL

Todas las calculadoras están en `/lib/calculators/` y ejecutan 100% client-side (Zero API roundtrip).

### 2.1 Losas y Cubiertas (`slabCalculators.ts`)

#### 2.1.1 Losa Sólida Traditional (h = 0.10m - 0.12m)
```
Concreto:    V = Área × Espesor × 1.05     (5% desperdicio)
Acero (#3 @ 0.15m ambos sentidos): ~8.5 kg/m²
Encofrado:  Área_encofrado = Área × 1.15
```

#### 2.1.2 Losa Prefabricada (Vigueta y Bovedilla)
```
Viguetas:         Longitud_total = Área / 0.70m
Bovedillas:       5.2 unidades/m²
Capa Compresión:  V = Área × 0.05 × 1.05
Malla Electrosoldada 6x6-10/10: Área × 1.10
```

#### 2.1.3 Pérgola Metálica
```
Viga Principal (Tubo 4"×4" × 1/8"): 0.85 m/m²
Viguetas Secundarias (Tubo 2"×4"):  1.80 m/m²
```

#### 2.1.4 Pérgola de Madera
```
Vigas (Conacaste/Pino Tratado): 12 pies tablares/m²
```

#### 2.1.5 Tejado (Teja de Barro)
```
Tejas de Barro Estándar: 32 - 36 unidades/m²
```

### 2.2 Cálculos Volumétricos (`volumetricCalculators.ts`)

#### 2.2.1 Prisma Rectangular (cimentaciones, columnas, vigas)
```
Volumen = Largo × Ancho × (Profundidad | Altura)
Área Superficial = 2(L×W + L×H + W×H)
Perímetro = 2(L + W)
```

#### 2.2.2 Cilindro (pilotes, columnas circulares)
```
Volumen = π × (Diámetro/2)² × Altura
Área Superficial = 2 × π × (D/2) × (D/2 + H)
```

#### 2.2.3 Trapezoide (zapatas, estribos)
```
Volumen = (Altura/3) × (Área_base + Área_superior + √(Área_base × Área_superior))
```

#### 2.2.4 Dados de Concreto (apoyos, pedestales)
```
Volumen = Largo × Ancho × Altura
```

---

## 3. MOTOR DE PRESUPUESTOS (APU)

### 3.1 Estructura Jerárquica
```
Presupuesto (budgets)
  └── Items de Presupuesto (budget_items) → Padre/Hijo
        └── Desglose de Recursos (budget_item_breakdown)
              ├── Materiales (material)
              ├── Mano de Obra (labor)
              ├── Equipo (equipment)
              └── Subcontratos (subcontract)
```

### 3.2 Fórmulas de Costo

#### Costo Directo del Item
```
Costo_Unitario = Σ(Recursos)  // suma de materiales + mano de obra + equipo + subcontrato
Costo_Total_Item = Cantidad × Costo_Unitario
```

#### Costo del Desglose
```
Cantidad_Total = Cantidad_Unitaria × Cantidad_Item
Precio_Total = Cantidad_Total × Precio_Unitario × (1 + Desperdicio%/100)
```

#### Costo Total del Presupuesto
```
Costo_Directo = Σ(Costo_Total_Items)  // sumatoria de todos los items
Indirectos    = Costo_Directo × (Porcentaje_Indirectos / 100)
Contingencia  = Costo_Directo × (Porcentaje_Contingencia / 100)
Utilidad      = Costo_Directo × (Porcentaje_Utilidad / 100)
Total         = Costo_Directo + Indirectos + Contingencia + Utilidad
```

### 3.3 Valores por Default
| Concepto         | Porcentaje |
|------------------|------------|
| Indirectos       | 15%        |
| Contingencia     | 5%         |
| Utilidad         | 10%        |
| Desperdicio      | 5%         |

---

## 4. LIBRERÍA APU (40 Items Estándar)

La librería APU residencial contiene 40 items organizados en 8 categorías:

| Código | Categoría               | Items |
|--------|-------------------------|-------|
| 1.x    | Movimiento de Tierras   | 3     |
| 2.x    | Cimentaciones           | 5     |
| 3.x    | Mampostería             | 6     |
| 4.x    | Losas y Cubiertas       | 6     |
| 5.x    | Acabados Interiores     | 8     |
| 6.x    | Acabados Exteriores     | 6     |
| 7.x    | Carpintería y Herrería  | 4     |
| 8.x    | Instalaciones           | 2     |

Ver implementación completa en `lib/apu/apuLibrary.ts`.

---

## 5. MÓDULO DE NÓMINA (Payroll)

### 5.1 Cálculo de Salarios
```
Salario_Base = Días_Trabajados × Tarifa_Diaria
Pago_Horas_Extra = Horas_Extra × Tarifa_Hora_Extra
Salario_Bruto = Salario_Base + Pago_Horas_Extra + Bonificaciones
```

### 5.2 Prestaciones Laborales (Guatemala)
```
IGSS        = Salario_Bruto × 0.0483    (4.83%)
Aguinaldo   = Salario_Bruto × 0.0833    (8.33% provisión)
Vacaciones  = Salario_Bruto × 0.0417    (4.17% provisión)
Salario_Neto = Salario_Bruto - IGSS - Deducciones
```

---

## 6. ARQUITECTURA DEL MOTOR DE CÁLCULO

```
┌─────────────────────────────────────┐
│         BudgetCalculator.tsx        │  ← Componente UI
├─────────────────────────────────────┤
│   ┌───────────────────────────┐     │
│   │  slabCalculators.ts       │     │  ← Cálculos de losas
│   ├───────────────────────────┤     │
│   │  volumetricCalculators.ts │     │  ← Cálculos volumétricos
│   ├───────────────────────────┤     │
│   │  apuLibrary.ts            │     │  ← Librería APU + estimaciones
│   ├───────────────────────────┤     │
│   │  offlineStore.ts          │     │  ← Dexie (IndexedDB local)
│   └───────────────────────────┘     │
├─────────────────────────────────────┤
│         PDFGenerator.tsx            │  ← Exportación con membrete
└─────────────────────────────────────┘
```

**Principio clave:** Todos los cálculos se ejecutan **100% client-side** sin round-trips al servidor, garantizando operación offline completa.
