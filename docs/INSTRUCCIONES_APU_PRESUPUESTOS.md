# 📱 GUÍA DE INTEGRACIÓN TÉCNICA: LÓGICA DE APU Y CÁLCULOS AL MÓDULO DE PRESUPUESTOS Y SUITE ERP

**Sistema ERP:** SOFTCON-MYS-CONSTRU-WM  
**Eslogan:** "CONSTRUYENDO TU FUTURO"  
**Módulo Objetivo:** Módulo de Presupuestos (Análisis de Precios Unitarios - APU y Renglones de Trabajo)  
**Integración:** Interconectado con Topografía/CivilCAD, Control de Avances, Contabilidad/Finanzas y Reportería PDF.

---

## 1. 🎯 OBJETIVO Y ARQUITECTURA DE INTEGRACIÓN

Esta especificación técnica instruye al agente de Inteligencia Artificial para incorporar las **fórmulas matemáticas, factores de rendimiento y renglones de trabajo por tipología (Residencial, Comercial, Industrial, Obra Civil y Obra Pública)** dentro de la estructura existente del **Módulo de Presupuestos** (`modulos/presupuestos.py`) de SOFTCON-MYS-CONSTRU-WM.

> **REGLA INTEGRAL DE ARQUITECTURA:** No debe crearse un módulo aislado. Toda la lógica de cálculo descrita en este documento se fusionará con los componentes actuales de Presupuesto e interconectará directamente con los demás módulos de la suite ERP.

### Matriz de Interconexión del Módulo de Presupuestos

| Módulo de la Suite ERP | Mecanismo de Interconexión con Presupuestos |
| :--- | :--- |
| **1. Topografía / CivilCAD** | Provee volúmenes netos de corte/relleno ($m^3$) y áreas de terreno ($m^2$) para alimentar automáticamente los renglones de Obra Civil/Residencial desde `st.session_state["datos_topografia"]`. |
| **2. Estimaciones y Control de Avance** | Lee los costos directos ($CD$) e indirectos ($CI$) calculados en las plantillas APU para monitorear el avance físico vs. financiero en tiempo real. |
| **3. Finanzas y Contabilidad** | Recibe el desglose de indirectos (fianzas, impuestos, administración) para la proyección de flujo de caja y emisión de facturación. |
| **4. Reportería y Exportación PDF** | Genera tarjetas formales de APU y presupuestos detallados por renglón respetando la identidad gráfica corporativa de **CONSTRUCTORA WM/M&S** y eslogan *"CONSTRUYENDO TU FUTURO"*. |

---

## 2. 🧮 LÓGICA MATEMÁTICA INTEGRADA DE APU (MOTOR DE CÁLCULO)

El motor de presupuestos debe implementar internamente la siguiente jerarquía de fórmulas dinámicas:

### A. Costo Directo ($CD$)
$$CD = \sum (Materiales) + \sum (Mano\,de\,Obra) + \sum (Maquinaria\,y\,Equipo)$$

### B. Rendimiento de Materiales con Factores Volumétricos
Para considerar el esponjamiento, compactación y desperdicios del sitio:
$$Cantidad\,Total = \left[ Cantidad\,Teórica 	imes (1 + \%Desperdicio) ight] 	imes Factor\,Volumétrico$$

* **Factor de Abundamiento (Corte/Excavación):** $1.25$ a $1.50$ según el tipo de suelo o roca.
* **Factor de Contracción (Terraplenes/Rellenos):** $0.85$ a $0.95$ ($V_{necesario} = rac{V_{diseño}}{F_{contracción}}$).

### C. Costo de Mano de Obra ($Costo_{MO}$)
$$Costo_{MO} = rac{Salario\,Diario\,Cuadrilla}{Rendimiento\,Diario}$$

### D. Costo Total e Indirectos ($CI$)
$$Costo_{Total} = CD 	imes (1 + \%Factor_{Indirecto})$$

---

## 3. 🏠🏢🏭🌉🏛️ BIBLIOTECA INTEGRADA DE RENGLONES POR TIPOLOGÍA

El agente debe integrar un selector de **Tipología de Proyecto** dentro de la vista principal del Módulo de Presupuestos que despliegue de forma predeterminada los siguientes 25 renglones parametrizados por tipología:

### 1. Tipología Residencial 🏠
| # | Renglón | Unidad | Lógica / Fórmula de Cálculo |
| :---: | :--- | :---: | :--- |
| 1 | Limpieza y chapeo | $m^2$ | $Área_{terreno}$ |
| 2 | Trazo y nivelación | $m^2$ | $Área_{planta}$. Estacas y cordel. |
| 3 | Excavación de cimiento | $m^3$ | $Ancho 	imes Profundidad 	imes Largo$ |
| 4 | Cimiento corrido | $m^3$ | Concreto + Acero por metro lineal |
| 5 | Refuerzo vertical (Columnas) | $kg$ | Longitud varilla $	imes$ peso nominal |
| 6 | Impermeabilización cimientos | $m^2$ | Área de contacto con el suelo |
| 7 | Muro de block/ladrillo | $m^2$ | Unidades/$m^2$ (considerando sisa de 1.5cm) |
| 8 | Solera de amarre | $m$ | Concreto y acero transversal |
| 9 | Relleno compactado | $m^3$ | $Volumen 	imes Factor_{abundamiento}$ |
| 10 | Instalación hidráulica base | $ml$ | Longitud de tubería + % accesorios |
| 11 | Drenajes sanitarios | $ml$ | Pendiente mínima y excavación por tramo |
| 12 | Viga de carga | $m^3$ | Acero longitudinal + estribos |
| 13 | Losa de entrepiso | $m^2$ | Espesor $	imes$ área (acero 2 direcciones) |
| 14 | Instalación eléctrica | Punto | Ducto y cable por salida |
| 15 | Repello de muros | $m^2$ | Área neta (descontando vanos) |
| 16 | Cernido/Acabado fino | $m^2$ | Rendimiento por saco de mezcla fina |
| 17 | Piso cerámico | $m^2$ | $Área 	imes (1 + \%Desperdicio)$ + pegamento |
| 18 | Azulejo en baños | $m^2$ | Altura instalación $	imes$ perímetro |
| 19 | Cielo falso | $m^2$ | Suspensión y estructura de soporte |
| 20 | Puertas de madera/metal | Unidad | Marco, chapa y bisagras |
| 21 | Ventanas de aluminio | $m^2$ | Medidas de vano en plano |
| 22 | Pintura látex | $m^2$ | $Área 	imes Num_{manos}$ / Rendimiento galón |
| 23 | Artefactos sanitarios | Unidad | Inodoro, lavamanos, grifería |
| 24 | Iluminación | Unidad | Lámparas según diseño eléctrico |
| 25 | Limpieza final | Global | Retiro de ripio y limpieza de vidrios |

### 2. Tipología Comercial 🏢
| # | Renglón | Unidad | Lógica / Fórmula de Cálculo |
| :---: | :--- | :---: | :--- |
| 1 | Cerramiento provisional | $ml$ | Perímetro del local/terreno |
| 2 | Demoliciones internas | $m^3$ | $Volumen 	imes 1.30$ (Esponjamiento) |
| 3 | Cimentación reforzada | $m^3$ | Zapatas aisladas para marcos |
| 4 | Estructura metálica | $kg$ / Ton | Peso perfiles $	imes 1.05$ (Desperdicio) |
| 5 | Pernos de anclaje | Unidad | Cantidad por placa base $	imes$ profundidad |
| 6 | Pintura intumescente | $m^2$ | Área expuesta del acero |
| 7 | Losacero (Mezzanine) | $m^2$ | Lámina troquelada + Concreto ($Área 	imes Espesor$) |
| 8 | Muros de Tablayeso (Drywall) | $m^2$ | Modulación a 0.61m. $Rend_{MO} = rac{Jornal}{20	ext{--}25 m^2/día}$ |
| 9 | Aislamiento termoacústico | $m^2$ | Área de muros/cielos |
| 10 | Ductería de HVAC | $kg$ / $lb$ | Desarrollo de ducto y calibre |
| 11 | Unidades Manejadoras de Aire (UMA) | Unidad | Capacidad en BTUs o Toneladas |
| 12 | Sistema de Rociadores (Fire Sprinklers) | Punto | Cabezales + $ml$ tubería cédula 40 |
| 13 | Tubería EMT (Eléctrica) | $ml$ | Diámetro $	imes$ longitud de trayectorias |
| 14 | Cableado estructurado | Punto | Longitud cable UTP + holgura en cajas |
| 15 | Tableros de distribución | Unidad | Número de polos y capacidad (Amperios) |
| 16 | Piso porcelanato alto tráfico | $m^2$ | $Área 	imes 1.10$ (Desperdicio por cortes) |
| 17 | Fachadas de Vidrio Templado | $m^2$ | Área vanos + herrajes/arañas |
| 18 | Cielo falso modular (60x60) | $m^2$ | $Área / 0.36$ + estructura metálica |
| 19 | Iluminación LED comercial | Unidad | Diseño de lúmenes por espacio |
| 20 | Cortinas metálicas enrollables | $m^2$ | $Ancho 	imes Alto$ (incluye caja motor) |
| 21 | Carpintería de aluminio | $m^2$ | Perfiles según serie comercial |
| 22 | Sistemas de detección de humo | Punto | Sensores + Panel direccionable |
| 23 | Acabados en piedra natural | $m^2$ | Mármol o granito + sellador |
| 24 | Rotulación y Señalética | Unidad | Normas de seguridad e imagen corporativa |
| 25 | Pruebas de sistemas (Comisionamiento) | Global | Horas técnico certificar HVAC, Eléctrico y Gas |

### 3. Tipología Industrial 🏭
| # | Renglón | Unidad | Lógica / Fórmula de Cálculo |
| :---: | :--- | :---: | :--- |
| 1 | Movimiento de tierras masivo | $m^3$ | $Área 	imes Altura 	imes Factor_{compactación}$ |
| 2 | Mejoramiento de suelo (Base) | $m^3$ | Material granular en capas de 0.20m |
| 3 | Cimentación profunda (Pilotes) | $ml$ | Profundidad hincado según estudio suelos |
| 4 | Zapatas conectadas | $m^3$ | Volumen concreto + Acero refuerzo ($kg$) |
| 5 | Columnas de acero pesado | $kg$ / Ton | Perfiles tipo W/H $	imes$ Altura $	imes$ Peso nominal |
| 6 | Montaje de estructura (Grúa) | Hora/Máq | Costo alquiler grúa / Toneladas montadas |
| 7 | Cubierta tipo sándwich | $m^2$ | Área techo (con pendiente) + % solapes |
| 8 | Lámina traslúcida | $m^2$ | % iluminación natural requerida |
| 9 | Piso industrial de alta resistencia | $m^2$ | $Volumen = (Área 	imes Espesor) 	imes 1.05$. Concreto con fibra. |
| 10 | Pasadores (Dowel bars) | Unidad | Acero liso en juntas de construcción |
| 11 | Corte de juntas de dilatación | $ml$ | Perímetro de cuadros $	imes$ profundidad disco |
| 12 | Endurecedor superficial | $m^2$ | $Costo_{Mat} = (Área 	imes Dosis_{kg/m^2}) 	imes Precio_{kg}$ |
| 13 | Muros perimetrales (Pre-fabricados) | $m^2$ | Paneles de concreto izados con grúa |
| 14 | Andenes de carga y descarga | Unidad | Excavación + Estructura + Niveladores mecánicos |
| 15 | Instalación de polipastos/puente grúa | Unidad | Capacidad de carga (Ton) + Longitud de riel |
| 16 | Sistema de red contra incendios | $ml$ | Tubería ranurada + Gabinetes + Bomba diésel |
| 17 | Iluminación tipo High-Bay | Unidad | Lámparas de alta potencia según altura |
| 18 | Transformador de potencia | KVA | Capacidad de carga eléctrica total |
| 19 | Canalización industrial (Charolas) | $ml$ | Ancho bandeja porta-cables $	imes$ longitud |
| 20 | Ventilación forzada (Extractores) | Unidad | Renovaciones de aire por hora (CFM) |
| 21 | Tubería para aire comprimido | $ml$ | Diámetro según caída de presión admisible |
| 22 | Pintura epóxica en pisos | $m^2$ | Rendimiento del kit epóxico (base + catalizador) |
| 23 | Cisterna de agua masiva | $m^3$ | Almacenamiento para proceso y RCI |
| 24 | Pavimento exterior (Patios) | $m^2$ | Espesor para tráfico de camiones pesados |
| 25 | Cerramiento de malla perimetral | $ml$ | Postes, malla y accesorios de seguridad |

### 4. Tipología Obra Civil e Infraestructura Vial 🌉🛣️
| # | Renglón | Unidad | Lógica / Fórmula de Cálculo |
| :---: | :--- | :---: | :--- |
| 1 | Derecho de vía (Limpieza) | $m^2$ | Área faja de terreno a intervenir |
| 2 | Trazo y nivelación topográfica | $km$ / $m^2$ | Enlace directo con módulo Topografía/CivilCAD |
| 3 | Corte de cajón / en roca | $m^3$ | $Área\ transversal 	imes Longitud 	imes Factor_{esponjamiento}$ |
| 4 | Remoción material inadecuado | $m^3$ | Retiro de suelos orgánicos o fango |
| 5 | Relleno de terraplén | $m^3$ | $V_{necesario} = rac{V_{diseño}}{F_{contracción}}$ ($F_{contracción} pprox 0.90$) |
| 6 | Sub-base granular | $m^3$ | Espesor compactado $	imes$ ancho calzada |
| 7 | Base granular | $m^3$ | Capa superior de soporte para pavimento |
| 8 | Imprimación asfáltica | Gal / $m^2$ | Riego de liga para adherir asfalto |
| 9 | Carpeta asfáltica en caliente | Ton | $Ton = Área 	imes Espesor 	imes Densidad\ (2.4\ Ton/m^3)$ |
| 10 | Pavimento de concreto hidráulico | $m^3$ | Losa de concreto rígido para rodadura |
| 11 | Cunetas de concreto | $ml$ | Canales laterales para drenaje pluvial |
| 12 | Alcantarillas transversales | $ml$ | Tuberías de concreto o metal bajo vía |
| 13 | Cimentación de puentes (Pilas) | $ml$ / $m^3$ | Excavación profunda y concreto masivo |
| 14 | Estribos de puente | $m^3$ | Estructuras de soporte en extremos |
| 15 | Vigas pretensadas/postensadas | Unidad | Vigas prefabricadas con cables tensados |
| 16 | Losa de rodadura (Puente) | $m^3$ | Concreto estructural sobre vigas |
| 17 | Juntas de dilatación | $ml$ | Sellos mecánicos para movimiento térmico |
| 18 | Defensa metálica (Guardavías) | $ml$ | Barreras de seguridad en curvas/puentes |
| 19 | Señalización horizontal | $m^2$ / $km$ | Pintura termoplástica + microesferas de vidrio |
| 20 | Señalización vertical | Unidad | Rótulos informativos, reglamentarios y preventivos |
| 21 | Muros de gaviones | $m^3$ | Cajas de malla rellenas de piedra clasificada |
| 22 | Subdrenaje (Francés) | $ml$ | Filtros con piedra y tubería perforada |
| 23 | Iluminación vial | Unidad | Postes y luminarias en tramos urbanos |
| 24 | Pozos de visita | Unidad | Estructuras verticales para alcantarillado |
| 25 | Protección de taludes | $m^2$ | Hidrosiembra o hidrosep |

### 5. Tipología Obra Pública (Edificación Estatal) 🏛️
| # | Renglón | Unidad | Lógica / Fórmula de Cálculo |
| :---: | :--- | :---: | :--- |
| 1 | Rótulo de Identificación de Obra | Unidad | Dimensiones exigidas por el ente contratista estatal |
| 2 | Movilización de Equipo | Global | Flete y transporte de maquinaria al sitio |
| 3 | Trazo y Nivelación | $m^2$ | Precisión topográfica inicial |
| 4 | Excavación Estructural | $m^3$ | $Largo 	imes Ancho 	imes Profundidad$ |
| 5 | Cimiento Corrido Reforzado | $m^3$ | Concreto + $kg$ de acero según norma estatal |
| 6 | Columnas y Vigas de Amarre | $m^3$ | Estructuras sismorresistentes obligatorias |
| 7 | Muro de Bloque Reforzado | $m^2$ | Unidades de bloque $	imes m^2$ + refuerzo interno |
| 8 | Instalaciones Hidráulicas | $ml$ | Tuberías certificadas y pruebas de presión |
| 9 | Drenajes Sanitarios | $ml$ | Tubería PVC $	imes$ pendiente de diseño |
| 10 | Red Pluvial | $ml$ | Manejo de aguas pluviales hacia colectores |
| 11 | Instalación Eléctrica Completa | Punto | Ductos, cables y tableros bajo norma |
| 12 | Estructura Metálica Techo | $kg$ / $m^2$ | Perfiles de acero + costaneras |
| 13 | Cubierta Lámina Troquelada | $m^2$ | Área de techo + % traslapes |
| 14 | Cielo Falso Acústico | $m^2$ | Paneles y suspensión metálica |
| 15 | Piso Concreto de Uso Rudo | $m^2$ | Resistencia a tráfico intenso de personas |
| 16 | Puertas Metálicas de Seguridad | Unidad | Marcos reforzados para uso público |
| 17 | Ventanas de Aluminio y Vidrio | $m^2$ | Marcos y empaques reforzados |
| 18 | Repello y Cernido de Muros | $m^2$ | Acabado liso lavable de alta duración |
| 19 | Pintura Institucional | $m^2$ | Pintura lavable para instituciones |
| 20 | Artefactos Sanitarios de Uso Rudo | Unidad | Inodoros, lavamanos e inoxidables |
| 21 | Rampas de Acceso Universal | $m^2$ | Cumplimiento estricto de norma ADA ($S = rac{Altura}{Longitud} 	imes 100 \le 8\%$) |
| 22 | Pasamanos de Acero Inoxidable | $ml$ | Protección en rampas y gradas |
| 23 | Jardinización y Áreas Verdes | $m^2$ | Grama y plantas ornamentales |
| 24 | Limpieza Final y Retiro Ripio | Global | Entrega de obra lista para operar |
| 25 | Planos Finales (As-Built) | Global | Planos de cómo quedó la obra según leyes estatales |

---

## 4. 🤖 INSTRUCCIONES EXACTAS PARA EL AGENTE DE CÓDIGO (STREAMLIT)

El agente debe modificar el archivo `modulos/presupuestos.py` integrando la siguiente plantilla refactorizada que une los APU, la selección por tipologías y la interconexión con la Suite:

```python
import streamlit as st
import pandas as pd

def render_modulo_presupuestos():
    st.title("🏗️ Módulo de Presupuestos & Análisis de Precios Unitarios (APU)")
    st.caption("SOFTCON-MYS-CONSTRU-WM — CONSTRUYENDO TU FUTURO")

    # 1. Selector de Tipología que alimenta dinámicamente las plantillas de APU
    tipologia = st.selectbox(
        "Seleccione la Tipología del Proyecto:",
        ["Residencial 🏠", "Comercial 🏢", "Industrial 🏭", "Obra Civil / Vial 🌉", "Obra Pública 🏛️"]
    )

    # 2. Interconexión con Topografía / CivilCAD
    if "datos_topografia" in st.session_state:
        st.info("💡 Se han importado volúmenes automáticamente desde el Módulo de Topografía/CivilCAD.")
        volumen_corte = st.session_state["datos_topografia"].get("vol_corte", 0.0)
    else:
        volumen_corte = 0.0

    st.subheader("🧮 Calculadora de Análisis de Precio Unitario (APU)")
    
    col1, col2, col3 = st.columns(3)
    with col1:
        cant_teorica = st.number_input("Cantidad Teórica del Renglón:", min_value=0.0, value=100.0)
        porcentaje_desperdicio = st.slider("% Desperdicio / Esponjamiento:", 0.0, 50.0, 5.0) / 100.0
    
    with col2:
        factor_volumetrico = st.number_input("Factor Volumétrico (Abundamiento/Contracción):", value=1.05)
        salario_cuadrilla = st.number_input("Coste Diario Cuadrilla (Q):", value=350.0)
    
    with col3:
        rendimiento_diario = st.number_input("Rendimiento Diario (Unidades/Día):", value=25.0)
        porcentaje_indirectos = st.slider("% Gastos Indirectos y Utilidad:", 0.0, 40.0, 18.0) / 100.0

    # Fórmulas Integradas
    cant_total_material = (cant_teorica * (1 + porcentaje_desperdicio)) * factor_volumetrico
    costo_unitario_mo = salario_cuadrilla / rendimiento_diario if rendimiento_diario > 0 else 0
    costo_directo = (cant_total_material * 45.0) + (cant_teorica * costo_unitario_mo) # Ejemplo base Q45/unidad mat
    costo_total_renglon = costo_directo * (1 + porcentaje_indirectos)

    # Mostrar Resultados Métricos del Renglón
    m1, m2, m3 = st.columns(3)
    m1.metric("Material Total Requerido", f"{cant_total_material:,.2f}")
    m2.metric("Costo Directo (CD)", f"Q {costo_directo:,.2f}")
    m3.metric("Costo Total Renglón (inc. CI)", f"Q {costo_total_renglon:,.2f}")

    # Guardar en Estado Global para Interconexión con Finanzas y Avances
    st.session_state["presupuesto_activo"] = {
        "tipologia": tipologia,
        "costo_directo_total": costo_directo,
        "costo_total_con_indirectos": costo_total_renglon
    }
```

---

## 5. 📋 CHECKLIST DE FUSIÓN E INTERCONEXIÓN PARA EL AGENTE

- [ ] **No Módulo Aislado:** Verificar que todo el código se haya añadido dentro del flujo de `modulos/presupuestos.py` o módulo equivalente existente.
- [ ] **Interconexión de Variables Globales:** Confirmar que el costo total calculado se escriba en `st.session_state["presupuesto_activo"]` para que los módulos de Avances y Finanzas lean los datos actualizados.
- [ ] **Datos de Topografía:** Comprobar que los cálculos de cortes, rellenos y terraplenes consuman dinámicamente las variables de CivilCAD cuando estén presentes.
- [ ] **Exportación PDF:** Asegurar que la generación de la tarjeta de APU en PDF incluya el encabezado de **CONSTRUCTORA WM/M&S** con el eslogan *"CONSTRUYENDO TU FUTURO"*.
