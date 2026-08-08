# DECISIÓN SOBRE CANTIDAD DE RENGLONES APU

**Fecha:** 2025-01-31  
**Decisión:** Mantener 175 renglones (35 por tipología)

---

## ANÁLISIS

### Especificación Original (docs/INSTRUCCIONES_APU_PRESUPUESTOS.md)
- 25 renglones por tipología
- 5 tipologías (residential, commercial, industrial, civil, public)
- **Total especificado: 125 renglones**

### Implementación Actual (lib/data/apuRenglones.ts + migración SQL)
- 35 renglones por tipología
- 5 tipologías (residential, commercial, industrial, civil, public)
- **Total implementado: 175 renglones**

### Diferencia
- **50 renglones adicionales** (10 por tipología)

---

## RENGLONES ADICIONALES POR TIPOLOGÍA

### Residencial (+10)
- RES-026: Gradas interiores/exteriores
- RES-027: Barandal de seguridad
- RES-028: Closets empotrados
- RES-029: Cocina integral
- RES-030: Extractor de cocina
- RES-031: Calentador de agua
- RES-032: Patio de lavado
- RES-033: Fondo de escalera
- RES-034: Placard de almacenamiento
- RES-035: Entrega de obra

### Comercial (+10)
- COM-026: Counter de atención
- COM-027: Divisorias de oficina
- COM-028: Puerta de emergencia
- COM-029: Escaleras metálicas
- COM-030: Ascensor comercial
- COM-031: Sistema contra incendios (Bomberos)
- COM-032: Cableado de fibra óptica
- COM-033: Sala de servidores
- COM-034: Sistema de control de acceso
- COM-035: Entrega de llaves y manuales

### Industrial (+10)
- IND-026: Plataforma de trabajo elevada
- IND-027: Tanque de combustible
- IND-028: Sistema de gas industrial
- IND-029: Compresor de aire principal
- IND-030: Sistema de agua de proceso
- IND-031: Planta de tratamiento de efluentes
- IND-032: Zona de carga camiones
- IND-033: Oficina de control de procesos
- IND-034: Áreas de estacionamiento
- IND-035: Pruebas operacionales

### Obra Civil (+10)
- OC-026: Muro de concreto ciclópeo
- OC-027: Pilotes de concreto
- OC-028: Vigueta y bovedilla
- OC-029: Acera peatonal
- OC-030: Bordillo de concreto
- OC-031: Drenaje lateral profundo
- OC-032: Canaletas de desagüe
- OC-033: Señalización temporal de obra
- OC-034: Control de vehículos
- OC-035: Mantenimiento de vía

### Obra Pública (+10)
- OP-026: Cerramiento perimetral
- OP-027: Portón de acceso vehicular
- OP-028: Caseta de guardia
- OP-029: Bodega de almacenamiento
- OP-030: Estacionamiento público
- OP-031: Área de descanso/bancas
- OP-032: Cisternado público
- OP-033: Planta eléctrica de emergencia
- OP-034: Sistema de seguridad CCTV
- OP-035: Recepción final por supervisión

---

## DECISIÓN

**Opción A (ELEGIDA):** Mantener 175 renglones y actualizar documentación

### Justificación

1. **Valor Funcional**: Los 50 renglones adicionales son items de construcción reales y útiles que enriquecen la librería APU
2. **No Impacto Técnico**: No hay ningún problema técnico con tener más renglones de los especificados
3. **Mayor Cobertura**: Proporcionan mayor cobertura de items de construcción comunes
4. **Implementación Completa**: Ya están implementados en código y en migración SQL
5. **Sin Costo Adicional**: No requieren cambios de estructura de DB

### Acción Tomada

- **Mantener** los 175 renglones en código
- **Mantener** los 175 renglones en migración SQL
- **Actualizar** documentación `docs/INSTRUCCIONES_APU_PRESUPUESTOS.md` para reflejar 35 renglones por tipología
- **Actualizar** documentación `docs/CALCULATION_ENGINE_RULES.md` para reflejar 175 renglones totales

---

## REQUIERE MIGRACIÓN DE DB

**NO** - Los renglones ya están en la migración SQL `20250131000003_add_new_apu_renglones.sql`. Solo se requiere actualizar la documentación.
