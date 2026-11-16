import { useEffect, useRef } from 'react';

/**
 * Attaches an IntersectionObserver to a sentinel element to automatically preload
 * the next page smoothly before the user hits the bottom of the viewport.
 */
export const useInfiniteScroll = ({ hasMore, loading, onLoadMore, rootMargin = '400px' }) => {
  const sentinelRef = useRef(null);
  const callbackRef = useRef(onLoadMore);
  callbackRef.current = onLoadMore;

  useEffect(() => {
    if (!hasMore || loading) return;
    if (typeof window === 'undefined' || typeof window.IntersectionObserver === 'undefined') return;

    const el = sentinelRef.current;
    if (!el) return;

    const observer = new window.IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          callbackRef.current?.();
        }
      },
      { rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, rootMargin]);

  return sentinelRef;
};

export default useInfiniteScroll;

