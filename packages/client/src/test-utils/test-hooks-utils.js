import React from 'react';
import { MockedProvider } from '@apollo/client/testing';

// Common test utilities for hooks testing

export const createMockProvider = (mocks = [], options = {}) => {
  const defaultOptions = {
    addTypename: false,
    ...options,
  };

  return ({ children }) => (
    <MockedProvider
      mocks={mocks}
      {...defaultOptions}
    >
      {children}
    </MockedProvider>
  );
};

export const createMockError = (message, code = 'GENERIC_ERROR') => ({
  message,
  extensions: { code },
});

export const createNetworkError = (message = 'Network error') => ({ networkError: new Error(message) });

export const createLoadingMock = (request, result, delay = 100) => ({
  ...request,
  delay,
  result,
});

export const createErrorMock = (request, error) => ({
  ...request,
  error: new Error(error),
});

// Common mock data generators
export const generateMockMoneyBundle = (overrides = {}) => ({
  id: '1',
  currency: 'USD',
  description: 'Test bundle',
  amount: 1000,
  storage: 'Bank',
  type: 'income',
  createdAt: '2023-01-01T10:00:00Z',
  updatedAt: '2023-01-01T10:00:00Z',
  deletedAt: null,
  ...overrides,
});

export const generateMockFeed = (overrides = {}) => ({
  id: '1',
  createdAt: '2023-01-01T10:00:00Z',
  to: 'Bank',
  from: 'Wallet',
  transferredTo: null,
  ...overrides,
});

export const generateMockSummary = (overrides = {}) => ({
  amount: 5000,
  currency: 'USD',
  ...overrides,
});

export const generateMockType = (overrides = {}) => ({
  id: '1',
  label: 'Income',
  ...overrides,
});

// Helper to wait for async operations in tests
export const waitForAsync = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to create multiple mocks
export const createMultipleMocks = (baseRequest, results) => results.map(result => ({
  request: baseRequest,
  result: { data: result },
}));

// Mock GraphQL operations
export const mockGraphQLRequest = (query, variables = {}) => ({
  request: {
    query: expect.any(Object),
    variables,
  },
});

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

// Helper for testing loading states
export const expectLoadingState = result => {
  expect(result.current.loading).toBe(true);
  expect(result.current.error).toBeUndefined();
};

// Helper for testing success states
export const expectSuccessState = (result, expectedData) => {
  expect(result.current.loading).toBe(false);
  expect(result.current.error).toBeUndefined();
  if (expectedData) {
    expect(result.current).toEqual(expect.objectContaining(expectedData));
  }
};

// Helper for testing error states
export const expectErrorState = (state, errorMessage) => {
  expect(state.loading).toBe(false);
  expect(state.error).toBeDefined();
  if (errorMessage) {
    expect(state.error.message).toBe(errorMessage);
  }
};

// Helper for testing mutation functions
export const expectMutationFunction = (result, functionName) => {
  expect(typeof result.current[functionName]).toBe('function');
};

// Helper for testing empty data states
export const expectEmptyDataState = (result, dataProperty) => {
  expect(result.current.loading).toBe(false);
  expect(result.current.error).toBeUndefined();
  expect(result.current[dataProperty]).toEqual([]);
};

// Helper for testing fetch hooks
export const expectFetchResponse = (state, expectedData) => {
  expect(state.loading).toBe(false);
  expect(state.error).toBeNull();
  expect(state.data).toEqual(expectedData);
};

export default {
  createMockProvider,
  createMockError,
  createNetworkError,
  createLoadingMock,
  createErrorMock,
  generateMockMoneyBundle,
  generateMockFeed,
  generateMockSummary,
  generateMockType,
  waitForAsync,
  createMultipleMocks,
  mockGraphQLRequest,
  mockFetch,
  mockFetchError,
  TEST_CONSTANTS,
  ERROR_MESSAGES,
  expectLoadingState,
  expectSuccessState,
  expectErrorState,
  expectMutationFunction,
  expectEmptyDataState,
  expectFetchResponse,
};
