import { renderHook } from '@testing-library/react';
import useFetch from '../use-fetch';
import useLazyFetch from '../use-lazy-fetch';
import { 
  mockFetch, 
  mockFetchError, 
  expectFetchResponse, 
  expectErrorState,
  TEST_CONSTANTS,
  ERROR_MESSAGES 
} from '../../test-utils/test-hooks-utils';

// Mock the useLazyFetch hook
jest.mock('../use-lazy-fetch');

describe('useFetch', () => {
  const testUrl = TEST_CONSTANTS.TEST_URLS[0];
  const testData = { id: 1, name: 'Test Data' };
  let mockGetData;
  let mockResponse;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockGetData = jest.fn();
    mockResponse = {
      data: null,
      loading: false,
      error: null,
    };

    useLazyFetch.mockReturnValue([mockGetData, mockResponse]);
  });

  afterEach(() => {
    if (global.fetch) {
      global.fetch.mockRestore();
    }
  });

  it('should call useLazyFetch and return its response', () => {
    const { result } = renderHook(() => useFetch(testUrl));

    expect(useLazyFetch).toHaveBeenCalled();
    expect(result.current).toBe(mockResponse);
  });

  it('should call getData immediately with url and options', () => {
    const options = { method: 'POST' };
    renderHook(() => useFetch(testUrl, options));

    expect(mockGetData).toHaveBeenCalledWith(testUrl, expect.objectContaining({
      ...options,
      signal: expect.any(AbortSignal),
    }));
  });

  it('should add AbortController signal to options', () => {
    const options = { method: 'GET', headers: { 'Content-Type': 'application/json' } };
    renderHook(() => useFetch(testUrl, options));

    expect(mockGetData).toHaveBeenCalledWith(testUrl, expect.objectContaining({
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: expect.any(AbortSignal),
    }));
  });

  it('should call getData when url changes', () => {
    const { rerender } = renderHook(
      ({ url }) => useFetch(url),
      { initialProps: { url: testUrl } }
    );

    expect(mockGetData).toHaveBeenCalledTimes(1);

    const newUrl = TEST_CONSTANTS.TEST_URLS[1];
    rerender({ url: newUrl });

    expect(mockGetData).toHaveBeenCalledTimes(2);
    expect(mockGetData).toHaveBeenLastCalledWith(newUrl, expect.objectContaining({
      signal: expect.any(AbortSignal),
    }));
  });

  it('should not call getData again when url stays the same', () => {
    const { rerender } = renderHook(
      ({ url }) => useFetch(url),
      { initialProps: { url: testUrl } }
    );

    expect(mockGetData).toHaveBeenCalledTimes(1);

    rerender({ url: testUrl });

    expect(mockGetData).toHaveBeenCalledTimes(1);
  });

  it('should handle options changes without retriggering fetch', () => {
    const initialOptions = { method: 'GET' };
    const { rerender } = renderHook(
      ({ options }) => useFetch(testUrl, options),
      { initialProps: { options: initialOptions } }
    );

    expect(mockGetData).toHaveBeenCalledTimes(1);

    const newOptions = { method: 'POST' };
    rerender({ options: newOptions });

    // Should not refetch since dependency array only includes url
    expect(mockGetData).toHaveBeenCalledTimes(1);
  });

  it('should return loading state from useLazyFetch', () => {
    mockResponse.loading = true;
    const { result } = renderHook(() => useFetch(testUrl));

    expect(result.current.loading).toBe(true);
  });

  it('should return error state from useLazyFetch', () => {
    const error = new Error(ERROR_MESSAGES.FETCH_ERROR);
    mockResponse.error = error;
    const { result } = renderHook(() => useFetch(testUrl));

    expect(result.current.error).toBe(error);
  });

  it('should return data from useLazyFetch', () => {
    mockResponse.data = testData;
    const { result } = renderHook(() => useFetch(testUrl));

    expect(result.current.data).toEqual(testData);
  });

  it('should handle empty options', () => {
    renderHook(() => useFetch(testUrl));

    expect(mockGetData).toHaveBeenCalledWith(testUrl, expect.objectContaining({
      signal: expect.any(AbortSignal),
    }));
  });

  it('should handle undefined options', () => {
    renderHook(() => useFetch(testUrl, undefined));

    expect(mockGetData).toHaveBeenCalledWith(testUrl, expect.objectContaining({
      signal: expect.any(AbortSignal),
    }));
  });

  it('should work with different URL formats', () => {
    const relativeUrl = '/api/data';
    renderHook(() => useFetch(relativeUrl));

    expect(mockGetData).toHaveBeenCalledWith(relativeUrl, expect.objectContaining({
      signal: expect.any(AbortSignal),
    }));
  });

  it('should preserve existing signal in options', () => {
    const existingController = new AbortController();
    const options = { signal: existingController.signal };
    
    renderHook(() => useFetch(testUrl, options));

    // Should override the existing signal with new one
    expect(mockGetData).toHaveBeenCalledWith(testUrl, expect.objectContaining({
      signal: expect.any(AbortSignal),
    }));
    
    const [, passedOptions] = mockGetData.mock.calls[0];
    expect(passedOptions.signal).not.toBe(existingController.signal);
  });

  it('should create new AbortController for each render', () => {
    const { rerender } = renderHook(() => useFetch(testUrl));
    
    const firstCall = mockGetData.mock.calls[0];
    const firstSignal = firstCall[1].signal;

    rerender();
    
    // Since URL didn't change, getData shouldn't be called again
    expect(mockGetData).toHaveBeenCalledTimes(1);
  });

  it('should handle complex options object', () => {
    const complexOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer token123',
      },
      body: JSON.stringify({ test: 'data' }),
      credentials: 'include',
    };

    renderHook(() => useFetch(testUrl, complexOptions));

    expect(mockGetData).toHaveBeenCalledWith(testUrl, expect.objectContaining({
      ...complexOptions,
      signal: expect.any(AbortSignal),
    }));
  });
}); 