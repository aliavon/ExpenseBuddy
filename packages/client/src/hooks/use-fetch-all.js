import { useState, useEffect, useMemo } from 'react';

import useLazyFetch from './use-lazy-fetch';

export default function useFetchAll(urls = [], options) {
  const [arr, setArr] = useState([]);
  const [loading, setLoading] = useState(false);

  const [getData] = useLazyFetch();

  // Memoize URLs to prevent unnecessary re-renders
  const memoizedUrls = useMemo(() => urls, [JSON.stringify(urls)]);

  useEffect(() => {
    // Reset data when URLs change
    setArr([]);

    // If no URLs, don't set loading
    if (!memoizedUrls.length) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const run = async () => {
      try {
        let completedCount = 0;
        const totalCount = memoizedUrls.length;

        // Process each URL individually to accumulate results
        const promises = memoizedUrls.map(async url => {
          try {
            const data = await getData(url, options);
            // Add result as soon as it's available
            setArr(current => [...current, data]);
            return data;
          } catch (error) {
            // Skip failed requests silently
            return null;
          } finally {
            completedCount++;
            // Only set loading to false when all requests are done
            if (completedCount === totalCount) {
              setLoading(false);
            }
          }
        });

        // Wait for all promises to complete (but results are accumulated individually)
        await Promise.allSettled(promises);

      } catch (error) {
        // Handle any unexpected errors
        console.error('Error in useFetchAll:', error);
        setArr([]);
        setLoading(false);
      }
    };

    run();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memoizedUrls]);

  return {
    data: arr,
    loading,
  };
}
