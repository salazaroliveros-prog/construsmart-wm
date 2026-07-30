Integración e Importación en tu Aplicación Principal
Para unificar este sidebar dentro de tus módulos creados previamente, simplemente importa la función en tu archivo principal (app.py o similar):

Python
import streamlit as st
from sidebar_analytics_module import render_sidebar_charts

# Configuración básica
st.set_page_config(page_title="SOFTCON ERP", layout="wide")

# Renderizar las 4 gráficas en el Sidebar
render_sidebar_charts()

# Tu contenido principal del Dashboard aquí...