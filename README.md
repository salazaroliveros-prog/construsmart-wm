# CONSTRUCTORA WM/M&S - Sistema de Control de Seguimiento

## 🏗️ Descripción

Sistema ERP de construcción con control de presupuestos, seguimiento de proyectos y gestión financiera. "CONSTRUYENDO EL FUTURO"

Aplicación web progresiva (PWA) que permite la gestión completa de proyectos de construcción, incluyendo cálculo de presupuestos, control de costos, gestión de nómina, inventario y analítica avanzada, con soporte completo para modo offline.

## 🚀 Características Principales

### Módulos del Sistema
- **Dashboard Principal**: Vista general con estadísticas en tiempo real, 6 gráficas interactivas
- **Gestión de Proyectos**: CRUD completo de proyectos con sincronización offline
- **Calculadora de Presupuestos**: Generación de APU con cálculos estructurales
- **Gestión Financiera**: Control de ingresos, gastos y categorías
- **Nómina**: Gestión de empleados y cálculo de salarios
- **Almacén**: Control de inventario y alertas de stock bajo
- **Analytics Dashboard**: Gráficos avanzados (Curva S, Gantt, avances financieros)
- **Ajustes de UI**: Personalización completa de la interfaz (colores, efectos, accesibilidad)

### Características Recientes
- **Sidebar Colapsable**: Toggle entre vista expandida (64px) y colapsada (16px) con iconos visibles
- **Módulo de Settings**: 6 paletas de colores, control de transparencia, blur intensity, efectos glass
- **Gaussian Blur en Modales**: Efecto blur de fondo en todos los diálogos modales
- **Icon Animations**: Animaciones personalizadas (float, glow, shake, pulse, bounce, spin)
- **Responsive Dashboard**: Grid adaptable que se ajusta automáticamente al estado del sidebar
- **Zero-Scroll Viewport**: Diseño optimizado para minimizar scroll en vista principal

### Características Técnicas
- **PWA Completa**: Instalable como app nativa, funciona offline
- **Sincronización Offline**: Dexie.js (IndexedDB) + Supabase
- **Responsive Design**: Optimizado para móvil y desktop
- **Glassmorphism UI**: Interfaz moderna con efectos de cristal
- **Real-time Data**: Estadísticas actualizadas desde base de datos local

## 🛠️ Stack Tecnológico

### Framework & Core
- **Next.js 16.2.12** (App Router)
- **React 19.2.8** 
- **TypeScript 6.0.3** (Strict mode)

### Estilos & UI
- **Tailwind CSS 3.4.19**
- **Lucide React 1.28.0** (Iconos)
- **Recharts 3.10.1** (Gráficos)
- **Framer Motion 12.43.0** (Animaciones)
- **Glassmorphism UI**: Clases personalizadas `.glass-panel`, `.glass-card`
- **UI Settings Module**: Personalización de colores, transparencia y efectos glass

### Base de Datos & Sync
- **Supabase**: PostgreSQL + Auth + Storage
- **Dexie.js 4.4.4**: IndexedDB para modo offline
- **PostgreSQL Client**: pg 8.22.0

### Exportación & Documentos
- **jsPDF 4.2.1**: Generación de PDFs
- **html2canvas 1.4.1**: Capturas de pantalla

### Utilidades
- **dotenv 17.4.2**: Gestión de variables de entorno
- **react-is 19.2.8**: Utilidades React

## 📁 Estructura del Proyecto

```
CONTROL_SEGUIMIENTO_APP_VoL_10/
├── app/                          # Next.js App Router
│   ├── layout.tsx              # Layout principal con metadatos PWA
│   ├── page.tsx                # Dashboard principal
│   └── globals.css             # Estilos globales
├── components/                  # Componentes React
│   ├── analytics/              # Dashboard de analítica
│   │   └── AnalyticsDashboard.tsx
│   ├── budgets/                # Calculadora de presupuestos
│   │   └── BudgetCalculator.tsx
│   ├── dashboard/              # Componentes del dashboard
│   │   ├── DashboardNav.tsx
│   │   ├── DashboardStats.tsx
│   │   ├── DualBrandHeader.tsx
│   │   ├── ProjectManager.tsx
│   │   └── ProjectOverview.tsx
│   ├── finances/               # Gestión financiera
│   │   └── FinanceManager.tsx
│   ├── payroll/                # Gestión de nómina
│   │   └── PayrollManager.tsx
│   ├── warehouse/              # Gestión de almacén
│   │   └── WarehouseManager.tsx
│   ├── pdf/                    # Generación de PDFs
│   │   └── PDFGenerator.tsx
│   └── ui/                     # Componentes UI genéricos
│       └── ServiceWorkerRegistration.tsx
├── lib/                         # Lógica de negocio
│   ├── calculators/            # Motores de cálculo client-side
│   │   ├── slabCalculators.ts
│   │   └── volumetricCalculators.ts
│   ├── config/                 # Configuración centralizada
│   │   └── app.config.ts
│   ├── db/                     # Base de datos offline
│   │   └── offlineStore.ts
│   ├── supabase/               # Cliente Supabase
│   │   └── client.ts
│   └── utils/                  # Utilidades
│       └── offlineSync.ts
├── public/                      # Archivos estáticos
│   ├── manifest.json           # Manifiesto PWA
│   ├── sw.js                   # Service Worker
│   ├── robots.txt              # SEO
│   ├── sitemap.xml             # SEO
│   ├── logo.png                # Icono principal
│   └── assets/branding/        # Branding corporativo
├── scripts/                     # Scripts de utilidad
│   ├── validate-schema.js      # Validación de esquema DB
│   ├── detailed-schema-check.js # Verificación detallada
│   └── auto-migrate.js         # Migración automática
├── supabase/                   # Configuración Supabase
│   ├── migrations/             # Migraciones de base de datos
│   │   ├── 20240730000000_initial_schema.sql
│   │   ├── 20240730000001_schema_corrections.sql
│   │   └── 20240730000002_add_missing_fields.sql
│   └── config.toml             # Configuración CLI
├── doc/                         # Documentación
│   ├── DATABASE_SCHEMA.md      # Esquema de base de datos
│   └── PWA_OFFLINE_SYNC.md     # Documentación PWA
└── .cursorrules/                # Reglas del proyecto
    └── AGENTS.md
```

## 🔧 Configuración del Entorno

### Variables de Entorno Requeridas

Crear archivo `.env.local`:

```env
NEXT_PUBLIC_APP_URL=https://control-constructora-wm.vercel.app
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

### Instalación

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Build para producción
npm run build

# Iniciar producción
npm start
```

## 🗄️ Base de Datos

### Esquema Supabase (PostgreSQL)

**Tablas principales:**
- `projects` - Gestión de proyectos
- `budgets` - Presupuestos y cálculos
- `budget_items` - Items de presupuesto (estructura jerárquica)
- `budget_item_breakdowns` - Desglose de recursos
- `financial_transactions` - Transacciones financieras
- `payroll_employees` - Empleados
- `payroll_records` - Registros de nómina
- `warehouse_stock` - Inventario

### Base de Datos Offline (Dexie.js)

IndexedDB sincronizado con Supabase para modo offline:
- Todas las tablas con campos `sync_status`
- Sincronización automática cuando hay conexión
- Soporte para creación y edición offline

## 📱 PWA & Offline

### Características PWA
- **Instalable**: Se puede instalar como app nativa
- **Offline First**: Funciona completamente sin conexión
- **Service Worker**: Caching inteligente de recursos
- **Background Sync**: Sincronización cuando se restaura conexión

### Configuración PWA
- Manifest optimizado para iOS y Android
- Iconos adaptables (maskable)
- Tema consistente con branding corporativo
- Soporte para orientación portrait

## 🎨 Branding

### Identidad Corporativa
- **Empresa**: CONSTRUCTORA WM/M&S
- **Slogan**: "CONSTRUYENDO EL FUTURO"
- **Colores**: Paleta glassmorphism con acentos cyan/violet

### Activos
- Logo principal: `/public/logo.png`
- Logo constructora: `/public/assets/branding/logo-constructora-wm.jpg`
- Membrete: `/public/assets/branding/letterhead-multiservicios.jpg`

## 💰 Estándares Monetarios

### Moneda
- Quetzales de Guatemala (GTQ)
- Formato: Q. 1,000.00

### Matriz de Costos Residenciales (por m²)
- **Nivel Básico**: Q. 3,000.00 – Q. 3,500.00
- **Nivel Moderado**: Q. 3,500.00 – Q. 4,000.00
- **Nivel Premium**: Q. 4,000.00 – Q. 5,000.00

## 🚀 Despliegue

### Vercel
El proyecto está configurado para despliegue automático en Vercel:

```bash
# Push a GitHub
git push origin main

# Vercel despliega automáticamente a:
# https://control-constructora-wm.vercel.app
```

### Configuración Vercel
- Framework: Next.js
- Variables de entorno configuradas
- Dominio personalizado: `control-constructora-wm.vercel.app`

## 📊 Analytics Dashboard

El dashboard de analítica incluye 4 gráficos integrados:
1. **Curva S**: Progreso de proyecto vs tiempo
2. **Gantt**: Cronograma de actividades
3. **Avance Físico/Financiero**: Comparativa de progreso
4. **Presupuestado vs Real**: Control de costos

## 🔒 Seguridad

### Autenticación
- Supabase Auth (preparado para implementación)
- RLS (Row Level Security) habilitado
- Políticas de acceso por tabla

### Datos
- Encriptación en tránsito (HTTPS)
- Sincronización segura con Supabase
- Datos sensibles en IndexedDB local

## 📝 Reglas de Desarrollo

Ver `.cursorrules/AGENTS.md` para reglas detalladas del proyecto.

### Estándares de Código
- TypeScript estricto (sin `any`)
- Interfaces para todas las entidades
- Componentes modulares y reutilizables
- Zero-Scroll Viewport en dashboard principal

## 🧪 Validación

### TypeScript
```bash
npm run type-check
```

### Migraciones
```bash
# Aplicar migraciones a Supabase
supabase db push

# Verificar estado de migraciones
supabase migration list
```

## 📈 Monitoreo y Logs

### Service Worker
- Logs de registro en consola
- Detección de actualizaciones
- Errores de sincronización reportados

### Supabase
- Logs de consultas en dashboard
- Monitoreo de conexiones
- Alertas de rendimiento

## 🐛 Troubleshooting

### Problemas Comunes

**Service Worker no registra:**
- Verificar que el navegador lo soporte
- Limpiar cache y recargar
- Verificar console para errores

**Sincronización falla:**
- Verificar conexión a Supabase
- Validar variables de entorno
- Revisar logs de error en consola

**Build falla:**
- Limpiar `.next` directory
- Verificar dependencias
- Validar TypeScript errors

## 📞 Soporte

Para problemas técnicos o preguntas sobre el proyecto:
- Revisar documentación en `/doc/`
- Verificar reglas en `.cursorrules/AGENTS.md`
- Consultar scripts de validación en `/scripts/`

## 📄 Licencia

Propiedad de CONSTRUCTORA WM/M&S - Todos los derechos reservados.

---

**Versión**: 1.0.0  
**Última actualización**: 2024-07-30  
**Framework**: Next.js 16.2.12 + React 19.2.8  
**Base de datos**: Supabase + Dexie.js