// Mock fetch for HTTP hooks
export const mockFetch = (response, options = {}) => {
  const mockResponse = {
    ok: true,
    status: 200,
    json: () => Promise.resolve(response),
    ...options,
  };

  global.fetch = jest.fn().mockResolvedValue(mockResponse);
  return global.fetch;
};

export const mockFetchError = error => {
  global.fetch = jest.fn().mockRejectedValue(error);
  return global.fetch;
};

// Helper to wait for async operations in tests
export const waitForAsync = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms));

// Helper for testing error states
export const expectErrorState = (state, errorMessage) => {
  expect(state.loading).toBe(false);
  expect(state.error).toBeDefined();
  if (errorMessage) {
    expect(state.error.message).toBe(errorMessage);
  }
};

// Helper for testing fetch hooks
export const expectFetchResponse = (state, expectedData) => {
  expect(state.loading).toBe(false);
  expect(state.error).toBeNull();
  expect(state.data).toEqual(expectedData);
};

// Test constants
export const TEST_CONSTANTS = {
  CURRENCIES: [
    'USD',
    'EUR',
    'GBP',
    'JPY',
  ],
  STORAGE_TYPES: [
    'Bank',
    'Cash',
    'Investment',
    'Savings',
  ],
  BUNDLE_TYPES: ['income', 'expense', 'transfer'],
  SAMPLE_AMOUNTS: [
    0,
    100,
    1000,
    999999999,
  ],
  TEST_URLS: ['https://api.test.com/data', 'https://api.test.com/users'],
};

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection failed',
  VALIDATION_ERROR: 'Validation failed',
  PERMISSION_DENIED: 'Permission denied',
  NOT_FOUND: 'Resource not found',
  SERVER_ERROR: 'Internal server error',
  FETCH_ERROR: 'Failed to fetch',
};
