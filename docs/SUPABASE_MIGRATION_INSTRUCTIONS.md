# Instrucciones para Ejecutar Migración SQL en Supabase

## Migración: Tablas para Nuevos Módulos (CRM, Bitácora, Proveedores, Órdenes de Compra)

**Archivo:** `supabase/migrations/20250119000000_add_new_modules_tables.sql`

---

## Método 1: Ejecutar en Dashboard de Supabase (Recomendado)

1. **Abrir el Dashboard de Supabase:**
   - Ve a: https://supabase.com/dashboard/project/yibjsruoxjlgdnkgylld

2. **Navegar al SQL Editor:**
   - En el menú lateral, haz clic en "SQL Editor"
   - Haz clic en "New query"

3. **Copiar y Pegar el SQL:**
   - Abre el archivo: `supabase/migrations/20250119000000_add_new_modules_tables.sql`
   - Copia todo el contenido del archivo
   - Pégalo en el SQL Editor del dashboard

4. **Ejecutar:**
   - Haz clic en el botón "Run" (▶️) en la esquina inferior derecha
   - Espera a que se complete la ejecución
   - Deberías ver "Success" en la parte inferior

5. **Verificar:**
   - Ve a "Table Editor" en el menú lateral
   - Deberías ver las nuevas tablas:
     - `clients`
     - `project_logs`
     - `suppliers`
     - `purchase_orders`
     - `purchase_order_items`

---

## Método 2: Ejecutar con Supabase CLI (Requiere configuración de contraseña)

1. **Obtener la contraseña de la base de datos:**
   - Ve a: https://supabase.com/dashboard/project/yibjsruoxjlgdnkgylld/settings/database
   - En la sección "Connection string", copia la contraseña después de `password=`
   - O ve a "Database Password" y "Reset database password" para crear una nueva

2. **Configurar variable de entorno:**
   ```powershell
   $env:SUPABASE_DB_PASSWORD = "tu_contraseña_aqui"
   ```

3. **Ejecutar la migración:**
   ```powershell
   supabase db push
   ```

---

## Tablas que se Crearán

### 1. `clients` (CRM)
- id, code, name, client_type, contact_person, phone, email, address, city, tax_id, notes
- Índices: code, name, type, sync_status
- RLS Policies: authenticated users pueden CRUD

### 2. `project_logs` (Bitácora)
- id, project_id, activity_type, description, physical_progress, financial_progress, log_date, created_by, notes
- Índices: project_id, activity_type, log_date, sync_status
- RLS Policies: authenticated users pueden CRUD

### 3. `suppliers` (Proveedores)
- id, code, name, contact_person, phone, email, address, city, payment_terms, notes
- Índices: code, name, sync_status
- RLS Policies: authenticated users pueden CRUD

### 4. `purchase_orders` (Órdenes de Compra)
- id, code, supplier_id, project_id, order_date, expected_delivery_date, status, total_amount, notes
- Índices: code, supplier_id, project_id, status, order_date, sync_status
- RLS Policies: authenticated users pueden CRUD

### 5. `purchase_order_items` (Items de Órdenes)
- id, purchase_order_id, item_code, description, quantity, unit, unit_price, total_price, notes
- Índices: purchase_order_id, item_code, sync_status
- RLS Policies: authenticated users pueden CRUD

---

## Características Incluidas

✅ **Triggers automáticos de updated_at**
- Todas las tablas tienen triggers para actualizar automáticamente el campo `updated_at`

✅ **Row Level Security (RLS)**
- Todas las tablas tienen RLS habilitado
- Policies para authenticated users (SELECT, INSERT, UPDATE, DELETE)

✅ **Índices optimizados**
- Índices en campos frecuentemente consultados
- Índices en sync_status para sincronización offline

✅ **Foreign Keys**
- project_logs → projects (CASCADE)
- purchase_orders → suppliers (RESTRICT)
- purchase_orders → projects (SET NULL)
- purchase_order_items → purchase_orders (CASCADE)

✅ **Constraints CHECK**
- client_type: individual, corporate
- activity_type: progress, issue, milestone, note
- status: pending, approved, ordered, received, cancelled
- sync_status: synced, pending, updated_offline, deleted

---

## Verificación Posterior

Después de ejecutar la migración, verifica:

1. **En el Dashboard:**
   - Ve a "Table Editor"
   - Confirma que las 5 tablas nuevas existen
   - Verifica que los índices están creados
   - Verifica que las RLS policies están activas

2. **En la Aplicación:**
   - Abre la aplicación: https://control-constructora-wm.vercel.app
   - Navega a "Clientes" - debería poder crear clientes
   - Navega a "Bitácora" - debería poder crear logs
   - Navega a "Proveedores" - debería poder crear proveedores
   - Navega a "Órdenes de Compra" - debería poder crear órdenes

---

## Solución de Problemas

**Error: "relation already exists"**
- Las tablas ya existen en la base de datos
- Verifica en el dashboard si las tablas ya están creadas
- Si existen, la migración no es necesaria

**Error: "permission denied"**
- Verifica que estás autenticado como usuario con permisos de administrador
- En el dashboard, asegúrate de estar en el proyecto correcto

**Error: "foreign key violation"**
- Asegúrate de que las tablas referenciadas (projects, suppliers) existen
- Verifica que los datos de referencia son válidos

---

## Soporte

Si encuentras algún problema:
1. Verifica el error específico en el dashboard de Supabase
2. Revisa el archivo SQL para ver si hay conflictos con tablas existentes
3. Contacta al soporte de Supabase si es un problema de permisos o configuración
