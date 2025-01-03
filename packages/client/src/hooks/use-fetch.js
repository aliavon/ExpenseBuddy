import {useEffect} from 'react';

import useLazyFetch from './use-lazy-fetch';

export default function useFetch(url, options) {
  const [getData, response] = useLazyFetch();

  useEffect(() => {
    const abortController = new AbortController();
    const {signal} = abortController;

    getData(url, {
      ...options,
      signal,
    });

    return () => {
      abortController.abort();
    };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  return response;
}
