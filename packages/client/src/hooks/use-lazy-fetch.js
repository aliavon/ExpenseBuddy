import {useState, useCallback} from 'react';

export default function useLazyFetch(_url, _options = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const handleFetch = useCallback(async (url = _url, options = _options) => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await fetch(url, options);
      const data = await response.json();
      setData(data);
      return data;

    } catch (error) {
      setError(error);
    } finally {

      setLoading(false);
    }

  }, [_options, _url]);

  return [
    handleFetch, {
      loading,
      error,
      data,
    },
  ];
}
