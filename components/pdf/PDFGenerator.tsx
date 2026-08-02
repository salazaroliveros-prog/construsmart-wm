/**
 * CONSTRUCTORA WM/M&S - PDF GENERATOR
 * Slogan: "CONSTRUYENDO EL FUTURO"
 * 
 * PDF Export with Multi Servicios Letterhead
 * Professional budget reports with corporate branding
 */

'use client';

import { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { Download } from 'lucide-react';
import { useBusinessSettings, formatCurrency } from '@/lib/hooks/useBusinessSettings';

interface BudgetItem {
  code: string;
  description: string;
  unit: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  timeRequired?: number; // Días requeridos para este renglón
  materialBreakdown?: MaterialBreakdownItem[]; // Desglose de materiales
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

interface PDFGeneratorProps {
  projectName: string;
  clientName: string;
  items: BudgetItem[];
  summary: BudgetSummary;
  indirectPercentage: number;
  contingencyPercentage: number;
  profitPercentage: number;
  totalProjectTime?: number; // Tiempo total del proyecto en días
}

export default function PDFGenerator({
  projectName,
  clientName,
  items,
  summary,
  indirectPercentage,
  contingencyPercentage,
  profitPercentage,
  totalProjectTime,
}: PDFGeneratorProps) {
  const { settings } = useBusinessSettings();

  const generatePDF = async () => {
    const doc = new jsPDF();
    
    // Get company settings
    const companyName = settings.company.name;
    const companyShortName = settings.company.shortName;
    const companyNIT = settings.company.nit;
    const companyAddress = settings.company.address;
    const companyPhone = settings.company.phone;
    const companyEmail = settings.company.email;
    const companyLogo = settings.company.logoUrl;
    
    // Get export settings
    const includeLogo = settings.export.pdfIncludeLogo;
    const includeSignature = settings.export.pdfIncludeSignature;
    const includeDetailedBreakdown = settings.export.pdfIncludeDetailedBreakdown;
    
    // Page dimensions
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Colors
    const primaryColor = 6; // Cyan RGB (simplified)
    const primaryGreen = 182;
    const primaryBlue = 212;
    const secondaryColor = 139; // Violet RGB (simplified)
    const secondaryGreen = 92;
    const secondaryBlue = 246;
    const textColorRed = 30; // Dark slate
    const textColorGreen = 41;
    const textColorBlue = 59;
    
    // Helper function to add letterhead
    const addLetterhead = async () => {
      try {
        // Try to use custom logo first if enabled
        if (includeLogo && companyLogo) {
          doc.addImage(companyLogo, 'JPEG', 15, 10, 40, 25);
        } else {
          // Fallback to default letterhead
          const letterheadResponse = await fetch('/assets/branding/letterhead-multiservicios.jpg');
          const letterheadBlob = await letterheadResponse.blob();
          const letterheadDataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(letterheadBlob);
          });
          doc.addImage(letterheadDataUrl, 'JPEG', 15, 10, 40, 25);
        }
      } catch (error) {
        console.error('Failed to load letterhead image:', error);
        // Fallback to text-based header
        doc.setFillColor(primaryColor, primaryGreen, primaryBlue);
        doc.rect(0, 0, pageWidth, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(companyName, 15, 20);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.text('"CONSTRUYENDO EL FUTURO"', 15, 28);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('Guatemala, C.A. | Tel: (+502) 5555-0000 | Email: contacto@constructorawm.com', 15, 35);
      }
      
      doc.setTextColor(textColorRed, textColorGreen, textColorBlue);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('CONSTRUCTORA WM/M&S', pageWidth - 65, 15);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.text('"CONSTRUYENDO EL FUTURO"', pageWidth - 65, 22);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text('Guatemala, C.A. | Tel: (+502) 5555-0000', pageWidth - 65, 28);
      doc.text('Email: contacto@constructorawm.com', pageWidth - 65, 33);
      
      doc.setDrawColor(primaryColor, primaryGreen, primaryBlue);
      doc.setLineWidth(0.5);
      doc.line(15, 40, pageWidth - 15, 40);
    };
    
    // ========================================
    // HOJA 1: RESUMEN DE RENGLONES
    // ========================================
    addLetterhead();
    
    doc.setTextColor(textColorRed, textColorGreen, textColorBlue);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('PRESUPUESTO DE OBRA - RESUMEN DE RENGLONES', pageWidth / 2, 55, { align: 'center' });
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const infoY = 70;
    doc.text(`Proyecto: ${projectName}`, 15, infoY);
    doc.text(`Cliente: ${clientName}`, 15, infoY + 8);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-GT')}`, 15, infoY + 16);
    
    // Tabla de renglones con tiempo
    const tableStartY = 95;
    const rowHeight = 8;
    
    doc.setFillColor(primaryColor, primaryGreen, primaryBlue);
    doc.rect(15, tableStartY, pageWidth - 30, rowHeight, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    
    const colWidths = {
      code: 20,
      description: 65,
      unit: 12,
      quantity: 15,
      unitCost: 20,
      total: 25,
      time: 20,
    };
    
    let currentX = 15;
    doc.text('Código', currentX, tableStartY + 5);
    currentX += colWidths.code;
    doc.text('Descripción', currentX, tableStartY + 5);
    currentX += colWidths.description;
    doc.text('Unidad', currentX, tableStartY + 5);
    currentX += colWidths.unit;
    doc.text('Cant.', currentX, tableStartY + 5);
    currentX += colWidths.quantity;
    doc.text('P. Unit.', currentX, tableStartY + 5);
    currentX += colWidths.unitCost;
    doc.text('Total', currentX, tableStartY + 5);
    currentX += colWidths.total;
    doc.text('Tiempo', currentX, tableStartY + 5);
    
    doc.setTextColor(textColorRed, textColorGreen, textColorBlue);
    doc.setFont('helvetica', 'normal');
    
    let currentY = tableStartY + rowHeight;
    let totalCost = 0;
    let totalTime = 0;
    
    items.forEach((item, index) => {
      if (currentY > pageHeight - 60) {
        doc.addPage();
        addLetterhead();
        currentY = 55;
        
        doc.setFillColor(primaryColor, primaryGreen, primaryBlue);
        doc.rect(15, currentY, pageWidth - 30, rowHeight, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        
        currentX = 15;
        doc.text('Código', currentX, currentY + 5);
        currentX += colWidths.code;
        doc.text('Descripción', currentX, currentY + 5);
        currentX += colWidths.description;
        doc.text('Unidad', currentX, currentY + 5);
        currentX += colWidths.unit;
        doc.text('Cant.', currentX, currentY + 5);
        currentX += colWidths.quantity;
        doc.text('P. Unit.', currentX, currentY + 5);
        currentX += colWidths.unitCost;
        doc.text('Total', currentX, currentY + 5);
        currentX += colWidths.total;
        doc.text('Tiempo', currentX, currentY + 5);
        
        currentY += rowHeight;
        doc.setTextColor(textColorRed, textColorGreen, textColorBlue);
        doc.setFont('helvetica', 'normal');
      }
      
      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(15, currentY, pageWidth - 30, rowHeight, 'F');
      }
      
      currentX = 15;
      doc.text(item.code, currentX, currentY + 5);
      currentX += colWidths.code;
      
      let description = item.description;
      if (item.description.length > 25) {
        description = item.description.substring(0, 25) + '...';
      }
      doc.text(description, currentX, currentY + 5);
      currentX += colWidths.description;
      
      doc.text(item.unit, currentX, currentY + 5);
      currentX += colWidths.unit;
      doc.text(item.quantity.toString(), currentX, currentY + 5);
      currentX += colWidths.quantity;
      doc.text(formatCurrency(item.unitCost), currentX, currentY + 5);
      currentX += colWidths.unitCost;
      doc.text(formatCurrency(item.totalCost), currentX, currentY + 5);
      currentX += colWidths.total;
      
      const timeText = item.timeRequired ? `${item.timeRequired.toFixed(1)}d` : '-';
      doc.text(timeText, currentX, currentY + 5);
      
      totalCost += item.totalCost;
      totalTime += item.timeRequired || 0;
      
      currentY += rowHeight;
    });
    
    // Resumen de costos y tiempo
    currentY += 10;
    
    doc.setFillColor(secondaryColor, secondaryGreen, secondaryBlue);
    doc.rect(15, currentY, pageWidth - 30, rowHeight, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMEN DEL PRESUPUESTO', pageWidth / 2, currentY + 5, { align: 'center' });
    
    currentY += rowHeight + 5;
    
    doc.setTextColor(textColorRed, textColorGreen, textColorBlue);
    doc.setFont('helvetica', 'normal');
    
    const summaryItems = [
      { label: 'Costo Directo', value: summary.directCost },
      { label: `Indirectos (${indirectPercentage}%)`, value: summary.indirectCost },
      { label: `Contingencia (${contingencyPercentage}%)`, value: summary.contingency },
      { label: `Utilidad (${profitPercentage}%)`, value: summary.profit },
    ];
    
    summaryItems.forEach((item) => {
      doc.text(item.label, 15, currentY);
      doc.text(formatCurrency(item.value), pageWidth - 45, currentY);
      currentY += 7;
    });
    
    // Total
    currentY += 3;
    doc.setFillColor(primaryColor, primaryGreen, primaryBlue);
    doc.rect(15, currentY, pageWidth - 30, rowHeight, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('TOTAL DEL PRESUPUESTO', 15, currentY + 6);
    doc.text(formatCurrency(summary.total), pageWidth - 45, currentY + 6);
    
    // Tiempo total
    currentY += rowHeight + 5;
    doc.setFillColor(secondaryColor, secondaryGreen, secondaryBlue);
    doc.rect(15, currentY, pageWidth - 30, rowHeight, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('TIEMPO TOTAL DE CONSTRUCCIÓN', 15, currentY + 6);
    const totalTimeText = totalProjectTime ? `${totalProjectTime.toFixed(1)} días` : `${totalTime.toFixed(1)} días`;
    doc.text(totalTimeText, pageWidth - 45, currentY + 6);
    
    // ========================================
    // HOJA 2: DESGLOSE UNITARIO DE MATERIALES
    // ========================================
    doc.addPage();
    addLetterhead();
    
    doc.setTextColor(textColorRed, textColorGreen, textColorBlue);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('EXPLOSIÓN DE MATERIALES - DESGLOSE UNITARIO', pageWidth / 2, 55, { align: 'center' });
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Proyecto: ${projectName}`, 15, 70);
    doc.text(`Cliente: ${clientName}`, 15, 78);
    
    // Tabla de desglose de materiales
    const materialTableStartY = 90;
    
    doc.setFillColor(primaryColor, primaryGreen, primaryBlue);
    doc.rect(15, materialTableStartY, pageWidth - 30, rowHeight, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    
    const materialColWidths = {
      renglonCode: 18,
      renglonDesc: 35,
      materialCode: 18,
      materialDesc: 40,
      quantity: 18,
      unit: 12,
      unitCost: 18,
      total: 20,
    };
    
    currentX = 15;
    doc.text('Renglón', currentX, materialTableStartY + 5);
    currentX += materialColWidths.renglonCode;
    doc.text('Descripción Renglón', currentX, materialTableStartY + 5);
    currentX += materialColWidths.renglonDesc;
    doc.text('Mat. Code', currentX, materialTableStartY + 5);
    currentX += materialColWidths.materialCode;
    doc.text('Material', currentX, materialTableStartY + 5);
    currentX += materialColWidths.materialDesc;
    doc.text('Cantidad', currentX, materialTableStartY + 5);
    currentX += materialColWidths.quantity;
    doc.text('Unidad', currentX, materialTableStartY + 5);
    currentX += materialColWidths.unit;
    doc.text('P. Unit.', currentX, materialTableStartY + 5);
    currentX += materialColWidths.unitCost;
    doc.text('Total', currentX, materialTableStartY + 5);
    
    doc.setTextColor(textColorRed, textColorGreen, textColorBlue);
    doc.setFont('helvetica', 'normal');
    
    let materialY = materialTableStartY + rowHeight;
    
    // Agrupar materiales por tipo para resumen
    const materialSummary = new Map<string, { quantity: number; totalCost: number; unit: string }>();
    
    items.forEach((item, itemIndex) => {
      if (item.materialBreakdown && item.materialBreakdown.length > 0) {
        item.materialBreakdown.forEach((material, matIndex) => {
          if (materialY > pageHeight - 30) {
            doc.addPage();
            addLetterhead();
            materialY = 55;
            
            doc.setFillColor(primaryColor, primaryGreen, primaryBlue);
            doc.rect(15, materialY, pageWidth - 30, rowHeight, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            
            currentX = 15;
            doc.text('Renglón', currentX, materialY + 5);
            currentX += materialColWidths.renglonCode;
            doc.text('Descripción Renglón', currentX, materialY + 5);
            currentX += materialColWidths.renglonDesc;
            doc.text('Mat. Code', currentX, materialY + 5);
            currentX += materialColWidths.materialCode;
            doc.text('Material', currentX, materialY + 5);
            currentX += materialColWidths.materialDesc;
            doc.text('Cantidad', currentX, materialY + 5);
            currentX += materialColWidths.quantity;
            doc.text('Unidad', currentX, materialY + 5);
            currentX += materialColWidths.unit;
            doc.text('P. Unit.', currentX, materialY + 5);
            currentX += materialColWidths.unitCost;
            doc.text('Total', currentX, materialY + 5);
            
            materialY += rowHeight;
            doc.setTextColor(textColorRed, textColorGreen, textColorBlue);
            doc.setFont('helvetica', 'normal');
          }
          
          if ((itemIndex + matIndex) % 2 === 0) {
            doc.setFillColor(248, 250, 252);
            doc.rect(15, materialY, pageWidth - 30, rowHeight, 'F');
          }
          
          currentX = 15;
          doc.text(item.code, currentX, materialY + 5);
          currentX += materialColWidths.renglonCode;
          
          let renglonDesc = item.description;
          if (renglonDesc.length > 15) {
            renglonDesc = renglonDesc.substring(0, 15) + '...';
          }
          doc.text(renglonDesc, currentX, materialY + 5);
          currentX += materialColWidths.renglonDesc;
          
          doc.text(material.code, currentX, materialY + 5);
          currentX += materialColWidths.materialCode;
          
          let materialDesc = material.description;
          if (materialDesc.length > 18) {
            materialDesc = materialDesc.substring(0, 18) + '...';
          }
          doc.text(materialDesc, currentX, materialY + 5);
          currentX += materialColWidths.materialDesc;
          
          doc.text(material.quantity.toFixed(3), currentX, materialY + 5);
          currentX += materialColWidths.quantity;
          doc.text(material.unit, currentX, materialY + 5);
          currentX += materialColWidths.unit;
          doc.text(formatCurrency(material.unitCost), currentX, materialY + 5);
          currentX += materialColWidths.unitCost;
          doc.text(formatCurrency(material.totalCost), currentX, materialY + 5);
          
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
              unit: material.unit
            });
          }
          
          materialY += rowHeight;
        });
      }
    });
    
    // Resumen agrupado por tipo de material
    if (materialSummary.size > 0) {
      doc.addPage();
      addLetterhead();
      
      doc.setTextColor(textColorRed, textColorGreen, textColorBlue);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('RESUMEN AGRUPADO POR TIPO DE MATERIAL', pageWidth / 2, 55, { align: 'center' });
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Proyecto: ${projectName}`, 15, 70);
      doc.text(`Cliente: ${clientName}`, 15, 78);
      
      const summaryTableStartY = 95;
      
      doc.setFillColor(secondaryColor, secondaryGreen, secondaryBlue);
      doc.rect(15, summaryTableStartY, pageWidth - 30, rowHeight, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      
      const summaryColWidths = {
        code: 25,
        description: 80,
        quantity: 30,
        unit: 15,
        totalCost: 30,
      };
      
      currentX = 15;
      doc.text('Código', currentX, summaryTableStartY + 5);
      currentX += summaryColWidths.code;
      doc.text('Descripción del Material', currentX, summaryTableStartY + 5);
      currentX += summaryColWidths.description;
      doc.text('Cantidad Total', currentX, summaryTableStartY + 5);
      currentX += summaryColWidths.quantity;
      doc.text('Unidad', currentX, summaryTableStartY + 5);
      currentX += summaryColWidths.unit;
      doc.text('Costo Total', currentX, summaryTableStartY + 5);
      
      doc.setTextColor(textColorRed, textColorGreen, textColorBlue);
      doc.setFont('helvetica', 'normal');
      
      let summaryY = summaryTableStartY + rowHeight;
      let grandTotal = 0;
      
      Array.from(materialSummary.entries()).forEach(([key, data], index) => {
        const [code] = key.split('-');
        
        if (summaryY > pageHeight - 30) {
          doc.addPage();
          addLetterhead();
          summaryY = 55;
          
          doc.setFillColor(secondaryColor, secondaryGreen, secondaryBlue);
          doc.rect(15, summaryY, pageWidth - 30, rowHeight, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFont('helvetica', 'bold');
          
          currentX = 15;
          doc.text('Código', currentX, summaryY + 5);
          currentX += summaryColWidths.code;
          doc.text('Descripción del Material', currentX, summaryY + 5);
          currentX += summaryColWidths.description;
          doc.text('Cantidad Total', currentX, summaryY + 5);
          currentX += summaryColWidths.quantity;
          doc.text('Unidad', currentX, summaryY + 5);
          currentX += summaryColWidths.unit;
          doc.text('Costo Total', currentX, summaryY + 5);
          
          summaryY += rowHeight;
          doc.setTextColor(textColorRed, textColorGreen, textColorBlue);
          doc.setFont('helvetica', 'normal');
        }
        
        if (index % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(15, summaryY, pageWidth - 30, rowHeight, 'F');
        }
        
        currentX = 15;
        doc.text(code, currentX, summaryY + 5);
        currentX += summaryColWidths.code;
        doc.text('Material agregado', currentX, summaryY + 5);
        currentX += summaryColWidths.description;
        doc.text(data.quantity.toFixed(3), currentX, summaryY + 5);
        currentX += summaryColWidths.quantity;
        doc.text(data.unit, currentX, summaryY + 5);
        currentX += summaryColWidths.unit;
        doc.text(formatCurrency(data.totalCost), currentX, summaryY + 5);
        
        grandTotal += data.totalCost;
        summaryY += rowHeight;
      });
      
      // Total general de materiales
      summaryY += 5;
      doc.setFillColor(primaryColor, primaryGreen, primaryBlue);
      doc.rect(15, summaryY, pageWidth - 30, rowHeight, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('TOTAL GENERAL DE MATERIALES', 15, summaryY + 6);
      doc.text(formatCurrency(grandTotal), pageWidth - 45, summaryY + 6);
    }
    
    // Footer en todas las páginas
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const footerY = pageHeight - 15;
      doc.setDrawColor(primaryColor, primaryGreen, primaryBlue);
      doc.line(15, footerY - 5, pageWidth - 15, footerY - 5);
      
      doc.setTextColor(128, 128, 128);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text('Multi Servicios de Guatemala - Servicios Integrales de Construcción', pageWidth / 2, footerY, { align: 'center' });
      doc.text(`Página ${i} de ${pageCount}`, pageWidth - 30, footerY);
    }
    
    // Save the PDF
    doc.save(`presupuesto_completo_${projectName.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <button
      onClick={generatePDF}
      className="glass-button px-4 py-2 rounded-lg text-sm text-cyan-300 hover:text-cyan-200 flex items-center space-x-2"
    >
      <Download className="w-4 h-4" />
      <span>Exportar PDF</span>
    </button>
  );
}
