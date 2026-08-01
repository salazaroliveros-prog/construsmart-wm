import { useState, useEffect, useCallback } from 'react';

interface PaginationOptions {
  initialPage?: number;
  itemsPerPage?: number;
  totalItems: number;
  onPageChange?: (page: number) => void;
}

interface PaginationResult {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  startIndex: number;
  endIndex: number;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  reset: () => void;
}

export function usePagination({
  initialPage = 1,
  itemsPerPage = 20,
  totalItems,
  onPageChange,
}: PaginationOptions): PaginationResult {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  const goToPage = useCallback(
    (page: number) => {
      const validPage = Math.max(1, Math.min(page, totalPages));
      setCurrentPage(validPage);
      onPageChange?.(validPage);
    },
    [totalPages, onPageChange]
  );

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  const reset = useCallback(() => {
    setCurrentPage(initialPage);
  }, [initialPage]);

  // Reset to page 1 if totalItems changes significantly
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      goToPage(totalPages);
    }
  }, [currentPage, totalPages, goToPage]);

  return {
    currentPage,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    startIndex: (currentPage - 1) * itemsPerPage,
    endIndex: Math.min(currentPage * itemsPerPage, totalItems),
    goToPage,
    nextPage,
    prevPage,
    reset,
  };
}

/**
 * Hook para infinite scroll (carga incremental)
 */
interface InfiniteScrollOptions {
  itemsPerPage?: number;
  threshold?: number; // px desde el final para cargar más
  onLoadMore: (page: number) => Promise<void>;
  hasMore: boolean;
}

interface InfiniteScrollResult {
  isLoading: boolean;
  loadMore: () => void;
  observerTarget: React.RefObject<HTMLDivElement>;
}

export function useInfiniteScroll({
  itemsPerPage = 20,
  threshold = 100,
  onLoadMore,
  hasMore,
}: InfiniteScrollOptions): InfiniteScrollResult {
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const observerTarget = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          setIsLoading(true);
          try {
            setPage((prev) => prev + 1);
            await onLoadMore(page + 1);
          } finally {
            setIsLoading(false);
          }
        }
      },
      {
        root: null,
        rootMargin: `${threshold}px`,
        threshold: 0,
      }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, isLoading, threshold, onLoadMore, page]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    setIsLoading(true);
    try {
      const nextPage = page + 1;
      setPage(nextPage);
      await onLoadMore(nextPage);
    } finally {
      setIsLoading(false);
    }
  }, [hasMore, isLoading, page, onLoadMore]);

  return {
    isLoading,
    loadMore,
    observerTarget: observerTarget as unknown as React.RefObject<HTMLDivElement>,
  };
}