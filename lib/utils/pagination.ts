/**
 * Pagination Utility
 * CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"
 * 
 * Pagination for large datasets to improve performance
 */

export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Paginate an array of data
 */
export function paginateArray<T>(
  data: T[],
  params: PaginationParams
): PaginatedResult<T> {
  const { page, pageSize, sortBy, sortOrder } = params;
  
  // Sort if needed
  let sortedData = [...data];
  if (sortBy) {
    sortedData.sort((a, b) => {
      const aVal = (a as any)[sortBy];
      const bVal = (b as any)[sortBy];
      
      if (aVal === bVal) return 0;
      
      const comparison = aVal > bVal ? 1 : -1;
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }
  
  // Calculate pagination
  const total = sortedData.length;
  const totalPages = Math.ceil(total / pageSize);
  const validPage = Math.max(1, Math.min(page, totalPages || 1));
  const startIndex = (validPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  
  const paginatedData = sortedData.slice(startIndex, endIndex);
  
  return {
    data: paginatedData,
    total,
    page: validPage,
    pageSize,
    totalPages,
    hasNextPage: validPage < totalPages,
    hasPreviousPage: validPage > 1,
  };
}

/**
 * Generate pagination metadata
 */
export function getPaginationMetadata(total: number, page: number, pageSize: number) {
  const totalPages = Math.ceil(total / pageSize);
  const validPage = Math.max(1, Math.min(page, totalPages || 1));
  
  return {
    total,
    page: validPage,
    pageSize,
    totalPages,
    hasNextPage: validPage < totalPages,
    hasPreviousPage: validPage > 1,
    startIndex: (validPage - 1) * pageSize,
    endIndex: Math.min(validPage * pageSize, total),
  };
}

/**
 * Get page numbers for pagination UI
 */
export function getPageNumbers(currentPage: number, totalPages: number, maxVisible: number = 5): number[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  
  const half = Math.floor(maxVisible / 2);
  let start = Math.max(1, currentPage - half);
  let end = Math.min(totalPages, currentPage + half);
  
  if (end - start < maxVisible - 1) {
    if (start === 1) {
      end = Math.min(totalPages, start + maxVisible - 1);
    } else {
      start = Math.max(1, end - maxVisible + 1);
    }
  }
  
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}