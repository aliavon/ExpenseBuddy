import React from 'react';
import {render, screen} from '@testing-library/react';
import {
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
} from '../test-hooks-utils';

// Mock Apollo Client
jest.mock('@apollo/client/testing', () => ({
  MockedProvider: ({children, mocks, ...props}) => (
    <div data-testid="mocked-provider" data-mocks={JSON.stringify(mocks)} {...props}>
      {children}
    </div>
  ),
}));

describe('Test Hooks Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear any global.fetch mocks
    if (global.fetch) {
      global.fetch.mockClear?.();
    }
  });

  describe('createMockProvider', () => {
    it('creates a mock provider with default options', () => {
      const MockProvider = createMockProvider();
      render(
        <MockProvider>
          <div>Test Child</div>
        </MockProvider>
      );
      
      // Check that the child is rendered (indicating the provider works)
      expect(screen.getByText('Test Child')).toBeInTheDocument();
    });

    it('creates a mock provider with custom mocks and options', () => {
      const mocks = [{request: {query: 'test'}}];
      const options = {addTypename: true, customOption: 'test'};
      
      const MockProvider = createMockProvider(mocks, options);
      render(
        <MockProvider>
          <div>Test Child</div>
        </MockProvider>
      );
      
      // Check that the child is rendered with custom provider
      expect(screen.getByText('Test Child')).toBeInTheDocument();
    });
  });

  describe('createMockError', () => {
    it('creates a mock error with default code', () => {
      const error = createMockError('Test error message');
      
      expect(error).toEqual({
        message: 'Test error message',
        extensions: {code: 'GENERIC_ERROR'},
      });
    });

    it('creates a mock error with custom code', () => {
      const error = createMockError('Custom error', 'CUSTOM_CODE');
      
      expect(error).toEqual({
        message: 'Custom error',
        extensions: {code: 'CUSTOM_CODE'},
      });
    });
  });

  describe('createNetworkError', () => {
    it('creates a network error with default message', () => {
      const networkError = createNetworkError();
      
      expect(networkError).toEqual({
        networkError: new Error('Network error'),
      });
    });

    it('creates a network error with custom message', () => {
      const networkError = createNetworkError('Custom network error');
      
      expect(networkError).toEqual({
        networkError: new Error('Custom network error'),
      });
    });
  });

  describe('createLoadingMock', () => {
    it('creates a loading mock with default delay', () => {
      const request = {query: 'test'};
      const result = {data: {test: 'data'}};
      const mock = createLoadingMock(request, result);
      
      expect(mock).toEqual({
        query: 'test',
        delay: 100,
        result: {data: {test: 'data'}},
      });
    });

    it('creates a loading mock with custom delay', () => {
      const request = {query: 'test'};
      const result = {data: {test: 'data'}};
      const mock = createLoadingMock(request, result, 500);
      
      expect(mock).toEqual({
        query: 'test',
        delay: 500,
        result: {data: {test: 'data'}},
      });
    });
  });

  describe('createErrorMock', () => {
    it('creates an error mock', () => {
      const request = {query: 'test'};
      const errorMessage = 'Test error';
      const mock = createErrorMock(request, errorMessage);
      
      expect(mock).toEqual({
        query: 'test',
        error: new Error('Test error'),
      });
    });
  });

  describe('Mock data generators', () => {
    it('generateMockMoneyBundle generates with defaults', () => {
      const mockBundle = generateMockMoneyBundle();
      
      expect(mockBundle).toEqual({
        id: '1',
        currency: 'USD',
        description: 'Test bundle',
        amount: 1000,
        storage: 'Bank',
        type: 'income',
        createdAt: '2023-01-01T10:00:00Z',
        updatedAt: '2023-01-01T10:00:00Z',
        deletedAt: null,
      });
    });

    it('generateMockMoneyBundle accepts overrides', () => {
      const overrides = {id: '2', amount: 2000, currency: 'EUR'};
      const mockBundle = generateMockMoneyBundle(overrides);
      
      expect(mockBundle).toEqual(expect.objectContaining(overrides));
      expect(mockBundle.description).toBe('Test bundle'); // Should keep default
    });

    it('generateMockFeed generates with defaults', () => {
      const mockFeed = generateMockFeed();
      
      expect(mockFeed).toEqual({
        id: '1',
        createdAt: '2023-01-01T10:00:00Z',
        to: 'Bank',
        from: 'Wallet',
        transferredTo: null,
      });
    });

    it('generateMockFeed accepts overrides', () => {
      const overrides = {id: '2', to: 'Savings'};
      const mockFeed = generateMockFeed(overrides);
      
      expect(mockFeed).toEqual(expect.objectContaining(overrides));
    });

    it('generateMockSummary generates with defaults', () => {
      const mockSummary = generateMockSummary();
      
      expect(mockSummary).toEqual({
        amount: 5000,
        currency: 'USD',
      });
    });

    it('generateMockType generates with defaults', () => {
      const mockType = generateMockType();
      
      expect(mockType).toEqual({
        id: '1',
        label: 'Income',
      });
    });
  });

  describe('waitForAsync', () => {
    it('waits for specified time', async () => {
      const start = Date.now();
      await waitForAsync(100);
      const end = Date.now();
      
      expect(end - start).toBeGreaterThanOrEqual(95); // Allow some variance
    });

    it('waits for 0ms by default', async () => {
      const start = Date.now();
      await waitForAsync();
      const end = Date.now();
      
      expect(end - start).toBeLessThan(50); // Should be very fast
    });
  });

  describe('createMultipleMocks', () => {
    it('creates multiple mocks from base request and results', () => {
      const baseRequest = {query: 'test'};
      const results = [{data: 'first'}, {data: 'second'}];
      
      const mocks = createMultipleMocks(baseRequest, results);
      
      expect(mocks).toEqual([
        {request: {query: 'test'}, result: {data: {data: 'first'}}},
        {request: {query: 'test'}, result: {data: {data: 'second'}}},
      ]);
    });
  });

  describe('mockGraphQLRequest', () => {
    it('creates a GraphQL request mock', () => {
      const query = 'test query';
      const variables = {id: '1'};
      
      const mock = mockGraphQLRequest(query, variables);
      
      expect(mock).toEqual({
        request: {
          query: expect.any(Object),
          variables: {id: '1'},
        },
      });
    });

    it('creates a GraphQL request mock with empty variables', () => {
      const query = 'test query';
      
      const mock = mockGraphQLRequest(query);
      
      expect(mock).toEqual({
        request: {
          query: expect.any(Object),
          variables: {},
        },
      });
    });
  });

  describe('mockFetch', () => {
    it('mocks fetch with successful response', () => {
      const response = {data: 'test'};
      const mockFn = mockFetch(response);
      
      expect(global.fetch).toBe(mockFn);
      expect(global.fetch).toHaveBeenCalledTimes(0);
    });

    it('mocks fetch with custom options', () => {
      const response = {data: 'test'};
      const options = {status: 201, ok: true};
      
      mockFetch(response, options);
      
      expect(global.fetch).toBeDefined();
    });
  });

  describe('mockFetchError', () => {
    it('mocks fetch to reject with error', () => {
      const error = new Error('Fetch failed');
      const mockFn = mockFetchError(error);
      
      expect(global.fetch).toBe(mockFn);
      expect(global.fetch).toHaveBeenCalledTimes(0);
    });
  });

  describe('constants', () => {
    it('TEST_CONSTANTS contains expected values', () => {
      expect(TEST_CONSTANTS.CURRENCIES).toEqual(['USD', 'EUR', 'GBP', 'JPY']);
      expect(TEST_CONSTANTS.STORAGE_TYPES).toEqual(['Bank', 'Cash', 'Investment', 'Savings']);
      expect(TEST_CONSTANTS.BUNDLE_TYPES).toEqual(['income', 'expense', 'transfer']);
      expect(TEST_CONSTANTS.SAMPLE_AMOUNTS).toEqual([0, 100, 1000, 999999999]);
      expect(TEST_CONSTANTS.TEST_URLS).toEqual([
        'https://api.test.com/data',
        'https://api.test.com/users',
      ]);
    });

    it('ERROR_MESSAGES contains expected values', () => {
      expect(ERROR_MESSAGES.NETWORK_ERROR).toBe('Network connection failed');
      expect(ERROR_MESSAGES.VALIDATION_ERROR).toBe('Validation failed');
      expect(ERROR_MESSAGES.PERMISSION_DENIED).toBe('Permission denied');
      expect(ERROR_MESSAGES.NOT_FOUND).toBe('Resource not found');
      expect(ERROR_MESSAGES.SERVER_ERROR).toBe('Internal server error');
      expect(ERROR_MESSAGES.FETCH_ERROR).toBe('Failed to fetch');
    });
  });

  describe('expectation helpers', () => {
    it('expectLoadingState checks loading state correctly', () => {
      const result = {current: {loading: true, error: undefined}};
      expect(() => expectLoadingState(result)).not.toThrow();
    });

    it('expectSuccessState checks success state correctly', () => {
      const result = {current: {loading: false, error: undefined, data: 'test'}};
      const expectedData = {data: 'test'};
      expect(() => expectSuccessState(result, expectedData)).not.toThrow();
    });

    it('expectSuccessState works without expected data', () => {
      const result = {current: {loading: false, error: undefined}};
      expect(() => expectSuccessState(result)).not.toThrow();
    });

    it('expectErrorState checks error state correctly', () => {
      const state = {loading: false, error: {message: 'Test error'}};
      expect(() => expectErrorState(state, 'Test error')).not.toThrow();
    });

    it('expectErrorState works without error message check', () => {
      const state = {loading: false, error: {message: 'Test error'}};
      expect(() => expectErrorState(state)).not.toThrow();
    });

    it('expectMutationFunction checks mutation function exists', () => {
      const result = {current: {createMutation: jest.fn()}};
      expect(() => expectMutationFunction(result, 'createMutation')).not.toThrow();
    });

    it('expectEmptyDataState checks empty data state correctly', () => {
      const result = {current: {loading: false, error: undefined, items: []}};
      expect(() => expectEmptyDataState(result, 'items')).not.toThrow();
    });

    it('expectFetchResponse checks fetch response correctly', () => {
      const state = {loading: false, error: null, data: {test: 'data'}};
      const expectedData = {test: 'data'};
      expect(() => expectFetchResponse(state, expectedData)).not.toThrow();
    });
  });
}); 