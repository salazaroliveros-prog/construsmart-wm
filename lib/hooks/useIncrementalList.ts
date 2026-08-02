'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Hook de renderizado incremental para tablas/lista grandes.
 *
 * En lugar de renderizar TODOS los elementos (que satura el DOM y la memoria
 * cuando hay miles de filas), solo se renderiza un subconjunto visible y se
 * aumenta bajo demanda ("Ver más") o al hacer scroll.
 *
 * FASE 5.1 del plan de corrección - "No virtualization in large tables".
 * Implementación ligera sin dependencias pesadas.
 */

const DEFAULT_INCREMENT = 25;
const SCROLL_THRESHOLD = 300;

interface UseIncrementalListOptions<T> {
  items: T[];
  increment?: number;
  resetOnItemsChange?: boolean;
}

export function useIncrementalList<T>({
  items,
  increment = DEFAULT_INCREMENT,
  resetOnItemsChange = false,
}: UseIncrementalListOptions<T>) {
  const [visibleCount, setVisibleCount] = useState(increment);
  const lastLengthRef = useRef(items.length);

  // Auto-reset cuando la lista cambia de tamaño drásticamente (opcional).
  // Útil en pestañas donde el filtro cambia el set de datos completo.
  useEffect(() => {
    if (!resetOnItemsChange) return;

    const prevLength = lastLengthRef.current;
    lastLengthRef.current = items.length;

    // Si la nueva lista es más corta que lo ya visible, recortar automáticamente.
    if (items.length < visibleCount) {
      setVisibleCount(increment);
    } else if (prevLength > 0 && items.length === 0) {
      setVisibleCount(increment);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, resetOnItemsChange]);

  const visibleItems = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;
  const remaining = items.length - visibleCount;
  const totalItems = items.length;

  const showMore = useCallback(() => {
    setVisibleCount(c => c + increment);
  }, [increment]);

  const showAll = useCallback(() => {
    setVisibleCount(items.length);
  }, [items.length]);

  const reset = useCallback(() => {
    setVisibleCount(increment);
  }, [increment]);

  return {
    visibleItems,
    hasMore,
    remaining,
    totalItems,
    showMore,
    showAll,
    reset,
  };
}

/**
 * Referencia de callback para "infinite scroll" ligero.
 * Se pega al contenedor con overflow-y: auto. Cuando el usuario se acerca al
 * final, dispara showMore() automáticamente.
 */
export function useLoadMoreOnScroll(
  containerRef: React.RefObject<HTMLElement | null>,
  hasMore: boolean,
  onLoadMore: () => void
) {
  const onLoadMoreRef = useRef(onLoadMore);
  onLoadMoreRef.current = onLoadMore;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleScroll = () => {
      if (!hasMore) return;
      const { scrollTop, scrollHeight, clientHeight } = el;
      if (scrollHeight - scrollTop - clientHeight < SCROLL_THRESHOLD) {
        onLoadMoreRef.current();
      }
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [containerRef, hasMore]);
}

