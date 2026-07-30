#!/bin/bash
# Script para verificar el despliegue en Vercel

echo "🚀 Verificando despliegue en Vercel..."
echo ""

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verificar que el push fue exitoso
echo "📋 1. Verificando push a GitHub..."
LATEST_COMMIT=$(git log -1 --pretty=format:"%H")
echo "   Último commit: $LATEST_COMMIT"

if git remote show origin | grep -q "$LATEST_COMMIT"; then
    echo -e "${GREEN}✅ Push verificado en GitHub${NC}"
else
    echo -e "${YELLOW}⚠️  Push puede estar en proceso${NC}"
fi

# 2. Verificar estado del build local
echo ""
echo "🏗️  2. Verificando build local..."
if [ -d ".next" ]; then
    echo -e "${GREEN}✅ Build local existe${NC}"
else
    echo -e "${RED}❌ Build local no encontrado${NC}"
    exit 1
fi

# 3. Instrucciones para verificar en Vercel
echo ""
echo "🌐 3. Instrucciones para verificar despliegue en Vercel:"
echo ""
echo "   Opción A: Vía Web UI"
echo "   1. Ir a https://vercel.com/dashboard"
echo "   2. Seleccionar proyecto: Control_Constructora"
echo "   3. Verificar último deployment en la pestaña 'Deployments'"
echo "   4. Buscar commit: $LATEST_COMMIT"
echo "   5. Verificar que el estado sea 'Ready' ✅"
echo ""
echo "   Opción B: Vía Vercel CLI"
echo "   1. Instalar Vercel CLI: npm i -g vercel"
echo "   2. Login: vercel login"
echo "   3. Verificar deployments: vercel list"
echo "   4. Verificar logs: vercel logs"
echo ""

# 4. Verificar archivo de configuración
echo "⚙️  4. Verificando configuración de Vercel..."
if [ -f "vercel.json" ]; then
    echo -e "${GREEN}✅ vercel.json encontrado${NC}"
    cat vercel.json
else
    echo -e "${YELLOW}⚠️  vercel.json no encontrado (usando configuración por defecto)${NC}"
fi

# 5. Checklist de verificación
echo ""
echo "📋 5. Checklist de verificación post-deploy:"
echo ""
echo "   [ ] Build completado sin errores"
echo "   [ ] Deployment status: Ready"
echo "   [ ] URL de producción accesible"
echo "   [ ] PWA manifest accesible"
echo "   [ ] Service worker registrado"
echo "   [ ] No hay errores en consola"
echo "   [ ] Testing en móvil exitoso"
echo "   [ ] Testing en desktop exitoso"
echo ""

# 6. URLs importantes
echo "🔗 6. URLs importantes:"
echo ""
echo "   - Dashboard Vercel: https://vercel.com/dashboard"
echo "   - Proyecto: https://vercel.com/salazaroliveros-prog's-projects/control-constructora"
echo "   - Producción: https://control-constructora-wm.vercel.app"
echo ""

echo "✨ Verificación local completada. Por favor verifica en Vercel Dashboard."
echo ""
echo "Commit hash: $LATEST_COMMIT"
echo "Timestamp: $(date)"