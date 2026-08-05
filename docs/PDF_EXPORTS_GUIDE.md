# BRANDED PDF & CSV EXPORT SPECIFICATIONS
## CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"

This document contains the PDF export configuration and letterhead implementation for generated PDF documents.

---

## 1. OFFICIAL LETTERHEAD TEMPLATE (MEMBRETE INSTITUCIONAL)

All client-facing proposals and administrator reports must include the official header:

```typescript
// Implementado en components/pdf/PDFGenerator.tsx usando jsPDF
const addLetterhead = async () => {
  // Try to use custom logo first if enabled
  if (includeLogo && companyLogo) {
    doc.addImage(companyLogo, 'JPEG', 15, 10, 40, 25);
  } else {
    // Fallback to default letterhead
    const letterheadResponse = await fetch('/assets/branding/letterhead-multiservicios.jpg');
    const letterheadBlob = await letterheadResponse.blob();
    const letterheadDataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(letterheadBlob);
    });
    doc.addImage(letterheadDataUrl, 'JPEG', 15, 10, 40, 25);
  }
};
```

**Letterhead Components:**
- LEFT: Multi Servicios Header Branding Asset (`/assets/branding/letterhead-multiservicios.jpg`)
- RIGHT: Company Identity & Slogan (CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO")
- Fallback: Text-based header with company name and contact info if image fails to load

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
