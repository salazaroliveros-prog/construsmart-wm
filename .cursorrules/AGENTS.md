# REGLAS OBLIGATORIAS DEL PROYECTO - CONSTRUCTORA WM/M&S
# Slogan: "CONSTRUYENDO EL FUTURO" / "Edificando el Futuro"

## 1. PILA TECNOLÓGICA & ARQUITECTURA
- **Framework:** Next.js 14+ (App Router), React 18, TypeScript estricto.
- **Estilos & UI:** Tailwind CSS, Lucide Icons, Recharts, Framer Motion, Glassmorphism UI (clases `.glass-panel`, `.glass-card`, `backdrop-blur-xl`, transparencias `rgba`, bordes de cristal).
- **Base de Datos & Auth:** Supabase (PostgreSQL + Auth + Storage).
- **Modo Offline & PWA:** Progressive Web App 100% funcional sin conexión vía Service Workers y Dexie.js (IndexedDB).

## 2. BRANDING & IDENTIDAD VISUAL
- **Empresa:** CONSTRUCTORA WM/M&S
- **Slogan:** "CONSTRUYENDO EL FUTURO"
- **Icono PWA & App:** `/public/assets/branding/logo-constructora-wm.jpg` (Genera favicon, app-icons y splash screens).
- **Membrete Corporativo:** `/public/assets/branding/letterhead-multiservicios.jpg` (Encabezado oficial para exportación PDF, CSV e informes).
- **Header Dual (Dashboard):** Desplegar ambos logotipos lado a lado en un contenedor glassmorphic con divisor traslúcido y anillo luminoso en el avatar del usuario (`ring-2 ring-cyan-500/50`).

## 3. ESTÁNDARES MONETARIOS Y INGENIERÍA
- **Moneda:** Quetzales de Guatemala (Q. / GTQ).
- **Matriz de Costo Residencial por m²:**
  - Nivel Básico: Q. 3,000.00 – Q. 3,500.00 / m²
  - Nivel Moderado: Q. 3,500.00 – Q. 4,000.00 / m²
  - Nivel Premium: Q. 4,000.00 – Q. 5,000.00 / m²
- **Cálculos Estructurales Localizados:**
  - Los motores de cálculo en `/lib/calculators/` deben ejecutarse 100% client-side (Zero API roundtrip para cálculo de volumen, insumos y APU).

## 4. REGLAS DE DESARROLLO EN VS CODE
- No usar tipo `any`. Especificar interfaces en TypeScript para todas las entidades.
- Modularizar componentes en `/components/ui/`, `/components/dashboard/`, `/components/budgets/`, `/components/pdf/`.
- Priorizar cero scroll en el Tablero Principal (*Zero-Scroll Viewport*).
