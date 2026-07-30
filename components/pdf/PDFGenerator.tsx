/**
 * CONSTRUCTORA WM/M&S - PDF GENERATOR
 * Slogan: "CONSTRUYENDO EL FUTURO"
 * 
 * PDF Export with Multi Servicios Letterhead
 * Professional budget reports with corporate branding
 */

'use client';

import { jsPDF } from 'jspdf';
import { FileText, Download } from 'lucide-react';
import { useState, useEffect } from 'react';

interface BudgetItem {
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
}

export default function PDFGenerator({
  projectName,
  clientName,
  items,
  summary,
  indirectPercentage,
  contingencyPercentage,
  profitPercentage,
}: PDFGeneratorProps) {
  const generatePDF = async () => {
    const doc = new jsPDF();
    
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
    
    // Add Multi Servicios Letterhead
    try {
      // Load the letterhead image
      const letterheadResponse = await fetch('/assets/branding/letterhead-multiservicios.jpg');
      const letterheadBlob = await letterheadResponse.blob();
      const letterheadDataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(letterheadBlob);
      });
      
      // Add letterhead image to PDF
      doc.addImage(letterheadDataUrl, 'JPEG', 15, 10, 40, 25);
    } catch (error) {
      console.error('Failed to load letterhead image:', error);
      // Fallback to text-based letterhead
      doc.setFillColor(primaryColor, primaryGreen, primaryBlue);
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('CONSTRUCTORA WM/M&S', 15, 20);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.text('"CONSTRUYENDO EL FUTURO"', 15, 28);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Guatemala, C.A. | Tel: (+502) 5555-0000 | Email: contacto@constructorawm.com', 15, 35);
    }
    
    // Company information right side
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
    
    // Divider line
    doc.setDrawColor(primaryColor, primaryGreen, primaryBlue);
    doc.setLineWidth(0.5);
    doc.line(15, 40, pageWidth - 15, 40);
    
    // Report title
    doc.setTextColor(textColorRed, textColorGreen, textColorBlue);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('PRESUPUESTO DE OBRA', pageWidth / 2, 55, { align: 'center' });
    
    // Project information
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    const infoY = 70;
    doc.text(`Proyecto: ${projectName}`, 15, infoY);
    doc.text(`Cliente: ${clientName}`, 15, infoY + 8);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-GT')}`, 15, infoY + 16);
    
    doc.setTextColor(textColorRed, textColorGreen, textColorBlue);
    
    // Budget items table
    const tableStartY = 90;
    const rowHeight = 8;
    
    // Table header
    doc.setFillColor(primaryColor, primaryGreen, primaryBlue);
    doc.rect(15, tableStartY, pageWidth - 30, rowHeight, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    
    const colWidths = {
      code: 25,
      description: 70,
      unit: 15,
      quantity: 20,
      unitCost: 25,
      total: 30,
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
    
    // Table rows
    doc.setTextColor(textColorRed, textColorGreen, textColorBlue);
    doc.setFont('helvetica', 'normal');
    
    let currentY = tableStartY + rowHeight;
    
    items.forEach((item, index) => {
      if (currentY > pageHeight - 30) {
        doc.addPage();
        currentY = 20;
        
        // Repeat header on new page
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
        
        currentY += rowHeight;
        doc.setTextColor(textColorRed, textColorGreen, textColorBlue);
        doc.setFont('helvetica', 'normal');
      }
      
      // Alternate row background
      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(15, currentY, pageWidth - 30, rowHeight, 'F');
      }
      
      currentX = 15;
      doc.text(item.code, currentX, currentY + 5);
      currentX += colWidths.code;
      
      // Truncate long descriptions
      let description = item.description;
      if (item.description.length > 30) {
        description = item.description.substring(0, 30) + '...';
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
      
      currentY += rowHeight;
    });
    
    // Summary section
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
    
    // Footer
    const disclaimerY = pageHeight - 20;
    doc.setTextColor(128, 128, 128);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      'Este documento es un presupuesto estimado. Los precios finales pueden variar según condiciones específicas del proyecto.',
      pageWidth / 2,
      disclaimerY,
      { align: 'center' }
    );
    
    // Signature blocks
    const signatureY = pageHeight - 50;
    doc.setDrawColor(128, 128, 128);
    doc.line(30, signatureY, 80, signatureY);
    doc.line(pageWidth - 80, signatureY, pageWidth - 30, signatureY);
    
    doc.setTextColor(textColorRed, textColorGreen, textColorBlue);
    doc.setFontSize(9);
    doc.text('Elaborado por:', 30, signatureY + 5);
    doc.text('Aprobado por:', pageWidth - 80, signatureY + 5);
    
    // Footer with Multi Servicios branding
    const footerY = pageHeight - 15;
    doc.setDrawColor(primaryColor, primaryGreen, primaryBlue);
    doc.line(15, footerY - 5, pageWidth - 15, footerY - 5);
    
    doc.setTextColor(128, 128, 128);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('Multi Servicios de Guatemala - Servicios Integrales de Construcción', pageWidth / 2, footerY, { align: 'center' });
    
    // Save the PDF
    doc.save(`presupuesto_${projectName.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
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
