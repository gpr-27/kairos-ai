import { useEffect, useState } from 'react';

/**
 * Debounce a value. Useful for search inputs to avoid hammering the API on every keystroke.
 *
 * @example
 *   const [query, setQuery] = useState('');
 *   const debouncedQuery = useDebounce(query, 300);
 *   const { data } = useQuery({ queryKey: ['search', debouncedQuery], queryFn: ... });
 */
export function useDebounce<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(handle);
  }, [value, delayMs]);

  return debounced;
}
