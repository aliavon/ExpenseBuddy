import { renderHook, waitFor } from '@testing-library/react';
import useFetchAll from '../use-fetch-all';
import useLazyFetch from '../use-lazy-fetch';
import { 
  mockFetch, 
  mockFetchError, 
  TEST_CONSTANTS,
  ERROR_MESSAGES 
} from '../../test-utils/test-hooks-utils';

// Mock the useLazyFetch hook
jest.mock('../use-lazy-fetch');

describe('useFetchAll', () => {
  const testUrls = TEST_CONSTANTS.TEST_URLS;
  const testData1 = { id: 1, name: 'Data 1' };
  const testData2 = { id: 2, name: 'Data 2' };
  let mockGetData;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockGetData = jest.fn();
    useLazyFetch.mockReturnValue([mockGetData]);
  });

  afterEach(() => {
    if (global.fetch) {
      global.fetch.mockRestore();
    }
  });

  it('should initialize with empty array and not loading', () => {
    mockGetData.mockResolvedValue(testData1);
    const { result } = renderHook(() => useFetchAll([]));

    expect(result.current.data).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('should call useLazyFetch hook', () => {
    renderHook(() => useFetchAll(testUrls));

    expect(useLazyFetch).toHaveBeenCalled();
  });

  it('should fetch all URLs and return data array', async () => {
    mockGetData
      .mockResolvedValueOnce(testData1)
      .mockResolvedValueOnce(testData2);

    const { result } = renderHook(() => useFetchAll(testUrls));

    // Initially loading should be true
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data).toContainEqual(testData1);
    expect(result.current.data).toContainEqual(testData2);
  });

  it('should call getData for each URL with options', async () => {
    const options = { method: 'GET', headers: { 'Accept': 'application/json' } };
    mockGetData.mockResolvedValue(testData1);

    renderHook(() => useFetchAll(testUrls, options));

    await waitFor(() => {
      expect(mockGetData).toHaveBeenCalledTimes(testUrls.length);
    });

    testUrls.forEach((url, index) => {
      expect(mockGetData).toHaveBeenNthCalledWith(index + 1, url, options);
    });
  });

  it('should handle single URL', async () => {
    const singleUrl = [testUrls[0]];
    mockGetData.mockResolvedValue(testData1);

    const { result } = renderHook(() => useFetchAll(singleUrl));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual([testData1]);
    expect(mockGetData).toHaveBeenCalledTimes(1);
    expect(mockGetData).toHaveBeenCalledWith(testUrls[0], undefined);
  });

  it('should handle empty URLs array', async () => {
    const { result } = renderHook(() => useFetchAll([]));

    // Should not be loading since there are no URLs to fetch
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual([]);
    expect(mockGetData).not.toHaveBeenCalled();
  });

  it('should refetch when URLs change', async () => {
    mockGetData.mockResolvedValue(testData1);
    
    const { result, rerender } = renderHook(
      ({ urls }) => useFetchAll(urls),
      { initialProps: { urls: [testUrls[0]] } }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockGetData).toHaveBeenCalledTimes(1);
    expect(result.current.data).toHaveLength(1);

    // Clear the array and change URLs
    mockGetData.mockClear();
    mockGetData.mockResolvedValue(testData2);
    
    rerender({ urls: testUrls });

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockGetData).toHaveBeenCalledTimes(testUrls.length);
  });

  it('should reset data array when URLs change', async () => {
    mockGetData.mockResolvedValue(testData1);
    
    const { result, rerender } = renderHook(
      ({ urls }) => useFetchAll(urls),
      { initialProps: { urls: [testUrls[0]] } }
    );

    await waitFor(() => {
      expect(result.current.data).toHaveLength(1);
    });

    // Change to different URLs
    mockGetData.mockClear();
    mockGetData.mockResolvedValue(testData2);
    
    rerender({ urls: [testUrls[1]] });

    // Data should be reset and start fresh
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0]).toEqual(testData2);
  });

  it('should handle partial failures gracefully', async () => {
    mockGetData
      .mockResolvedValueOnce(testData1)
      .mockRejectedValueOnce(new Error('Fetch failed'))
      .mockResolvedValueOnce(testData2);

    const threeUrls = [...testUrls, 'https://api.test.com/third'];
    const { result } = renderHook(() => useFetchAll(threeUrls));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should contain successful responses (order might vary due to Promise.all)
    // The failed request won't add to the array
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data).toContainEqual(testData1);
    expect(result.current.data).toContainEqual(testData2);
  });

  it('should handle all requests failing', async () => {
    mockGetData.mockRejectedValue(new Error('All requests failed'));

    const { result } = renderHook(() => useFetchAll(testUrls));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
  });

  it('should maintain loading state during fetch', async () => {
    let resolvePromise;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    
    mockGetData.mockReturnValue(promise);

    const { result } = renderHook(() => useFetchAll([testUrls[0]]));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toEqual([]);

    // Resolve the promise
    resolvePromise(testData1);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should accumulate results as they come in', async () => {
    let resolveFirst, resolveSecond;
    
    const firstPromise = new Promise((resolve) => {
      resolveFirst = resolve;
    });
    
    const secondPromise = new Promise((resolve) => {
      resolveSecond = resolve;
    });

    mockGetData
      .mockReturnValueOnce(firstPromise)
      .mockReturnValueOnce(secondPromise);

    const { result } = renderHook(() => useFetchAll(testUrls));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toEqual([]);

    // Resolve first request
    resolveFirst(testData1);

    await waitFor(() => {
      expect(result.current.data).toHaveLength(1);
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toContainEqual(testData1);

    // Resolve second request
    resolveSecond(testData2);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data).toContainEqual(testData1);
    expect(result.current.data).toContainEqual(testData2);
  });

  it('should handle different data types', async () => {
    const stringData = 'string response';
    const numberData = 42;
    const arrayData = [1, 2, 3];
    
    mockGetData
      .mockResolvedValueOnce(stringData)
      .mockResolvedValueOnce(numberData)
      .mockResolvedValueOnce(arrayData);

    const threeUrls = [...testUrls, 'https://api.test.com/third'];
    const { result } = renderHook(() => useFetchAll(threeUrls));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toHaveLength(3);
    expect(result.current.data).toContainEqual(stringData);
    expect(result.current.data).toContainEqual(numberData);
    expect(result.current.data).toContainEqual(arrayData);
  });

  it('should pass options to each fetch request', async () => {
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: true }),
    };

    mockGetData.mockResolvedValue(testData1);

    renderHook(() => useFetchAll(testUrls, options));

    await waitFor(() => {
      expect(mockGetData).toHaveBeenCalledTimes(testUrls.length);
    });

    testUrls.forEach((url, index) => {
      expect(mockGetData).toHaveBeenNthCalledWith(index + 1, url, options);
    });
  });
}); 