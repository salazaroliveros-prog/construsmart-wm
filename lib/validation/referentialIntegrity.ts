/**
 * Referential Integrity Validation
 * CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"
 * 
 * Validates foreign key relationships and data consistency
 */

import { offlineDB } from '@/lib/db/offlineStore';

/**
 * Check if a parent record exists
 */
async function checkParentExists(table: string, id: string): Promise<boolean> {
  try {
    const record = await (offlineDB as any)[table].get(id);
    return !!record;
  } catch (error) {
    console.error(`Error checking parent existence in ${table}:`, error);
    return false;
  }
}

/**
 * Check if a parent record exists (public version)
 */
export async function parentExists(table: string, id: string): Promise<boolean> {
  return checkParentExists(table, id);
}

/**
 * Check if child records exist for a parent
 */
export async function hasChildren(table: string, foreignKey: string, parentId: string): Promise<boolean> {
  try {
    const count = await (offlineDB as any)[table]
      .where(foreignKey)
      .equals(parentId)
      .count();
    return count > 0;
  } catch (error) {
    console.error(`Error checking children in ${table}:`, error);
    return false;
  }
}

/**
 * Validate project deletion (check for dependent records)
 */
export async function canDeleteProject(projectId: string): Promise<{ canDelete: boolean; dependencies: string[] }> {
  const dependencies: string[] = [];

  // Check for budgets
  if (await hasChildren('budgets', 'project_id', projectId)) {
    dependencies.push('Presupuestos');
  }

  // Check for financial transactions
  if (await hasChildren('financialTransactions', 'project_id', projectId)) {
    dependencies.push('Transacciones financieras');
  }

  // Check for payroll records
  if (await hasChildren('payrollRecords', 'project_id', projectId)) {
    dependencies.push('Registros de nómina');
  }

  // Check for warehouse stock
  if (await hasChildren('warehouseStock', 'project_id', projectId)) {
    dependencies.push('Stock de almacén');
  }

  // Check for project logs
  if (await hasChildren('projectLogs', 'project_id', projectId)) {
    dependencies.push('Bitácoras de proyecto');
  }

  // Check for purchase orders
  if (await hasChildren('purchaseOrders', 'project_id', projectId)) {
    dependencies.push('Órdenes de compra');
  }

  return {
    canDelete: dependencies.length === 0,
    dependencies
  };
}

/**
 * Validate budget deletion (check for budget items)
 */
export async function canDeleteBudget(budgetId: string): Promise<{ canDelete: boolean; dependencies: string[] }> {
  const dependencies: string[] = [];

  if (await hasChildren('budgetItems', 'budget_id', budgetId)) {
    dependencies.push('Items de presupuesto');
  }

  return {
    canDelete: dependencies.length === 0,
    dependencies
  };
}

/**
 * Validate supplier deletion (check for purchase orders)
 */
export async function canDeleteSupplier(supplierId: string): Promise<{ canDelete: boolean; dependencies: string[] }> {
  const dependencies: string[] = [];

  if (await hasChildren('purchaseOrders', 'supplier_id', supplierId)) {
    dependencies.push('Órdenes de compra');
  }

  if (await hasChildren('subcontractors', 'supplier_id', supplierId)) {
    dependencies.push('Subcontratistas');
  }

  return {
    canDelete: dependencies.length === 0,
    dependencies
  };
}

/**
 * Validate purchase order deletion (check for items)
 */
export async function canDeletePurchaseOrder(orderId: string): Promise<{ canDelete: boolean; dependencies: string[] }> {
  const dependencies: string[] = [];

  if (await hasChildren('purchaseOrderItems', 'purchase_order_id', orderId)) {
    dependencies.push('Items de orden de compra');
  }

  return {
    canDelete: dependencies.length === 0,
    dependencies
  };
}

/**
 * Validate employee deletion (check for payroll records)
 */
export async function canDeleteEmployee(employeeId: string): Promise<{ canDelete: boolean; dependencies: string[] }> {
  const dependencies: string[] = [];

  if (await hasChildren('payrollRecords', 'employee_id', employeeId)) {
    dependencies.push('Registros de nómina');
  }

  return {
    canDelete: dependencies.length === 0,
    dependencies
  };
}

/**
 * Generic foreign key validation
 */
export async function validateForeignKey(
  childTable: string,
  foreignKey: string,
  parentTable: string,
  parentId: string
): Promise<{ valid: boolean; error?: string }> {
  if (!parentId) {
    return { valid: false, error: 'Foreign key value is required' };
  }

  const parentExistsResult = await checkParentExists(parentTable, parentId);
  
  if (!parentExistsResult) {
    return { 
      valid: false, 
      error: `Parent record does not exist in ${parentTable} with id ${parentId}` 
    };
  }

  return { valid: true };
}

/**
 * Batch validation for all foreign keys in a record
 */
export async function validateAllForeignKeys(
  record: any,
  foreignKeyMappings: Record<string, string>
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  for (const [childField, parentTable] of Object.entries(foreignKeyMappings)) {
    const foreignKeyValue = record[childField];
    
    if (foreignKeyValue) {
      const result = await validateForeignKey(
        'current',
        childField,
        parentTable,
        foreignKeyValue
      );
      
      if (!result.valid) {
        errors.push(result.error || `Invalid foreign key: ${childField}`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}