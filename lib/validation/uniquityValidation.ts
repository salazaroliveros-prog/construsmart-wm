/**
 * Uniqueness Validation Utility
 * CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"
 * 
 * Validate uniqueness of records to prevent duplicates
 */

import { offlineDB } from '@/lib/db/offlineStore';

/**
 * Check if project code is unique
 */
export async function isProjectCodeUnique(code: string, excludeId?: string): Promise<boolean> {
  try {
    const existing = await offlineDB.projects
      .where('code')
      .equals(code)
      .first();
    
    if (!existing) return true;
    
    // If excluding ID, check if the existing record is different
    if (excludeId && existing.id !== excludeId) {
      return false;
    }
    
    return !existing;
  } catch (error) {
    console.error('Error checking project code uniqueness:', error);
    return false;
  }
}

/**
 * Check if client identification is unique
 */
export async function isClientUnique(
  identifier: string,
  identifierType: 'email' | 'phone' | 'name',
  excludeId?: string
): Promise<boolean> {
  try {
    const clients = await offlineDB.clients.toArray();
    
    const duplicate = clients.find(client => {
      if (excludeId && client.id === excludeId) return false;
      
      if (identifierType === 'email') {
        return client.email?.toLowerCase() === identifier.toLowerCase();
      }
      if (identifierType === 'phone') {
        return client.phone === identifier;
      }
      if (identifierType === 'name') {
        return client.name?.toLowerCase() === identifier.toLowerCase();
      }
      return false;
    });
    
    return !duplicate;
  } catch (error) {
    console.error('Error checking client uniqueness:', error);
    return false;
  }
}

/**
 * Check if supplier identification is unique
 */
export async function isSupplierUnique(
  identifier: string,
  identifierType: 'email' | 'phone' | 'name' | 'code',
  excludeId?: string
): Promise<boolean> {
  try {
    const suppliers = await offlineDB.suppliers.toArray();
    
    const duplicate = suppliers.find(supplier => {
      if (excludeId && supplier.id === excludeId) return false;
      
      if (identifierType === 'email') {
        return supplier.email?.toLowerCase() === identifier.toLowerCase();
      }
      if (identifierType === 'phone') {
        return supplier.phone === identifier;
      }
      if (identifierType === 'name') {
        return supplier.name?.toLowerCase() === identifier.toLowerCase();
      }
      if (identifierType === 'code') {
        return supplier.code === identifier;
      }
      return false;
    });
    
    return !duplicate;
  } catch (error) {
    console.error('Error checking supplier uniqueness:', error);
    return false;
  }
}

/**
 * Check if employee identification is unique
 */
export async function isEmployeeUnique(
  identifier: string,
  identifierType: 'name' | 'position',
  excludeId?: string
): Promise<boolean> {
  try {
    const employees = await offlineDB.payrollEmployees.toArray();
    
    const duplicate = employees.find(employee => {
      if (excludeId && employee.id === excludeId) return false;
      
      if (identifierType === 'name') {
        return employee.name?.toLowerCase() === identifier.toLowerCase();
      }
      if (identifierType === 'position') {
        return employee.position?.toLowerCase() === identifier.toLowerCase();
      }
      return false;
    });
    
    return !duplicate;
  } catch (error) {
    console.error('Error checking employee uniqueness:', error);
    return false;
  }
}