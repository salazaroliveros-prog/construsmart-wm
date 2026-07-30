# 📱 GUÍA Y ESPECIFICACIÓN TÉCNICA DE OPTIMIZACIÓN MÓVIL Y RESPONSIVA
**Sistema ERP:** SOFTCON-MYS-CONSTRU-WM  
**Eslogan:** "CONSTRUYENDO TU FUTURO"  
**Objetivo:** Instrucciones precisas y arquitectónicas para agentes de IA y desarrolladores full-stack en la adaptación, diseño responsivo y optimización de rendimiento para dispositivos móviles (Smartphones y Tablets).

---

## 1. 🎯 REQUERIMIENTOS ARQUITECTÓNICOS GLOBALES

1. **Estrategia Mobile-First:** La interfaz debe adaptarse dinámicamente según el tamaño de la pantalla (*Viewport*), reconfigurando el layout sin perder la integración con los módulos de presupuestos, estimaciones de avance, Topografía/CivilCAD y reportería PDF.
2. **Navegación Táctil (Touch-Friendly):** Todos los componentes interactivos (botones, selectores, pestañas) deben cumplir con un área de toque (*touch target*) mínima de **44px x 44px**.
3. **Gestión de la Barra Lateral (Sidebar):**
   - En pantallas anchas (Desktop / Tablet horizontal): Permanecer expandido o colapsable opcionalmente.
   - En pantallas móviles (Smartphones < 768px): La barra lateral debe colapsarse automáticamente por defecto (`initial_sidebar_state="collapsed"`).
   - Las 4 gráficas interactivas del sidebar deben apilarse verticalmente en contenedores desplegables (`st.expander`) independientes y auto-ajustables.

---

## 2. 🎨 CONFIGURACIÓN Y CSS INYECTADO PARA STREAMLIT MÓVIL

Inyectar la siguiente hoja de estilos personalizada utilizando `st.markdown(..., unsafe_allow_html=True)` al inicio de la aplicación para adaptar contenedores, tablas y gráficos a pantallas reducidas:

```python
import streamlit as st

def aplicar_estilos_responsivos_movil():
    st.markdown('''<style>
        /* 1. Ajustes del Contenedor Principal en Móviles */
        @media (max-width: 768px) {
            .main .block-container {
                padding-left: 0.8rem !important;
                padding-right: 0.8rem !important;
                padding-top: 1rem !important;
                padding-bottom: 2rem !important;
            }
            
            /* Ajuste de tipografía general para legibilidad en smartphones */
            h1 { font-size: 1.6rem !important; }
            h2 { font-size: 1.3rem !important; }
            h3 { font-size: 1.1rem !important; }
            p, li, label { font-size: 0.9rem !important; }
            
            /* Adaptación de Botones y Entradas para Toque Táctil */
            .stButton>button {
                width: 100% !important;
                min-height: 48px !important;
                font-size: 1rem !important;
                border-radius: 8px !important;
                margin-bottom: 8px !important;
            }
            
            .stSelectbox, .stTextInput, .stNumberInput {
                margin-bottom: 12px !important;
            }
        }

        /* 2. Scroll Horizontal para Tablas de Presupuestos y Renglones */
        .stDataFrame, div[data-testid="stTable"] {
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch;
        }

        /* 3. Ajuste de Tarjetas de Métricas (KPIs) en Móvil */
        [data-testid="stMetricValue"] {
            font-size: 1.4rem !important;
        }
        [data-testid="stMetricLabel"] {
            font-size: 0.85rem !important;
        }
        
        /* 4. Ocultar elementos decorativos no esenciales en móviles */
        @media (max-width: 480px) {
            .hide-on-mobile {
                display: none !important;
            }
        }
    </style>''', unsafe_allow_html=True)
```

---

## 3. 📊 OPTIMIZACIÓN RESPONSIVA DE LAS 4 GRÁFICAS DEL SIDEBAR

Para evitar que las gráficas de Plotly queden recortadas o distorsionadas en dispositivos móviles, el agente debe aplicar las siguientes reglas exactas en la configuración de `update_layout`:

### Reglas de Diseño de Gráficos Responsivos:
1. Usar `use_container_width=True` en **TODAS** las llamadas a `st.plotly_chart(fig, use_container_width=True)`.
2. Habilitar la propiedad `config={'responsive': True, 'displayModeBar': False}` en Plotly para deshabilitar barras de herramientas pesadas en móviles.
3. Configurar márgenes compactos: `margin=dict(l=10, r=10, t=25, b=25)`.
4. Leyendas ubicadas horizontalmente arriba o abajo del gráfico (`orientation="h"`).

### Ejemplo de Configuración Estándar para Agentes de Código:

```python
import plotly.graph_objects as go
import streamlit as st

def crear_grafico_responsivo_sidebar(fig, altura_movil=260):
    fig.update_layout(
        autosize=True,
        height=altura_movil,
        margin=dict(l=8, r=8, t=20, b=20),
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=1.02,
            xanchor="center",
            x=0.5,
            font=dict(size=8)
        ),
        xaxis=dict(tickfont=dict(size=8)),
        yaxis=dict(tickfont=dict(size=8))
    )
    st.plotly_chart(fig, use_container_width=True, config={'responsive': True, 'displayModeBar': False})
```

---

## 4. 🔀 INSTRUCCIONES PARA REESTRUCTURACIÓN DE LAYOUT (COLUMNAS A FILAS)

Streamlit automáticamente apila las columnas en dispositivos móviles, pero para garantizar que la experiencia del usuario no sea confusa, el agente debe seguir este patrón:

### Patrón Recomendado:
```python
# ❌ EVITAR: Diseños horizontales con demasiadas columnas pequeñas
# col1, col2, col3, col4, col5 = st.columns(5)

# ✅ RECOMENDADO: Agrupación responsiva adaptable
st.markdown("### 📊 Indicadores Clave del Proyecto")
kpi_col1, kpi_col2 = st.columns(2)

with kpi_col1:
    st.metric(label="Presupuesto Ejecutado", value="Q 450,000.00", delta="+3.2%")
with kpi_col2:
    st.metric(label="Avance Físico Global", value="68.5%", delta="1.5%")
```

---

## 5. 📋 CHECKLIST DE VALIDACIÓN PARA EL AGENTE DE CÓDIGO

Al implementar o modificar cualquier módulo de la aplicación, el agente debe verificar los siguientes puntos:

- [ ] **Viewport inicial:** `st.set_page_config(layout="wide", initial_sidebar_state="collapsed")` para abrir la vista limpia en teléfonos.
- [ ] **Tablas de Datos:** ¿Las tablas de presupuestos y renglones tienen desplazamiento horizontal en móviles sin romper el layout?
- [ ] **Uso de Formularios:** Modales y entradas numéricas en cálculos topográficos/presupuestos optimizados con pasos claros para teclados numéricos virtuales (`step=1.0` o `step=0.01`).
- [ ] **Exportación PDF/Excel:** Los botones de descarga de reportes PDF deben estar fijados al final o en la parte superior con ancho completo (`use_container_width=True`).
- [ ] **Rendimiento:** Cargar conjuntos de datos grandes mediante `@st.cache_data` para evitar recargas lentas en redes móviles 4G/5G.

---
**SOFTCON-MYS-CONSTRU-WM** — *Construyendo tu Futuro*
