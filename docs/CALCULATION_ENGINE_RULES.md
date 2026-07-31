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

#### 2.2.5 Excavación con factor de expansión
```
Volumen = Largo × Ancho × Profundidad × Factor_Expansión (default 1.2)
```

#### 2.2.6 Área de Muro para mampostería
```
Área = Largo × Altura
Perímetro = Largo × 2 (ambos lados)
```

#### 2.2.7 Área de Pintura/Recubrimiento
```
Área_Total = Área_Base × Capas × Factor_Desperdicio (default 1.1)
```

#### 2.2.8 Área de Piso
```
Área = Largo × Ancho × Factor_Desperdicio (default 1.1)
```

#### 2.2.9 Escaleras
```
Número_Escalones = Altura_Total / Altura_Riser
Altura_Actual = Número_Escalones × Altura_Riser
Largo_Actual = Número_Escalones × Profundión_Tread
Volumen ≈ (Largo_Actual × Ancho × Altura_Actual) / 2
```

#### 2.2.10 Mezclas de Concreto (Estándar Guatemalteco)
```
1500 PSI: 5.5 sacos cemento, 0.45 m³ arena, 0.65 m³ grava, 140L agua por m³
2000 PSI: 6.5 sacos cemento, 0.42 m³ arena, 0.62 m³ grava, 145L agua por m³
2500 PSI: 7.5 sacos cemento, 0.40 m³ arena, 0.60 m³ grava, 150L agua por m³
3000 PSI: 8.5 sacos cemento, 0.38 m³ arena, 0.58 m³ grava, 155L agua por m³
```

#### 2.2.11 Mezcla de Mortero
```
Proporción: 1:4 (cemento:arena)
Cemento: ~250 kg por m³
Arena: 0.8 m³ por m³
Agua: 100L por m³
```

#### 2.2.12 Peso de Acero (Varillas)
```
Peso = Área_Sección_Transversal × Densidad_Acero (7850 kg/m³) × Longitud × Cantidad
Área_Sección = π × (Diámetro/2000)²
```

#### 2.2.13 Encofrado
```
Láminas_Plywood = Área_Superficial / 2.98 m² (1.22m × 2.44m)
Madera_Soportes = Área_Superficial × 0.1 metros lineales por m²
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

Ver implementación completa en `lib/data/apuRenglones.ts` y `lib/calculators/apuCalculator.ts`.

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
│   │  apuRenglones.ts         │     │  ← Catálogo APU (125 renglones)
│   ├───────────────────────────┤     │
│   │  offlineStore.ts          │     │  ← Dexie (IndexedDB local)
│   └───────────────────────────┘     │
├─────────────────────────────────────┤
│         PDFGenerator.tsx            │  ← Exportación con membrete
└─────────────────────────────────────┘
```

**Principio clave:** Todos los cálculos se ejecutan **100% client-side** sin round-trips al servidor, garantizando operación offline completa.
