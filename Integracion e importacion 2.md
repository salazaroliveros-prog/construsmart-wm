import os

code_content = '''"""
Componente del Sidebar con 4 Gráficas Interactivas Avanzadas e Integradas
Sistema ERP SOFTCON-MYS-CONSTRU-WM

Módulos Integrados:
1. Curva S (Programado vs Real vs Proyectado)
2. Diagrama de Gantt Completo (Desglosado por Renglones de Presupuesto)
3. Avance Físico y Financiero (Filtro por Proyecto Específico o General Activos)
4. Presupuestado vs Real Ejecutado (Comparación de Desviaciones de Costos)
"""

import streamlit as st
import plotly.graph_objects as go
import plotly.express as px
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# ==========================================
# 1. GENERACIÓN DE DATOS DE PRUEBA / SIMULACIÓN DE MÓDULOS
# ==========================================

@st.cache_data
def load_simulated_erp_data():
    """Simula los datos provenientes de los módulos de Presupuestos, Proyectos y Avances."""
    
    # Proyectos Activos
    proyectos = [
        {"id": "PRJ-001", "nombre": "Residencial Las Margaritas", "estado": "Activo", "presupuesto_total": 1250000.00},
        {"id": "PRJ-002", "nombre": "Centro Comercial Plaza Norte", "estado": "Activo", "presupuesto_total": 3400000.00},
        {"id": "PRJ-003", "nombre": "Paso a Desnivel Uküm", "estado": "Activo", "presupuesto_total": 2100000.00},
        {"id": "PRJ-004", "nombre": "Bodega Industrial Logix", "estado": "Finalizado", "presupuesto_total": 850000.00},
    ]
    df_proyectos = pd.DataFrame(proyectos)
    
    # Renglones de Presupuesto / Cronograma Gantt para PRJ-001 (Ejemplo Principal)
    base_date = datetime(2026, 1, 15)
    renglones = [
        {"id_renglon": "R-01", "proyecto_id": "PRJ-001", "actividad": "Trabajos Preliminares y Bodega", "inicio": base_date, "fin": base_date + timedelta(days=20), "progreso": 100, "monto": 45000.00, "fase": "Preliminares"},
        {"id_renglon": "R-02", "proyecto_id": "PRJ-001", "actividad": "Movimiento de Tierras y Excavación", "inicio": base_date + timedelta(days=15), "fin": base_date + timedelta(days=45), "progreso": 100, "monto": 120000.00, "fase": "Cimentación"},
        {"id_renglon": "R-03", "proyecto_id": "PRJ-001", "actividad": "Cimentación y Zapatas de Concreto", "inicio": base_date + timedelta(days=40), "fin": base_date + timedelta(days=90), "progreso": 85, "monto": 280000.00, "fase": "Cimentación"},
        {"id_renglon": "R-04", "proyecto_id": "PRJ-001", "actividad": "Estructura Principal (Columnas/Vigas)", "inicio": base_date + timedelta(days=80), "fin": base_date + timedelta(days=150), "progreso": 60, "monto": 350000.00, "fase": "Estructura"},
        {"id_renglon": "R-05", "proyecto_id": "PRJ-001", "actividad": "Levantado de Muros y Tabiques", "inicio": base_date + timedelta(days=130), "fin": base_date + timedelta(days=190), "progreso": 30, "monto": 180000.00, "fase": "Albañilería"},
        {"id_renglon": "R-06", "proyecto_id": "PRJ-001", "actividad": "Instalaciones Hidráulicas y Sanitarias", "inicio": base_date + timedelta(days=160), "fin": base_date + timedelta(days=220), "progreso": 10, "monto": 110000.00, "fase": "Instalaciones"},
        {"id_renglon": "R-07", "proyecto_id": "PRJ-001", "actividad": "Acabados y Pintura General", "inicio": base_date + timedelta(days=200), "fin": base_date + timedelta(days=260), "progreso": 0, "monto": 165000.00, "fase": "Acabados"}
    ]
    df_gantt = pd.DataFrame(renglones)
    
    # Datos para Curva S
    meses = ["Ene 26", "Feb 26", "Mar 26", "Abr 26", "May 26", "Jun 26", "Jul 26", "Ago 26", "Sep 26"]
    prog_acum = [5, 15, 32, 52, 70, 85, 93, 98, 100]
    real_acum = [4, 13, 28, 48, 64, 78, None, None, None]  # Hasta la fecha actual
    proyectado = [None, None, None, None, None, 78, 88, 96, 100]
    
    df_curva_s = pd.DataFrame({
        "Mes": meses,
        "Programado": prog_acum,
        "Real": real_acum,
        "Proyectado": proyectado
    })
    
    # Datos de Avance Físico vs Financiero por Proyecto
    avances_proyectos = [
        {"proyecto_id": "PRJ-001", "nombre": "Residencial Las Margaritas", "avance_fisico": 62.5, "avance_financiero": 58.0, "estado": "Activo"},
        {"proyecto_id": "PRJ-002", "nombre": "Centro Comercial Plaza Norte", "avance_fisico": 41.0, "avance_financiero": 45.2, "estado": "Activo"},
        {"proyecto_id": "PRJ-003", "nombre": "Paso a Desnivel Uküm", "avance_fisico": 88.0, "avance_financiero": 82.5, "estado": "Activo"},
        {"proyecto_id": "PRJ-004", "nombre": "Bodega Industrial Logix", "avance_fisico": 100.0, "avance_financiero": 100.0, "estado": "Finalizado"},
    ]
    df_avances = pd.DataFrame(avances_proyectos)
    
    # Datos Comparativos Presupuestado vs Real Ejecutado (Por Categoría de Costo)
    comparativo_costos = [
        {"categoria": "Materiales Directos", "presupuestado": 520000.00, "real": 548000.00, "proyecto_id": "PRJ-001"},
        {"categoria": "Mano de Obra y Planilla", "presupuestado": 380000.00, "real": 365000.00, "proyecto_id": "PRJ-001"},
        {"categoria": "Maquinaria y Equipo", "presupuestado": 150000.00, "real": 162000.00, "proyecto_id": "PRJ-001"},
        {"categoria": "Subcontratos Especializados", "presupuestado": 120000.00, "real": 115000.00, "proyecto_id": "PRJ-001"},
        {"categoria": "Gastos Indirectos y Campo", "presupuestado": 80000.00, "real": 84500.00, "proyecto_id": "PRJ-001"},
    ]
    df_comparativo = pd.DataFrame(comparativo_costos)
    
    return df_proyectos, df_gantt, df_curva_s, df_avances, df_comparativo


# ==========================================
# 2. CONSTRUCTOR DE GRÁFICAS PARA EL SIDEBAR
# ==========================================

def render_sidebar_charts():
    """Renderiza las 4 gráficas independientes configuradas para la barra lateral."""
    
    df_proyectos, df_gantt, df_curva_s, df_avances, df_comparativo = load_simulated_erp_data()
    
    st.sidebar.markdown("## 📊 Dashboard de Métricas Directivas")
    st.sidebar.markdown("---")
    
    # FILTRO GLOBAL DE PROYECTOS PARA EL SIDEBAR
    opciones_proyectos = ["TODOS LOS PROYECTOS ACTIVOS"] + list(df_proyectos[df_proyectos["estado"] == "Activo"]["nombre"])
    proyecto_seleccionado = st.sidebar.selectbox(
        "🔍 Seleccionar Proyecto:",
        options=opciones_proyectos,
        help="Filtra las visualizaciones del sidebar según el proyecto elegido."
    )
    
    st.sidebar.markdown("---")
    
    # ---------------------------------------------------------
    # GRÁFICA 1: CURVA S (ACUMULADO PROGRAMADO VS REAL)
    # ---------------------------------------------------------
    with st.sidebar.expander("📈 1. Curva S (Avance Físico Acumulado)", expanded=True):
        fig_curva_s = go.Figure()
        
        # Línea Programada
        fig_curva_s.add_trace(go.Scatter(
            x=df_curva_s["Mes"], y=df_curva_s["Programado"],
            mode='lines+markers', name='Programado',
            line=dict(color='#1E3A8A', width=2, dash='dash'),
            marker=dict(size=5)
        ))
        
        # Línea Real
        fig_curva_s.add_trace(go.Scatter(
            x=df_curva_s["Mes"], y=df_curva_s["Real"],
            mode='lines+markers', name='Ejecutado Real',
            line=dict(color='#10B981', width=3),
            marker=dict(size=6)
        ))
        
        # Proyección
        fig_curva_s.add_trace(go.Scatter(
            x=df_curva_s["Mes"], y=df_curva_s["Proyectado"],
            mode='lines', name='Proyección',
            line=dict(color='#F59E0B', width=2, dash='dot')
        ))
        
        fig_curva_s.update_layout(
            height=280,
            margin=dict(l=10, r=10, t=30, b=20),
            paper_bgcolor='rgba(0,0,0,0)',
            plot_bgcolor='rgba(0,0,0,0)',
            legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1, font=dict(size=9)),
            xaxis=dict(showgrid=True, gridcolor='#e2e8f0', tickfont=dict(size=9)),
            yaxis=dict(title="% Avance", range=[0, 105], showgrid=True, gridcolor='#e2e8f0', tickfont=dict(size=9))
        )
        st.plotly_chart(fig_curva_s, use_container_width=True)
        st.caption(" Muestra la desviación entre la planificación original y la ejecución real.")

    # ---------------------------------------------------------
    # GRÁFICA 2: DIAGRAMA DE GANTT INTEGRADO POR RENGLONES
    # ---------------------------------------------------------
    with st.sidebar.expander("📅 2. Cronograma Gantt por Renglones", expanded=False):
        # Adaptar fechas para Plotly Gantt
        df_gantt_plot = df_gantt.copy()
        df_gantt_plot["Start_Str"] = df_gantt_plot["inicio"].dt.strftime('%Y-%m-%d')
        df_gantt_plot["End_Str"] = df_gantt_plot["fin"].dt.strftime('%Y-%m-%d')
        
        fig_gantt = px.timeline(
            df_gantt_plot,
            x_start="inicio",
            x_end="fin",
            y="actividad",
            color="progreso",
            color_continuous_scale="Blues",
            title=None
        )
        
        fig_gantt.update_yaxes(autorange="reversed", tickfont=dict(size=8))
        fig_gantt.update_xaxes(tickfont=dict(size=8))
        fig_gantt.update_layout(
            height=320,
            margin=dict(l=5, r=5, t=10, b=10),
            paper_bgcolor='rgba(0,0,0,0)',
            plot_bgcolor='rgba(0,0,0,0)',
            coloraxis_showscale=False
        )
        st.plotly_chart(fig_gantt, use_container_width=True)
        st.caption(" Programación vinculada con la estructura del presupuesto de obra.")

    # ---------------------------------------------------------
    # GRÁFICA 3: AVANCE FÍSICO VS FINANCIERO (BARRAS HORIZONTALES)
    # ---------------------------------------------------------
    with st.sidebar.expander("📊 3. Avance Físico vs Financiero", expanded=True):
        if proyecto_seleccionado == "TODOS LOS PROYECTOS ACTIVOS":
            df_filtrado_avance = df_avances[df_avances["estado"] == "Activo"]
            titulo_grafica = "Promedio General Proyectos Activos"
        else:
            df_filtrado_avance = df_avances[df_avances["nombre"] == proyecto_seleccionado]
            titulo_grafica = f"Avance: {proyecto_seleccionado}"
            
        # Transformación para formato de barras agrupadas
        df_melted = pd.melt(
            df_filtrado_avance,
            id_vars=["nombre"],
            value_vars=["avance_fisico", "avance_financiero"],
            var_name="Tipo_Avance",
            value_name="Porcentaje"
        )
        df_melted["Tipo_Avance"] = df_melted["Tipo_Avance"].map({
            "avance_fisico": "Físico (%)",
            "avance_financiero": "Financiero (%)"
        })
        
        fig_avance = px.bar(
            df_melted,
            y="nombre" if proyecto_seleccionado == "TODOS LOS PROYECTOS ACTIVOS" else "Tipo_Avance",
            x="Porcentaje",
            color="Tipo_Avance" if proyecto_seleccionado == "TODOS LOS PROYECTOS ACTIVOS" else "Tipo_Avance",
            barmode="group",
            orientation="h",
            color_discrete_map={"Físico (%)": "#0284C7", "Financiero (%)": "#16A34A"},
            text_auto='.1f'
        )
        
        fig_avance.update_layout(
            height=260,
            margin=dict(l=10, r=10, t=20, b=10),
            paper_bgcolor='rgba(0,0,0,0)',
            plot_bgcolor='rgba(0,0,0,0)',
            legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1, font=dict(size=8)),
            xaxis=dict(range=[0, 105], tickfont=dict(size=8)),
            yaxis=dict(tickfont=dict(size=8), title=None)
        )
        st.plotly_chart(fig_avance, use_container_width=True)
        st.caption(f"📌 {titulo_grafica}")

    # ---------------------------------------------------------
    # GRÁFICA 4: PRESUPUESTADO VS REAL EJECUTADO
    # ---------------------------------------------------------
    with st.sidebar.expander("💰 4. Presupuestado vs. Real Ejecutado", expanded=True):
        fig_costos = go.Figure()
        
        fig_costos.add_trace(go.Bar(
            y=df_comparativo["categoria"],
            x=df_comparativo["presupuestado"],
            name='Presupuestado',
            orientation='h',
            marker=dict(color='#64748B')
        ))
        
        fig_costos.add_trace(go.Bar(
            y=df_comparativo["categoria"],
            x=df_comparativo["real"],
            name='Ejecutado Real',
            orientation='h',
            marker=dict(color='#DC2626')
        ))
        
        fig_costos.update_layout(
            barmode='group',
            height=300,
            margin=dict(l=5, r=5, t=20, b=10),
            paper_bgcolor='rgba(0,0,0,0)',
            plot_bgcolor='rgba(0,0,0,0)',
            legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1, font=dict(size=8)),
            xaxis=dict(tickfont=dict(size=8), title="Monto (Q)"),
            yaxis=dict(tickfont=dict(size=8), title=None)
        )
        st.plotly_chart(fig_costos, use_container_width=True)
        st.caption(" Control de varianza presupuestaria por rubro de gasto.")

# ==========================================
# 3. PRUEBA PRINCIPAL DEL COMPONENTE
# ==========================================
if __name__ == "__main__":
    st.set_page_config(page_title="SOFTCON ERP - Sidebar Analytics", layout="wide")
    
    # Cargar sidebar
    render_sidebar_charts()
    
    # Área principal
    st.title("🏗️ SOFTCON-MYS-CONSTRU-WM ERP")
    st.subheader("Módulo de Control Integrado de Obras y Finanzas")
    st.success("✅ Las 4 gráficas independientes del Sidebar han sido cargadas exitosamente.")
    st.info("Utilice los filtros en el panel izquierdo (Sidebar) para interactuar con las visualizaciones completas.")
'''

os.makedirs("output_component", exist_ok=True)
file_path = "output_component/sidebar_analytics_module.py"
with open(file_path, "w", encoding="utf-8") as f:
    f.write(code_content)

print(f"Archivo generado exitosamente en: {file_path}")