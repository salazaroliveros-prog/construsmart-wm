# Guía de Testing para Diferentes Dispositivos
## CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"

---

## 📱 Dispositivos de Testing Prioritarios

### 1. Smartphones (Prioridad Alta)
**Modelos Recomendados:**
- iPhone 12/13/14/15 (iOS 14+)
- Samsung Galaxy S21/S22/S23 (Android 12+)
- Google Pixel 6/7 (Android 13+)
- OnePlus 9/10 (Android 12+)

**Viewports Críticos:**
- 375x667 (iPhone SE)
- 390x844 (iPhone 12/13)
- 414x896 (iPhone 14 Pro Max)
- 360x640 (Android Básico)
- 412x915 (Samsung Galaxy)

### 2. Tablets (Prioridad Media)
**Modelos Recomendados:**
- iPad Air/Pro (iOS 15+)
- Samsung Galaxy Tab S8/S9 (Android 12+)
- Microsoft Surface Pro (Windows 11)

**Viewports Críticos:**
- 768x1024 (iPad Portrait)
- 1024x768 (iPad Landscape)
- 820x1180 (Galaxy Tab Portrait)

### 3. Desktop (Prioridad Alta)
**Resoluciones Críticas:**
- 1366x768 (Laptop básico)
- 1920x1080 (Full HD)
- 2560x1440 (2K QHD)
- 3840x2160 (4K UHD)

---

## 🧪 Checklist de Testing por Componente

### Header Dual-Brand
- [ ] Logos lado a lado visibles en desktop
- [ ] Logo principal visible en móvil
- [ ] Logo secundario oculto en móvil (<640px)
- [ ] Avatar con anillo luminoso visible
- [ ] Badge Online/Offline funcional
- [ ] Reloj y fecha funcionando correctamente
- [ ] Header fixed en móvil no obstructivo
- [ ] Header relative en desktop

### Navegación Lateral
- [ ] Sidebar visible en desktop
- [ ] Sidebar colapsado por defecto en móvil
- [ ] Botón menú hamburguesa visible en móvil
- [ ] Overlay oscuro al abrir menú móvil
- [ ] Cierre al hacer click en overlay
- [ ] Cierre al seleccionar una opción
- [ ] Z-index correcto (no overlaps con header)
- [ ] Scroll del body bloqueado cuando menú abierto

### Dashboard Principal
- [ ] Tarjetas de estadísticas visibles
- [ ] Grid responsivo (6 col desktop, 2 col móvil)
- [ ] Acciones rápidas funcionales
- [ ] Matriz de costos visible
- [ ] Actividad reciente cargando
- [ ] Zero-scroll viewport en desktop
- [ ] Scroll suave en móvil

### Modales y Diálogos
- [ ] ConfirmDialog con scroll lock correcto
- [ ] Múltiples modales no bloquean scroll permanentemente
- [ ] Z-index superior a otros elementos
- [ ] Cierre con tecla Escape
- [ ] Cierre al hacer click fuera
- [ ] Focus management correcto
- [ ] Scroll position restaurado al cerrar

### Componentes de Módulos
- [ ] ProjectManager: Tablas con scroll horizontal en móvil
- [ ] BudgetCalculator: Formularios optimizados para móvil
- [ ] FinanceManager: Inputs numéricos con teclado correcto
- [ ] PayrollManager: Botones touch-friendly (44px mínimo)
- [ ] WarehouseManager: Tablas responsivas

---

## 🚨 Problemas Comunes y Soluciones

### 1. Header Overlapping Content
**Síntoma:** Header superpuesto al contenido en móvil
**Causa:** Padding-top insuficiente en main
**Solución:** Verificar `pt-20 sm:pt-24 lg:pt-6` en main content

### 2. Sidebar Not Closing
**Síntoma:** Menú móvil permanece abierto
**Causa:** Estado no actualizado o z-index incorrecto
**Solución:** Verificar `useScrollLock` y z-index layering

### 3. Scroll Blocking Issues
**Síntoma:** Scroll bloqueado permanentemente
**Causa:** Counter de scroll lock no decrementado
**Solución:** Verificar cleanup en `useScrollLock`

### 4. Modal Z-Index Conflicts
**Síntoma:** Modal aparece detrás de otros elementos
**Causa:** Z-index inconsistente
**Solución:** Verificar jerarquía: z-30 (header), z-40 (sidebar), z-50 (modal)

### 5. Service Worker Serving Old Content
**Síntoma:** Cambios no visibles después de deploy
**Causa:** Cache-First agresivo en development
**Solución:** Limpiar cache o usar Network-First en dev

---

## 🔧 Herramientas de Testing

### Browser DevTools
```javascript
// Emular dispositivos móviles
Chrome DevTools > Toggle Device Toolbar

// Testing de Service Worker
Chrome DevTools > Application > Service Workers

// Testing de Storage
Chrome DevTools > Application > IndexedDB > ConstructoraWM_OfflineDB
```

### Testing de Performance
```bash
# Build de producción
npm run build

# Iniciar servidor de producción
npm start

# Lighthouse CLI
npx lighthouse http://localhost:3000 --view
```

### Testing de PWA
```bash
# Instalar Lighthouse PWA plugin
npm install -g lighthouse

# Ejecutar test PWA
lighthouse http://localhost:3000 --only-pwa
```

---

## 📊 Métricas de Performance Objetivas

### Core Web Vitals
- **LCP (Largest Contentful Paint):** < 2.5s
- **FID (First Input Delay):** < 100ms
- **CLS (Cumulative Layout Shift):** < 0.1

### Performance Metrics
- **Time to Interactive:** < 3.5s
- **First Contentful Paint:** < 1.8s
- **Speed Index:** < 3.4s

### Mobile-Specific
- **Touch Response Time:** < 50ms
- **Scroll Performance:** 60fps
- **Animation Smoothness:** 60fps

---

## 🧪 Scripts de Testing Automatizados

### Script de Testing Básico
```bash
#!/bin/bash
# test-basic.sh

echo "🧪 Iniciando testing básico..."

# Test 1: Build
echo "📦 Test 1: Build de producción..."
npm run build
if [ $? -eq 0 ]; then
  echo "✅ Build exitoso"
else
  echo "❌ Build falló"
  exit 1
fi

# Test 2: Type Check
echo "🔍 Test 2: Type checking..."
npm run type-check
if [ $? -eq 0 ]; then
  echo "✅ Type check exitoso"
else
  echo "❌ Type check falló"
  exit 1
fi

# Test 3: Lint
echo "🧹 Test 3: Linting..."
npm run lint
if [ $? -eq 0 ]; then
  echo "✅ Linting exitoso"
else
  echo "❌ Linting falló"
  exit 1
fi

echo "🎉 Todos los tests básicos pasaron!"
```

### Script de Testing de PWA
```bash
#!/bin/bash
# test-pwa.sh

echo "📱 Iniciando testing PWA..."

# Test 1: Manifest validation
echo "📋 Test 1: Validación de manifest..."
npx @pwa-manifest/validator public/manifest.json

# Test 2: Service Worker registration
echo "🔄 Test 2: Validación de Service Worker..."
npx workbox-cli validate public/sw.js

# Test 3: Lighthouse PWA
echo "⚡ Test 3: Lighthouse PWA score..."
npx lighthouse http://localhost:3000 --only-pwa --output=json

echo "🎉 Testing PWA completado!"
```

---

## 🚀 Proceso de Testing para Deploy

### Pre-Deploy Checklist
1. [ ] Ejecutar tests básicos (`./test-basic.sh`)
2. [ ] Verificar build de producción local
3. [ ] Testing en Chrome Desktop (1920x1080)
4. [ ] Testing en Firefox Desktop (1920x1080)
5. [ ] Testing en Safari Desktop (1920x1080)
6. [ ] Testing en iPhone (390x844)
7. [ ] Testing en Android (360x640)
8. [ ] Testing en iPad (768x1024)
9. [ ] Verificar PWA installation
10. [ ] Verificar Service Worker registration
11. [ ] Verificar IndexedDB functionality
12. [ ] Verificar Offline functionality

### Post-Deploy Verification
1. [ ] Verificar deployment en Vercel
2. [ ] Limpiar cache de Service Worker
3. [ ] Testing en URLs de producción
4. [ ] Verificar Analytics (si aplica)
5. [ ] Verificar Error logging (si aplica)

---

## 📝 Reporte de Bugs Template

```markdown
## Bug Report - CONSTRUCTORA WM/M&S

### Descripción
[Breve descripción del problema]

### Pasos para Reproducir
1. [Paso 1]
2. [Paso 2]
3. [Paso 3]

### Comportamiento Esperado
[Lo que debería pasar]

### Comportamiento Actual
[Lo que realmente pasa]

### Ambiente
- Dispositivo: [Modelo]
- OS: [Versión]
- Browser: [Browser y versión]
- Viewport: [Resolución]
- URL: [URL del problema]

### Capturas de Pantalla
[Adjuntar capturas si aplica]

### Consola Errors
[Copiar errores de consola si aplica]

### Severidad
- [ ] Crítica (bloquea funcionalidad principal)
- [ ] Alta (afecta experiencia de usuario)
- [ ] Media (problema menor)
- [ ] Baja (cosmético)
```

---

## 🎯 Priorización de Fixes

### Crítica (Inmediato)
- Header que bloquea navegación
- Sidebar que no cierra
- Modales que bloquean scroll permanentemente
- Service Worker que sirve contenido obsoleto

### Alta (Este Sprint)
- Layout breaking en móviles específicos
- Performance < 3s en 3G
- PWA installation falla
- Offline functionality no funciona

### Media (Próximo Sprint)
- Mejoras de performance
- Optimización de imágenes
- Mejoras de accesibilidad

### Baja (Backlog)
- Mejoras cosméticas
- Animaciones adicionales
- Features nuevas

---

**Última Actualización:** 2026-07-30
**Versión:** 1.0.0
**Autor:** Devin AI Assistant