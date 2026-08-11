# DOCUMENTACIÓN CONSOLIDADA - CONSTRUCTORA WM/M&S
## "CONSTRUYENDO EL FUTURO"

---

## ÍNDICE

1. [Información General](#información-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Estructura del Proyecto](#estructura-del-proyecto)
4. [Módulos y Funcionalidades](#módulos-y-funcionalidades)
5. [Base de Datos](#base-de-datos)
6. [Configuración y Despliegue](#configuración-y-despliegue)
7. [Guía de Desarrollo](#guía-de-desarrollo)
8. [Troubleshooting](#troubleshooting)

---

## Información General

### Descripción del Proyecto
Sistema ERP de Construcción para CONSTRUCTORA WM/M&S - Suite v10 de Control de Seguimiento. Sistema integral para gestión de proyectos de construcción con capacidades offline-first, sincronización en tiempo real, y análisis avanzado de costos y avance.

### Características Principales
- **Gestión de Proyectos**: Control completo del ciclo de vida de proyectos de construcción
- **Presupuestos**: Cálculo detallado de costos con integración APU (Análisis de Precios Unitarios)
- **Finanzas**: Gestión de ingresos, egresos y transacciones financieras
- **Nómina**: Control de empleados y registros de pago con beneficios guatemaltecos
- **Almacén**: Gestión de inventario de materiales y consumo
- **Proveedores**: Directorio de proveedores y gestión de órdenes de compra
- **Clientes**: CRM básico para gestión de clientes
- **Bitácora**: Registro diario de avance y eventos del proyecto
- **Analytics**: Dashboard con KPIs, gráficas y análisis de earned value
- **Offline-First**: Operación completa sin conexión con sincronización automática
- **Responsive**: Interfaz optimizada para móvil y escritorio

### Stack Tecnológico
- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL), Supabase Auth, Realtime
- **Storage Local**: Dexie (IndexedDB) para offline storage
- **UI Components**: Lucide Icons, Recharts, Framer Motion
- **Build**: Turbopack, TypeScript Compiler

---

## Arquitectura del Sistema

### Arquitectura Offline-First
```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENTE (Navegador)                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  UI React (Next.js)                                  │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │
│  │  │  Componentes│  │   Hooks     │  │   Contextos │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Estado Local (Dexie/IndexedDB)                      │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │
│  │  │  Projects   │  │  Budgets    │  │  Finances   │  │  │
│  │  │  Payroll    │  │  Warehouse  │  │  Clients    │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Sync Engine (offlineSync.ts)                        │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │
│  │  │  Push       │  │  Pull       │  │  Conflict   │  │  │
│  │  │  (Offline→) │  │  (→Offline) │  │  Resolution │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↕ (Online)
┌─────────────────────────────────────────────────────────────┐
│                  SERVIDOR (Supabase)                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  PostgreSQL Database                                  │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │
│  │  │  Tables     │  │  RLS        │  │  Triggers   │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Supabase Services                                   │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │
│  │  │  Auth       │  │  Realtime   │  │  Storage    │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Flujo de Sincronización
1. **Online**: Datos se guardan localmente y se sincronizan con Supabase en tiempo real
2. **Offline**: Datos se guardan localmente con estado `created_offline` o `updated_offline`
3. **Reconexión**: Motor de sync empuja cambios pendientes y actualiza con datos del servidor
4. **Conflictos**: Resolución Last-Write-Wins basada en timestamps `updated_at`

---

## Estructura del Proyecto

```
CONTROL_SEGUIMIENTO_APP_VoL_10/
├── app/                          # Next.js App Router
│   ├── actions/                  # Server Actions
│   ├── admin/                    # Rutas de administración
│   ├── api/                      # API Routes
│   ├── login/                    # Página de login
│   ├── layout.tsx                # Layout principal
│   ├── page.tsx                  # Dashboard principal
│   └── globals.css              # Estilos globales
├── components/                   # Componentes React
│   ├── analytics/               # Dashboard de analytics
│   ├── auth/                    # Componentes de autenticación
│   ├── budgets/                 # Gestión de presupuestos
│   ├── common/                  # Componentes comunes
│   ├── dashboard/               # Componentes del dashboard
│   ├── finances/                # Gestión financiera
│   ├── notifications/            # Sistema de notificaciones
│   ├── payroll/                 # Gestión de nómina
│   ├── pdf/                     # Generación de PDFs
│   ├── progress/                # Control de avance
│   ├── project/                 # Gestión de proyectos
│   ├── settings/                # Configuración
│   ├── ui/                      # Componentes UI reutilizables
│   └── warehouse/               # Gestión de almacén
├── context/                      # Contextos React
├── hooks/                        # Custom hooks
├── lib/                          # Utilidades y configuración
│   ├── auth/                    # Lógica de autenticación
│   ├── calculators/             # Calculadoras financieras
│   ├── config/                  # Configuración de la app
│   ├── data/                    # Datos estáticos
│   ├── db/                      # Definición de base de datos local
│   ├── hooks/                   # Hooks personalizados
│   ├── integrations/            # Integraciones entre módulos
│   ├── proxy.ts                 # Proxy para desarrollo
│   ├── state/                   # Estado global
│   ├── supabase/                # Cliente Supabase
│   ├── types/                   # Definiciones de tipos TypeScript
│   └── utils/                   # Utilidades generales
├── public/                       # Archivos estáticos
├── scripts/                      # Scripts de utilidad
├── supabase/                     # Configuración de Supabase
│   ├── migrations/              # Migraciones de base de datos
│   └── legacy/                  # Archivos legacy
├── .env                          # Variables de entorno
├── .env.local                    # Variables locales
├── .env.production              # Variables de producción
├── package.json                  # Dependencias
├── tsconfig.json                # Configuración TypeScript
├── next.config.ts               # Configuración Next.js
└── tailwind.config.ts           # Configuración Tailwind
```

---

## Módulos y Funcionalidades

### 1. Dashboard Principal
- **KPIs en tiempo real**: Proyectos activos, presupuesto total, costo real, empleados, stock bajo, margen de utilidad
- **Gráficas interactivas**: Curva S, flujo de caja, desviación de presupuesto, diagrama de Gantt
- **Navegación por tabs**: Módulos principales organizados en tabs horizontales
- **Sidebar colapsable**: Navegación vertical con indicadores de badges
- **Responsive**: Diseño adaptativo para móvil y escritorio

### 2. Gestión de Proyectos
- **CRUD completo**: Crear, leer, actualizar, eliminar proyectos
- **Estados del proyecto**: Planning, Execution, Paused, Completed
- **Información detallada**: Cliente, ubicación, tipología, área, calidad
- **Roadblocks**: Detección y seguimiento de bloqueos críticos
- **Integración bitácora**: Registro de avance físico y financiero

### 3. Presupuestos
- **Cálculo de costos**: Costo directo, indirectos, contingencias, utilidad
- **Estructura jerárquica**: Capítulos, renglones, sub-renglones
- **Integración APU**: Análisis de precios unitarios automatizado
- **Conversiones comerciales**: Unidades técnicas a unidades comerciales
- **Multi-versión**: Gestión de versiones de presupuesto

### 4. Finanzas
- **Transacciones**: Ingresos y egresos categorizados
- **Categorías**: Materiales, mano de obra, maquinaria, subcontratos, otros
- **Métricas**: Flujo de caja, balance, márgenes
- **Integración proyectos**: Asignación de transacciones a proyectos
- **Reportes**: Exportación a CSV y PDF

### 5. Nómina
- **Empleados**: Directorio con tarifas diarias y por hora
- **Registros**: Períodos de pago, días trabajados, horas extra
- **Beneficios guatemaltecos**: IGSS, aguinaldo, vacaciones
- **Cálculos automáticos**: Pago neto con deducciones
- **Integración proyectos**: Asignación de registros a proyectos

### 6. Almacén
- **Inventario**: Control de stock de materiales
- **Alertas**: Notificación de stock bajo
- **Consumo**: Seguimiento de consumo real vs estimado
- **Integración presupuestos**: Items de presupuesto vinculados a stock
- **Proveedores**: Asociación de materiales con proveedores

### 7. Proveedores
- **Directorio**: Información de contacto de proveedores
- **Órdenes de compra**: Gestión de órdenes y estados
- **Historial**: Seguimiento de compras por proveedor
- **Condiciones**: Términos de pago y notas

### 8. Clientes
- **CRM básico**: Información de clientes
- **Tipos**: Individual y corporativo
- **Contactos**: Múltiples contactos por cliente
- **Integración proyectos**: Asociación de proyectos a clientes

### 9. Bitácora
- **Registro diario**: Eventos y avance del proyecto
- **Tipos de actividad**: Progreso, issues, milestones, notas
- **Avance físico/financiero**: Métricas de progreso
- **Fotos**: Adjuntar fotos a registros
- **Condiciones**: Clima, equipo presente

### 10. Analytics
- **KPIs avanzados**: SPI, CPI, SV, CV (Earned Value Management)
- **Tendencias**: Análisis de tendencias de costos y avance
- **Comparaciones**: Presupuesto vs real
- **Alertas**: Detección de desviaciones críticas
- **Exportación**: Reportes en múltiples formatos

### 11. Configuración
- **Ajustes de empresa**: Nombre, logo, configuración financiera
- **UI Settings**: Tema, animaciones, contraste, modo compacto
- **Configuración financiera**: Porcentajes de indirectos, contingencias, utilidad
- **Exportación**: Formatos y configuración de reportes
- **Notificaciones**: Preferencias de alertas

---

## Base de Datos

### Esquema Consolidado
La base de datos utiliza una sola migración consolidada (`001_consolidated_schema.sql`) que incluye:

#### Tablas Principales
- **projects**: Información de proyectos de construcción
- **budgets**: Presupuestos por proyecto
- **budget_items**: Items detallados de presupuesto
- **financial_transactions**: Transacciones financieras
- **payroll_employees**: Empleados de nómina
- **payroll_records**: Registros de pago
- **warehouse_stock**: Inventario de almacén
- **clients**: Información de clientes
- **project_logs**: Bitácora de proyectos
- **suppliers**: Directorio de proveedores
- **purchase_orders**: Órdenes de compra
- **purchase_order_items**: Items de órdenes de compra
- **subcontractors**: Subcontratistas
- **user_settings**: Configuración por usuario

#### Características de Seguridad
- **Row Level Security (RLS)**: Políticas por usuario (`auth.uid()`)
- **Cascades**: Eliminación en cascada apropiada
- **SET NULL**: Para relaciones que no deben eliminar en cascada
- **Índices**: Optimizados para consultas frecuentes
- **Triggers**: Actualización automática de `updated_at`
- **Realtime**: Publicación para suscripciones en tiempo real

#### Sincronización
- **sync_status**: Estado de sincronización (`synced`, `created_offline`, `updated_offline`, `syncing`, `pending`, `sync_failed`)
- **last_sync_attempt**: Timestamp del último intento
- **sync_error**: Mensaje de error si falló
- **sync_attempts**: Contador de intentos para reintentos exponenciales

---

## Configuración y Despliegue

### Variables de Entorno
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Opcional: Service Role Key para operaciones admin
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Instalación
```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# Ejecutar en desarrollo
npm run dev

# Compilar para producción
npm run build

# Iniciar producción
npm start
```

### Despliegue en Vercel
```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Desplegar
vercel

# Configurar variables de entorno en Vercel Dashboard
```

### Migraciones de Base de Datos
```bash
# Aplicar migración consolidada
supabase db push

# Verificar estado
supabase db diff

# Generar migración desde cambios locales
supabase db diff --use-migra
```

---

## Guía de Desarrollo

### Estándares de Código
- **TypeScript**: Tipado estricto en todo el código
- **Componentes**: Functional components con hooks
- **Estilos**: Tailwind CSS con clases de utilidad
- **Organización**: Separación clara de concerns
- **Nomenclatura**: camelCase para variables, PascalCase para componentes

### Tipado
- **Interfaces**: Definir interfaces para todos los datos
- **Tipos**: Usar tipos TypeScript para enums y unions
- **Genéricos**: Usar genéricos para componentes reutilizables
- **Null checks**: Validar siempre datos opcionales

### Hooks Personalizados
- **useBusinessSettings**: Configuración de empresa y finanzas
- **useFinancialSettings**: Configuración financiera específica
- **useRealtimeRefresh**: Actualización en tiempo real de datos
- **useSyncStatus**: Estado de sincronización offline
- **useConfirm**: Diálogos de confirmación
- **useNotifications**: Sistema de notificaciones

### Utilidades
- **logger**: Logging estructurado con niveles
- **generateId**: Generación de UUIDs
- **userScope**: Filtrado de datos por usuario
- **offlineSync**: Motor de sincronización offline
- **calculateUtilityMargin**: Cálculo de márgenes de utilidad

### Pruebas
```bash
# Ejecutar tests
npm test

# Type checking
npm run type-check

# Linting (si está configurado)
npm run lint
```

---

## Troubleshooting

### Problemas Comunes

#### 1. Error de compilación TypeScript
**Solución**: Ejecutar `npm run type-check` para identificar errores de tipado

#### 2. Error de sincronización
**Solución**: Verificar que Supabase esté configurado correctamente y que las credenciales sean válidas

#### 3. Datos no aparecen en el dashboard
**Solución**: Verificar que los datos tengan el `user_id` correcto y que las políticas RLS permitan el acceso

#### 4. Error en cálculos financieros
**Solución**: Verificar que la configuración financiera esté correctamente establecida en Settings

#### 5. Performance lenta en móvil
**Solución**: Activar modo de performance en Settings > Performance > Low

### Logs y Debugging
- **Console**: Revisar logs del navegador para errores en tiempo real
- **Supabase Dashboard**: Revisar logs de servidor y consultas
- **Network**: Verificar requests y responses en DevTools
- **IndexedDB**: Inspeccionar datos locales en DevTools > Application > IndexedDB

### Recuperación de Datos
- **Backup local**: Los datos persisten en IndexedDB del navegador
- **Backup remoto**: Supabase mantiene copia de seguridad automática
- **Exportación**: Usar funcionalidad de exportación a CSV/PDF

---

## Actualizaciones Recientes

### v10 - Refactorización Completa
- **Tipado**: TypeScript estricto en todo el código
- **Utilidades consolidadas**: Centralización en `lib/utils/index.ts`
- **Migraciones**: Esquema consolidado en un solo archivo
- **Componentes**: Tipado correcto y removal de propiedades obsoletas
- **Performance**: Optimización de renders y memoización
- **CSS**: Estilos optimizados y responsive mejorado

### Correcciones Críticas
- **ProgressTracker**: Corrección de tipos en ActiveBudgetState
- **SummaryCalculations**: Tipado correcto de UISettings
- **BudgetItems**: Remoción de propiedades obsoletas
- **OfflineSync**: Mejoras en manejo de conflictos

---

## Soporte

Para problemas o preguntas:
- Revisar esta documentación consolidada
- Verificar logs y errores en consola
- Consultar documentación de Supabase
- Revisar issues en GitHub del proyecto

---

**Última actualización**: Agosto 2026  
**Versión**: v10.0.0  
**Estado**: ✅ Producción Ready
