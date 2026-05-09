import { useMemo, useState } from 'react';

export function usePaginatedOptions(options, visibleCount, enabled) {
  const [page, setPage] = useState(0);

  const buttonsPerPage = enabled
    ? Math.max(1, visibleCount - 1)
    : options.length;

  const totalPages = Math.max(
    1,
    Math.ceil(options.length / buttonsPerPage)
  );

  const visible = useMemo(() => {
    if (!enabled) return options;

    const safePage = Math.min(page, totalPages - 1);
    const start = safePage * buttonsPerPage;

    return options.slice(start, start + buttonsPerPage);
    
  }, [options, enabled, page, totalPages, buttonsPerPage]);

  const hasNext = enabled && page < totalPages - 1;
  const hasPrev = enabled && page > 0;

  const nextPage = () => {
    setPage((p) => (p >= totalPages - 1 ? 0 : p + 1));
  };

  const prevPage = () => {
    setPage((p) => (p <= 0 ? totalPages - 1 : p - 1));
  };

  return {
    visible,
    hasNext,
    hasPrev,
    nextPage,
    prevPage,
    page,
    totalPages,
  };
}