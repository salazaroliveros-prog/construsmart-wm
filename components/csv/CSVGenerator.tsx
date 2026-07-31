/**
 * CONSTRUCTORA WM/M&S - CSV GENERATOR
 * Slogan: "CONSTRUYENDO EL FUTURO"
 * 
 * CSV Export with budget summary and material breakdown
 * Professional budget reports in CSV format
 */

'use client';

import { FileSpreadsheet } from 'lucide-react';
import { useBusinessSettings, formatCurrency, formatDate } from '@/lib/hooks/useBusinessSettings';

interface BudgetItem {
  code: string;
  description: string;
  unit: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  timeRequired?: number;
  materialBreakdown?: MaterialBreakdownItem[];
}

interface MaterialBreakdownItem {
  code: string;
  description: string;
  unit: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

interface BudgetSummary {
  directCost: number;
  indirectCost: number;
  contingency: number;
  profit: number;
  total: number;
}

interface CSVGeneratorProps {
  projectName: string;
  clientName: string;
  items: BudgetItem[];
  summary: BudgetSummary;
  indirectPercentage: number;
  contingencyPercentage: number;
  profitPercentage: number;
  totalProjectTime?: number;
}

export default function CSVGenerator({
  projectName,
  clientName,
  items,
  summary,
  indirectPercentage,
  contingencyPercentage,
  profitPercentage,
  totalProjectTime,
}: CSVGeneratorProps) {
  const { settings } = useBusinessSettings();

  const generateCSV = () => {
    const companyName = settings.company.name;
    const companyShortName = settings.company.shortName;
    const delimiter = settings.export.csvDelimiter;
    const includeHeaders = settings.export.csvIncludeHeaders;
    const dateFormat = settings.export.dateFormat;
    const currencySymbol = settings.financial.currencySymbol;

    // CSV Header
    let csvContent = `${companyName} - "CONSTRUYENDO EL FUTURO"\n`;
    csvContent += `Presupuesto de Obra - ${projectName}\n`;
    csvContent += `Cliente: ${clientName}\n`;
    csvContent += `Fecha: ${formatDate(new Date(), settings.export)}\n\n`;

    // ========================================
    // HOJA 1: RESUMEN DE RENGLONES
    // ========================================
    csvContent += 'RESUMEN DE RENGLONES\n';
    if (includeHeaders) {
      csvContent += `Código${delimiter}Descripción${delimiter}Unidad${delimiter}Cantidad${delimiter}Precio Unitario${delimiter}Total${delimiter}Tiempo (días)\n`;
    }

    let totalTime = 0;
    items.forEach(item => {
      const timeText = item.timeRequired ? item.timeRequired.toFixed(2) : '0';
      totalTime += item.timeRequired || 0;
      
      csvContent += `"${item.code}"${delimiter}"${item.description}"${delimiter}"${item.unit}"${delimiter}${item.quantity}${delimiter}${item.unitCost}${delimiter}${item.totalCost}${delimiter}${timeText}\n`;
    });

    // Resumen de costos
    csvContent += '\nRESUMEN DEL PRESUPUESTO\n';
    if (includeHeaders) {
      csvContent += `Concepto${delimiter}Monto\n`;
    }
    csvContent += `Costo Directo${delimiter}${summary.directCost}\n`;
    csvContent += `Indirectos (${indirectPercentage}%)${delimiter}${summary.indirectCost}\n`;
    csvContent += `Contingencia (${contingencyPercentage}%)${delimiter}${summary.contingency}\n`;
    csvContent += `Utilidad (${profitPercentage}%)${delimiter}${summary.profit}\n`;
    csvContent += `TOTAL DEL PRESUPUESTO${delimiter}${summary.total}\n`;

    // Tiempo total
    const totalTimeText = totalProjectTime ? totalProjectTime.toFixed(1) : totalTime.toFixed(1);
    csvContent += `TIEMPO TOTAL DE CONSTRUCCIÓN${delimiter}${totalTimeText} días\n\n`;

    // ========================================
    // HOJA 2: DESGLOSE UNITARIO DE MATERIALES
    // ========================================
    csvContent += 'EXPLOSIÓN DE MATERIALES - DESGLOSE UNITARIO\n';
    if (includeHeaders) {
      csvContent += `Renglón${delimiter}Descripción Renglón${delimiter}Código Material${delimiter}Material${delimiter}Cantidad${delimiter}Unidad${delimiter}Precio Unitario${delimiter}Total\n`;
    }

    // Agrupar materiales para resumen
    const materialSummary = new Map<string, { quantity: number; totalCost: number; unit: string; description: string }>();

    items.forEach(item => {
      if (item.materialBreakdown && item.materialBreakdown.length > 0) {
        item.materialBreakdown.forEach(material => {
          csvContent += `"${item.code}","${item.description}","${material.code}","${material.description}",${material.quantity.toFixed(3)},"${material.unit}",${material.unitCost},${material.totalCost}\n`;

          // Agrupar para resumen
          const key = `${material.code}-${material.unit}`;
          if (materialSummary.has(key)) {
            const existing = materialSummary.get(key)!;
            existing.quantity += material.quantity;
            existing.totalCost += material.totalCost;
          } else {
            materialSummary.set(key, {
              quantity: material.quantity,
              totalCost: material.totalCost,
              unit: material.unit,
              description: material.description
            });
          }
        });
      }
    });

    // ========================================
    // HOJA 3: RESUMEN AGRUPADO POR TIPO DE MATERIAL
    // ========================================
    csvContent += '\nRESUMEN AGRUPADO POR TIPO DE MATERIAL\n';
    csvContent += 'Código,Descripción del Material,Cantidad Total,Unidad,Costo Total\n';

    let grandTotal = 0;
    Array.from(materialSummary.entries()).forEach(([key, data]) => {
      const [code] = key.split('-');
      csvContent += `"${code}","${data.description}",${data.quantity.toFixed(3)},"${data.unit}",${data.totalCost}\n`;
      grandTotal += data.totalCost;
    });

    csvContent += `TOTAL GENERAL DE MATERIALES,,${grandTotal}\n`;

    // Crear blob y descargar
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `presupuesto_completo_${projectName.replace(/\s+/g, '_')}_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      onClick={generateCSV}
      className="glass-button px-4 py-2 rounded-lg text-sm text-cyan-300 hover:text-cyan-200 flex items-center space-x-2"
    >
      <FileSpreadsheet className="w-4 h-4" />
      <span>Exportar CSV</span>
    </button>
  );
}
