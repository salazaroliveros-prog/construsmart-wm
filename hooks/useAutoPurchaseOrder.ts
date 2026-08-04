/**
 * CONSTRUCTORA WM/M&S - AUTO PURCHASE ORDER GENERATION HOOK
 * Slogan: "CONSTRUYENDO EL FUTURO"
 * 
 * Hook for automatic purchase order generation when stock depletes
 * Cross-module pipeline: WarehouseManager ↔ SupplierManager ↔ Purchase Orders
 * 
 * Automatically generates Draft Purchase Orders when stock drops below threshold:
 * 1. Monitors stock levels vs minimum thresholds
 * 2. Routes to preferred supplier by category
 * 3. Calculates estimated pricing in Quetzales
 * 4. Creates Draft PO in Dexie
 * 5. Triggers user notification
 */

import { useState, useEffect } from 'react';
import { offlineDB, LocalWarehouseStock, LocalSupplier, LocalPurchaseOrder, LocalPurchaseOrderItem } from '@/lib/db/offlineStore';
import { generateId } from '@/lib/utils/generateId';
import { resolveSyncStatus } from '@/lib/utils/syncState';
import { formatGTQ, BUSINESS_CONFIG } from '@/lib/config/app.config';

export interface AutoPOResult {
  success: boolean;
  purchaseOrderId?: string;
  message: string;
  estimatedCost?: number;
  supplierName?: string;
}

export interface StockDepletionAlert {
  stockItem: LocalWarehouseStock;
  currentStock: number;
  minimumThreshold: number;
  depletionPercentage: number;
  recommendedOrderQuantity: number;
  estimatedCost: number;
  supplier?: LocalSupplier;
}

export const useAutoPurchaseOrder = () => {
  const [depletionAlerts, setDepletionAlerts] = useState<StockDepletionAlert[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Check for stock depletion across all warehouse items
   */
  const checkStockDepletion = async (): Promise<StockDepletionAlert[]> => {
    try {
      const allStock = await offlineDB.warehouseStock.toArray();
      const allSuppliers = await offlineDB.suppliers.toArray();
      
      const alerts: StockDepletionAlert[] = [];
      
      for (const stockItem of allStock) {
        if (!stockItem.auto_generate_po) continue;
        
        const depletionPercentage = stockItem.minimum_threshold > 0
          ? (stockItem.current_stock / stockItem.minimum_threshold) * 100
          : 0;
        
        // Check if stock is below threshold
        if (stockItem.current_stock <= stockItem.minimum_threshold) {
          // Find preferred supplier by category
          const supplier = stockItem.preferred_supplier_id
            ? allSuppliers.find(s => s.id === stockItem.preferred_supplier_id)
            : allSuppliers.find(s => 
                s.categories?.includes(stockItem.category || '') && s.is_preferred
              );
          
          // Calculate recommended order quantity (reorder to 2x minimum threshold)
          const recommendedOrderQuantity = Math.max(
            stockItem.minimum_threshold * 2 - stockItem.current_stock,
            stockItem.minimum_threshold
          );
          
          // Calculate estimated cost
          const estimatedCost = recommendedOrderQuantity * stockItem.unit_cost * 1.5; // 1.5x for markup/transport
          
          alerts.push({
            stockItem,
            currentStock: stockItem.current_stock,
            minimumThreshold: stockItem.minimum_threshold,
            depletionPercentage,
            recommendedOrderQuantity,
            estimatedCost,
            supplier
          });
        }
      }
      
      setDepletionAlerts(alerts);
      return alerts;
      
    } catch (error) {
      console.error('[Auto PO] Error checking stock depletion:', error);
      return [];
    }
  };

  /**
   * Generate a Draft Purchase Order for a depleted stock item
   */
  const generateDraftPO = async (stockItem: LocalWarehouseStock): Promise<AutoPOResult> => {
    try {
      setIsProcessing(true);
      
      // Get all suppliers
      const allSuppliers = await offlineDB.suppliers.toArray();
      
      // Find preferred supplier
      const supplier = stockItem.preferred_supplier_id
        ? allSuppliers.find(s => s.id === stockItem.preferred_supplier_id)
        : allSuppliers.find(s => 
            s.categories?.includes(stockItem.category || '') && s.is_preferred
          );
      
      if (!supplier) {
        return {
          success: false,
          message: 'No se encontró proveedor preferido para esta categoría de material'
        };
      }
      
      // Calculate order quantity
      const orderQuantity = Math.max(
        stockItem.minimum_threshold * 2 - stockItem.current_stock,
        stockItem.minimum_threshold
      );
      
      // Calculate estimated cost with markup
      const estimatedCost = orderQuantity * stockItem.unit_cost * 1.5;
      
      // Generate PO code
      const poCode = `PO-${new Date().getFullYear()}-${String(allSuppliers.length + 1).padStart(4, '0')}`;

      // Create Purchase Order
      const purchaseOrder: LocalPurchaseOrder = {
        id: generateId(),
        code: poCode,
        supplier_id: supplier.id || '',
        project_id: stockItem.project_id,
        total_amount: estimatedCost,
        order_date: new Date().toISOString().split('T')[0],
        expected_delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days
        status: 'pending',
        sync_status: resolveSyncStatus({ isNewRecord: true, isOnline: navigator.onLine }),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const poId = await offlineDB.purchaseOrders.add(purchaseOrder);
      
      // Create Purchase Order Item
      const purchaseOrderItem: LocalPurchaseOrderItem = {
        id: generateId(),
        purchase_order_id: poId as string,
        item_code: stockItem.item_code,
        description: stockItem.description,
        quantity: orderQuantity,
        unit: stockItem.unit,
        unit_price: stockItem.unit_cost * 1.5, // Include markup
        total_price: estimatedCost,
        sync_status: resolveSyncStatus({ isNewRecord: true, isOnline: navigator.onLine }),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      await offlineDB.purchaseOrderItems.add(purchaseOrderItem);
      
      // Update stock item with last PO date
      await offlineDB.warehouseStock.update(stockItem.id!, {
        last_po_date: new Date().toISOString()
      });
      
      return {
        success: true,
        purchaseOrderId: poId as string,
        message: `Orden de Compra generada: ${poCode}`,
        estimatedCost,
        supplierName: supplier.name
      };
      
    } catch (error) {
      console.error('[Auto PO] Error generating draft PO:', error);
      return {
        success: false,
        message: 'Error al generar orden de compra automática'
      };
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Generate POs for all depleted stock items
   */
  const generateAllDepletedPOs = async (): Promise<AutoPOResult[]> => {
    const alerts = await checkStockDepletion();
    const results: AutoPOResult[] = [];
    
    for (const alert of alerts) {
      const result = await generateDraftPO(alert.stockItem);
      results.push(result);
    }
    
    return results;
  };

  /**
   * Find suppliers by category
   */
  const findSuppliersByCategory = async (category: string): Promise<LocalSupplier[]> => {
    try {
      const allSuppliers = await offlineDB.suppliers.toArray();
      return allSuppliers.filter(s => 
        s.categories?.includes(category) || s.is_preferred
      );
    } catch (error) {
      console.error('[Auto PO] Error finding suppliers by category:', error);
      return [];
    }
  };

  return {
    depletionAlerts,
    isProcessing,
    checkStockDepletion,
    generateDraftPO,
    generateAllDepletedPOs,
    findSuppliersByCategory
  };
};
