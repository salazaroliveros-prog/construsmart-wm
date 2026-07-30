# BRANDED PDF & CSV EXPORT SPECIFICATIONS
## CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"

This document contains the structural HTML/CSS letterhead template and export configuration for generated PDF documents.

---

## 1. OFFICIAL LETTERHEAD TEMPLATE (MEMBRETE INSTITUCIONAL)

All client-facing proposals and administrator reports must include the official header:

```html
<header class="pdf-letterhead" style="
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  border-bottom: 3px solid #d97706; 
  padding-bottom: 15px; 
  margin-bottom: 25px;
">
  <!-- LEFT: Multi Servicios Header Branding Asset -->
  <div class="logo-container">
    <img src="/assets/branding/letterhead-multiservicios.jpg" alt="Multi Servicios de Guatemala" style="height: 70px; object-fit: contain;" />
  </div>

  <!-- RIGHT: Company Identity & Slogan -->
  <div class="company-info" style="text-align: right; font-family: 'Segoe UI', sans-serif;">
    <h1 style="margin: 0; font-size: 16pt; color: #b45309; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px;">
      CONSTRUCTORA WM/M&S
    </h1>
    <p style="margin: 3px 0; font-weight: 600; font-style: italic; color: #475569; font-size: 10pt;">
      "CONSTRUYENDO EL FUTURO"
    </p>
    <p style="margin: 0; font-size: 8.5pt; color: #64748b;">
      Guatemala, C.A. | Presupuestos y Planificación de Obra
    </p>
  </div>
</header>
```

---

## 2. REPORT TYPES

### A. Admin Full Report (*Informe Completo del Administrador*)
Includes:
1. Cover & Executive Summary with Project Metadata.
2. Complete APU Breakdown (Materials, Labor, Equipment, Yields).
3. Material Warehouse Explosion Sheet (*Explosión de Insumos para Bodega*).
4. Direct Costs, Indirect Costs (15%), Contingencies (5%), Profit Margin (10%).
5. Dual Signature Line at Footer (Project Resident Architect & Administrator).

### B. Client Proposal (*Presupuesto para Cliente*)
Includes:
1. Clean Commercial Layout.
2. Aggregated Line Items (No Unitary Yield Costs Exposed).
3. Schedule of Values & Payment Milestones.
4. Total Project Investment in Quetzales (Q.).
