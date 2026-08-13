// Sistema de Export de Datos Unificado
// Basado en estándares de exportación comunes

export const exportFormats = {
  // CSV
  csv: {
    mimeType: 'text/csv',
    extension: '.csv',
    icon: '📊',
  },
  
  // Excel
  xlsx: {
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    extension: '.xlsx',
    icon: '📈',
  },
  
  // PDF
  pdf: {
    mimeType: 'application/pdf',
    extension: '.pdf',
    icon: '📄',
  },
  
  // JSON
  json: {
    mimeType: 'application/json',
    extension: '.json',
    icon: '📋',
  },
  
  // XML
  xml: {
    mimeType: 'application/xml',
    extension: '.xml',
    icon: '📄',
  },
};

export const exportOptions = {
  // Opciones de exportación
  includeHeaders: {
    label: 'Incluir encabezados',
    default: true,
  },
  
  // Opciones de formato
  formatDate: {
    label: 'Formato de fecha',
    default: 'DD/MM/YYYY',
  },
  
  // Opciones de selección
  selectedOnly: {
    label: 'Solo seleccionados',
    default: false,
  },
  
  // Opciones de compresión
  compress: {
    label: 'Comprimir archivo',
    default: false,
  },
};

// Clases para botones de exportación
export const exportClasses = {
  // Botón de exportación estándar
  button: 'flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white border border-white/20 rounded-lg text-sm font-medium transition-all min-h-[44px]',
  
  // Dropdown de exportación
  dropdown: 'flex flex-col gap-1 p-2 bg-slate-900/95 backdrop-blur-md border border-white/20 rounded-lg shadow-xl',
  
  // Item de exportación
  item: 'flex items-center gap-2 px-3 py-2 hover:bg-white/10 text-white/80 hover:text-white rounded-lg text-sm transition-all min-h-[36px]',
  
  // Icono de formato
  icon: 'text-lg',
  
  // Loading state
  loading: 'opacity-50 cursor-wait',
};

// Función para exportar datos a CSV
export function exportToCSV(data: any[], filename: string = 'export') {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => row[header]).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: exportFormats.csv.mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}${exportFormats.csv.extension}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Función para exportar datos a JSON
export function exportToJSON(data: any[], filename: string = 'export') {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: exportFormats.json.mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}${exportFormats.json.extension}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Función para exportar datos a PDF (requiere librería externa)
export function exportToPDF(data: any[], filename: string = 'export') {
  // Nota: Esta función requiere una librería como jsPDF o react-pdf
  console.log('PDF export requires external library like jsPDF');
  // Placeholder para implementación futura
}

// Función genérica de exportación
export function exportData(data: any[], format: keyof typeof exportFormats, filename: string = 'export') {
  switch (format) {
    case 'csv':
      exportToCSV(data, filename);
      break;
    case 'json':
      exportToJSON(data, filename);
      break;
    case 'pdf':
      exportToPDF(data, filename);
      break;
    default:
      console.warn(`Unsupported export format: ${format}`);
  }
}