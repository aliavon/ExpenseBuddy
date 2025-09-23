import { renderHook, act } from '@testing-library/react';
import useLazyFetch from '../use-lazy-fetch';
import { 
  mockFetch, 
  mockFetchError, 
  expectFetchResponse, 
  expectErrorState,
  TEST_CONSTANTS,
  ERROR_MESSAGES 
} from '../../test-utils/test-hooks-utils';

describe('useLazyFetch', () => {
  const testUrl = TEST_CONSTANTS.TEST_URLS[0];
  const testData = { id: 1, name: 'Test Data' };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (global.fetch) {
      global.fetch.mockRestore();
    }
  });

  it('should initialize with null data, no error, and not loading', () => {
    const { result } = renderHook(() => useLazyFetch());
    const [, state] = result.current;

    expect(state.data).toBeNull();
    expect(state.error).toBeNull();
    expect(state.loading).toBe(false);
  });

  it('should return a function as the first element', () => {
    const { result } = renderHook(() => useLazyFetch());
    const [fetchFunction] = result.current;

    expect(typeof fetchFunction).toBe('function');
  });

  it('should handle successful fetch', async () => {
    mockFetch(testData);
    const { result } = renderHook(() => useLazyFetch());
    const [fetchFunction] = result.current;

    await act(async () => {
      await fetchFunction(testUrl);
    });

    const [, state] = result.current;
    expectFetchResponse(state, testData);
    expect(global.fetch).toHaveBeenCalledWith(testUrl, {});
  });

  it('should handle fetch with options', async () => {
    const options = { method: 'POST', headers: { 'Content-Type': 'application/json' } };
    mockFetch(testData);
    const { result } = renderHook(() => useLazyFetch());
    const [fetchFunction] = result.current;

    await act(async () => {
      await fetchFunction(testUrl, options);
    });

    expect(global.fetch).toHaveBeenCalledWith(testUrl, options);
  });

  it('should handle fetch errors', async () => {
    const error = new Error(ERROR_MESSAGES.FETCH_ERROR);
    mockFetchError(error);
    const { result } = renderHook(() => useLazyFetch());
    const [fetchFunction] = result.current;

    await act(async () => {
      await fetchFunction(testUrl);
    });

    const [, state] = result.current;
    expectErrorState(state, ERROR_MESSAGES.FETCH_ERROR);
    expect(state.data).toBeNull();
  });

  it('should set loading state during fetch', async () => {
    let resolveFetch;
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    
    global.fetch = jest.fn().mockReturnValue(fetchPromise);
    
    const { result } = renderHook(() => useLazyFetch());
    const [fetchFunction] = result.current;

    act(() => {
      fetchFunction(testUrl);
    });

    // Check loading state
    const [, loadingState] = result.current;
    expect(loadingState.loading).toBe(true);
    expect(loadingState.error).toBeNull();
    expect(loadingState.data).toBeNull();

    // Resolve the fetch
    await act(async () => {
      resolveFetch({
        json: () => Promise.resolve(testData),
      });
    });

    const [, finalState] = result.current;
    expect(finalState.loading).toBe(false);
  });

  it('should use default url and options from initialization', async () => {
    const defaultUrl = 'https://api.default.com';
    const defaultOptions = { method: 'GET' };
    mockFetch(testData);
    
    const { result } = renderHook(() => useLazyFetch(defaultUrl, defaultOptions));
    const [fetchFunction] = result.current;

    await act(async () => {
      await fetchFunction();
    });

    expect(global.fetch).toHaveBeenCalledWith(defaultUrl, defaultOptions);
  });

  it('should override default url and options when provided', async () => {
    const defaultUrl = 'https://api.default.com';
    const defaultOptions = { method: 'GET' };
    const overrideUrl = 'https://api.override.com';
    const overrideOptions = { method: 'POST' };
    
    mockFetch(testData);
    
    const { result } = renderHook(() => useLazyFetch(defaultUrl, defaultOptions));
    const [fetchFunction] = result.current;

    await act(async () => {
      await fetchFunction(overrideUrl, overrideOptions);
    });

    expect(global.fetch).toHaveBeenCalledWith(overrideUrl, overrideOptions);
  });

  it('should return data from fetch function', async () => {
    mockFetch(testData);
    const { result } = renderHook(() => useLazyFetch());
    const [fetchFunction] = result.current;

    let returnedData;
    await act(async () => {
      returnedData = await fetchFunction(testUrl);
    });

    expect(returnedData).toEqual(testData);
  });

  it('should reset error and data on new fetch', async () => {
    const error = new Error('Initial error');
    mockFetchError(error);
    const { result } = renderHook(() => useLazyFetch());
    const [fetchFunction] = result.current;

    // First fetch with error
    await act(async () => {
      await fetchFunction(testUrl);
    });

    let [, state] = result.current;
    expect(state.error).toBeDefined();

    // Second fetch successful
    mockFetch(testData);
    await act(async () => {
      await fetchFunction(testUrl);
    });

    [, state] = result.current;
    expect(state.error).toBeNull();
    expect(state.data).toEqual(testData);
  });

  it('should handle multiple consecutive fetches', async () => {
    const firstData = { id: 1, name: 'First' };
    const secondData = { id: 2, name: 'Second' };
    
    const { result } = renderHook(() => useLazyFetch());
    const [fetchFunction] = result.current;

    // First fetch
    mockFetch(firstData);
    await act(async () => {
      await fetchFunction(testUrl);
    });

    let [, state] = result.current;
    expect(state.data).toEqual(firstData);

    // Second fetch
    mockFetch(secondData);
    await act(async () => {
      await fetchFunction(testUrl);
    });

    [, state] = result.current;
    expect(state.data).toEqual(secondData);
  });

  it('should handle non-JSON response errors', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.reject(new Error('Invalid JSON')),
    });

    const { result } = renderHook(() => useLazyFetch());
    const [fetchFunction] = result.current;

    await act(async () => {
      await fetchFunction(testUrl);
    });

    const [, state] = result.current;
    expect(state.error).toBeDefined();
    expect(state.error.message).toBe('Invalid JSON');
    expect(state.data).toBeNull();
  });
}); 