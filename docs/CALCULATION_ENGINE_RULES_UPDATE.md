# ACTUALIZACIÓN CALCULATION_ENGINE_RULES.md - 175 RENGLONES

**Fecha:** 2025-01-31  
**Motivo:** Actualizar la sección de renglones APU para reflejar la implementación actual de 175 renglones

---

## CAMBIO PROPUESTO

### Sección 4: Renglones APU Disponibles

**ANTES:**
```
### 4. Renglones APU Disponibles

El sistema incluye 40 renglones estándar de construcción organizados por tipología:

| Tipología | Renglones | Rango de Códigos |
|-----------|-----------|------------------|
| Residential | 25 | RES-001 a RES-025 |
| Commercial | 25 | COM-001 a COM-025 |
| Industrial | 25 | IND-001 a IND-025 |
| Obra Civil | 25 | OC-001 a OC-025 |
| Obra Pública | 25 | OP-001 a OP-025 |

**Total: 125 renglones estándar**
```

**DESPUÉS:**
```
### 4. Renglones APU Disponibles

El sistema incluye 175 renglones estándar de construcción organizados por tipología:

| Tipología | Renglones | Rango de Códigos |
|-----------|-----------|------------------|
| Residential | 35 | RES-001 a RES-035 |
| Commercial | 35 | COM-001 a COM-035 |
| Industrial | 35 | IND-001 a IND-035 |
| Obra Civil | 35 | OC-001 a OC-035 |
| Obra Pública | 35 | OP-001 a OP-035 |

**Total: 175 renglones estándar**

**Nota:** Para detalles sobre la decisión de aumentar de 125 a 175 renglones, ver `docs/APU_RENGLONES_DECISION.md`
```

---

## JUSTIFICACIÓN

La implementación actual del sistema tiene 175 renglones (35 por tipología) en lugar de los 125 especificados originalmente (25 por tipología). Los 50 renglones adicionales fueron agregados para proporcionar mayor cobertura de items de construcción comunes y son funcionales y útiles.

Esta documentación debe actualizarse para reflejar el estado actual del sistema.
