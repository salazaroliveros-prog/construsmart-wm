# INSTRUCCIONES PARA CARGAR DATOS DE PRUEBA

## 📋 Pasos para ejecutar el script SQL

### 1. Abrir Supabase Dashboard

Abrir en el navegador:
```
https://supabase.com/dashboard/project/yibjsruoxjlgdnkgylld/editor
```

### 2. Acceder al SQL Editor

1. En el menú lateral izquierdo, click en **"SQL Editor"**
2. Click en el botón **"New query"** (esquina superior derecha)

### 3. Copiar el script SQL

1. Abrir el archivo: `scripts/seed-test-data.sql`
2. Copiar **TODO** el contenido del archivo (Ctrl+A, Ctrl+C)
3. Pegar en el editor de SQL de Supabase (Ctrl+V)

### 4. Ejecutar el script

1. Click en el botón **"Run"** (esquina inferior derecha)
2. Esperar a que se ejecute (puede tardar 10-30 segundos)

### 5. Verificar resultados

Al final del script hay una consulta que muestra el resumen:
```sql
SELECT 
  'Data seeded successfully!' as status,
  (SELECT COUNT(*) FROM clients) as total_clients,
  (SELECT COUNT(*) FROM projects) as total_projects,
  ...
```

Debes ver algo como:
```
Data seeded successfully! | 3 | 3 | 3 | 7 | 7 | 4 | 3 | 5 | 3 | 3 | 7
```

## ✅ Datos que se insertan

- **3 Clientes** (2 corporativos, 1 individual)
- **3 Proyectos** (1 planificación, 1 ejecución, 1 completado)
- **3 Presupuestos** con **7 items**
- **7 Transacciones financieras** (ingresos y gastos)
- **4 Empleados** (maestro, ayudante, electricista, fontanero)
- **3 Registros de nómina**
- **5 Items de inventario** (cemento, acero, bloques, pintura, cerámica)
- **3 Proveedores** (materiales, ferretería, eléctricos)
- **3 Órdenes de compra** (pending, in_transit, delivered)
- **3 Items de órdenes** de compra
- **7 Entradas de bitácora** con avances físicos y financieros

## 🔄 Volver a ejecutar

El script usa `ON CONFLICT DO NOTHING/UPDATE`, por lo que se puede ejecutar múltiples veces sin crear duplicados.

## 📊 Verificar en el Dashboard

Después de ejecutar el script:

1. **Dashboard Principal** - Verás los KPIs actualizados
2. **Pestaña "Proyectos"** - 3 proyectos visibles
3. **Pestaña "Finanzas"** - 7 transacciones
4. **Pestaña "Presupuestos"** - 3 presupuestos con items
5. **Pestaña "Almacén"** - 5 items de inventario
6. **Pestaña "Proveedores"** - 3 proveedores y 3 órdenes
7. **Pestaña "Bitácora"** - 7 entradas de progreso

## ⚠️ Notas importantes

- **No** modificar el código del script SQL
- **No** ejecutar comandos `supabase db execute` (no disponibles en este plan)
- El script puede tardar hasta 1 minuto en completarse
- Si hay error, verificar que todas las tablas existen (ejecutar migraciones primero)

## 🆘 Solución de problemas

### Error: "relation does not exist"
- Solución: Ejecutar primero las migraciones de Supabase

### Error: "duplicate key value"
- Solución: El script está diseñado para evitar esto, pero si ocurre, usar el Dashboard para eliminar los registros duplicados manualmente

### Los datos no aparecen en el dashboard
- Solución: Recargar la página (F5)
- Verificar que la fecha/hora del navegador esté correcta
- Revisar la consola del navegador (F12) por errores