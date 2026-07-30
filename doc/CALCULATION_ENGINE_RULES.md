# STRUCTURAL & VOLUMETRIC CALCULATION ENGINE RULES
## CONSTRUCTORA WM/M&S - NORMATIVA GUATEMALA (GTQ)

This document specifies the exact engineering formulas, volumetric calculations, and APU yield algorithms for automatic client-side evaluation.

---

## 1. SLAB & ROOF SYSTEMS (LOSAS Y CUBIERTAS)

### A. Losa Sólida Tradicional (Grosor h = 0.10 m - 0.12 m)
- **Volumen de Concreto ($m^3$):**  
  $$V = 	ext{Área } (m^2) 	imes h 	imes 1.05 \quad (	ext{5\% desperdicio})$$
- **Dosificación por $m^3$ (Concreto 3,000 PSI / 210 kg/cm²):**
  - Cemento: 9.8 sacos (42.5 kg).
  - Arena de río: 0.55 $m^3$.
  - Piedrín (1/2" a 3/4"): 0.70 $m^3$.
  - Agua: 190 Litros.
- **Acero de Refuerzo (#3 @ 0.15m en ambos sentidos):**
  - Estimado: $8.5 	ext{ kg/m}^2$.
- **Encofrado de Madera:** $1.15 	imes 	ext{Área}$.

### B. Losa Prefabricada (Vigueta y Bovedilla)
- **Vigueta Pretensada:**  
  $$	ext{Metros Lineales} = rac{	ext{Área}}{0.70 	ext{ m}}$$
- **Bovedilla de Poporopo / Concreto:**  
  $$	ext{Unidades} = 	ext{Área} 	imes 5.2 	ext{ bovedillas/m}^2$$
- **Capa de Compresión ($h = 0.05 	ext{ m}$):**  
  $$V = 	ext{Área} 	imes 0.05 	imes 1.05$$
- **Malla Electrosoldada 6x6-10/10:** $	ext{Área} 	imes 1.10$.

### C. Pérgolas Metálicas
- **Vistas Principales (Tubo Estructural 4"x4" x 1/8"):** $0.85 	ext{ m/m}^2$.
- **Viguetas Secundarias (Tubo Estructural 2"x4" x 1/16"):** $1.80 	ext{ m/m}^2$.
- **Pintura Anticorrosiva:** 0.12 galones/$m^2$.

### D. Pérgolas de Madera
- **Madera de Conacaste o Pino Tratado:** 12 pies tablares por $m^2$.
- **Protector / Barniz Marino:** 0.15 galones/$m^2$.

### E. Tejado de Barro
- **Teja de Barro Estándar:** 32 a 36 unidades por $m^2$.
- **Mortero de Pega (1:4):** 0.025 $m^3/m^2$.

---

## 2. ELEMENTS OF STRUCTURE (SOLERAS, COLUMNAS Y ZAPATAS)

### Levantado de Muro de Cintas / Block (15x20x40 cm)
- **Blocks por $m^2$:** 12.5 unidades (incluye 5% desperdicio).
- **Mortero de Levantado:** 0.02 $m^3/m^2$.
- **Sacos de Cemento por $m^2$ de Muro:** 0.25 sacos.

### Zapata Tipo Z-1 (1.00m x 1.00m x 0.25m)
- **Volumen de Concreto:** $0.25 	ext{ m}^3$ por zapata.
- **Varilla de Acero Grado 40 #4:** 12 metros lineales por zapata.

---

## 3. RESIDENTIAL COST TIER MATRIX ($m^2$)
When generating fast estimations based on project area:
- **Nivel Básico (Económico):** Q. 3,000.00 – Q. 3,500.00 / $m^2$
- **Nivel Moderado (Medio):** Q. 3,500.00 – Q. 4,000.00 / $m^2$
- **Nivel Premium (Alto):** Q. 4,000.00 – Q. 5,000.00 / $m^2$
