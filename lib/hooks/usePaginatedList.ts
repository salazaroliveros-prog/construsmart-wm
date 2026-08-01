'use client';

import { useMemo } from 'react';

const PAGE_SIZE = 20;

export function usePaginatedList<T extends { id: string }>(all: T[]) {
  const visibleCountRef = { current: PAGE_SIZE };

  const page = useMemo(
    () => all.slice(0, visibleCountRef.current),
    [all],
  );

  const hasMore = visibleCountRef.current < all.length;

  const reset = () => {
    visibleCountRef.current = PAGE_SIZE;
  };

  const showMore = () => {
    visibleCountRef.current += PAGE_SIZE;
  };

  return { page, hasMore, showMore, reset, visibleCount: () => visibleCountRef.current };
}
