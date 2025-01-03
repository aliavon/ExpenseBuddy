import {useState, useEffect} from 'react';

import useLazyFetch from './use-lazy-fetch';

export default function useFetchAll(urls, options) {
  const [arr, setArr] = useState([]);
  const [loading, setLoading] = useState(false);

  const [getData] = useLazyFetch();

  useEffect(() => {
    setLoading(true);
    const run = async () => {
      await Promise.all(urls.map(async url => {
        const data = await getData(url, options);
        setArr(current => [...current, data]);

      }));
      setLoading(false);
    };
    run();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urls]);

  return {
    data: arr,
    loading,
  };
}
