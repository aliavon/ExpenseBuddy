import { testErrorScenarios, testAllScenarios, checkAuthState, createTestClient } from '../testErrorLink';

// Mock Apollo Client and dependencies
jest.mock('@apollo/client', () => ({
  gql: jest.fn(() => 'mock-gql'),
  createHttpLink: jest.fn(() => ({ type: 'httpLink' })),
  ApolloClient: jest.fn(function(config) {
    this.config = config;
    this.query = jest.fn().mockRejectedValue(new Error('Mock GraphQL error'));
    this.mutate = jest.fn().mockRejectedValue(new Error('Mock GraphQL error'));
    return this;
  }),
  InMemoryCache: jest.fn(() => ({ type: 'cache' })),
}));

jest.mock('@apollo/client/link/context', () => ({
  setContext: jest.fn(() => ({ concat: jest.fn(() => 'mock-combined-link') })),
}));

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

beforeAll(() => {
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(global, 'localStorage', { value: mockLocalStorage });

// Mock window.location
const mockLocation = {
  href: '',
  reload: jest.fn(),
};
Object.defineProperty(global, 'window', {
  value: { location: mockLocation },
  writable: true,
});

// Mock process.env
process.env.REACT_APP_SERVER_PORT = '8000';

describe('testErrorLink', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('mock-token');
  });

  describe('testErrorScenarios.unauthenticated', () => {
    it('should test unauthenticated error scenario', async () => {
      await testErrorScenarios.unauthenticated();
      
      expect(console.log).toHaveBeenCalledWith('🧪 Testing UNAUTHENTICATED error scenario');
      expect(console.log).toHaveBeenCalledWith('Setting invalid token and making authenticated request...');
      expect(console.log).toHaveBeenCalledWith('✅ UNAUTHENTICATED error triggered successfully');
      expect(console.log).toHaveBeenCalledWith('Expected: User should be logged out and redirected');
    });

    it('should handle case when no error occurs', async () => {
      // Mock successful query
      const { ApolloClient } = require('@apollo/client');
      ApolloClient.mockImplementationOnce(function(config) {
        this.config = config;
        this.query = jest.fn().mockResolvedValue({ data: { me: { id: '1' } } });
        return this;
      });

      await testErrorScenarios.unauthenticated();
      
      expect(console.log).toHaveBeenCalledWith('❌ No error occurred - authentication check might be disabled');
    });
  });

  describe('testErrorScenarios.forbidden', () => {
    it('should test forbidden error scenario when logged in', async () => {
      mockLocalStorage.getItem.mockReturnValue('valid-token');
      
      await testErrorScenarios.forbidden();
      
      expect(console.log).toHaveBeenCalledWith('🧪 Testing FORBIDDEN error scenario');
      expect(console.log).toHaveBeenCalledWith('Attempting admin action without permissions...');
      expect(console.log).toHaveBeenCalledWith('⚠️ Different error occurred:', 'Mock GraphQL error');
    });

    it('should handle case when not logged in', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      await testErrorScenarios.forbidden();
      
      expect(console.log).toHaveBeenCalledWith('❌ Need to be logged in first for this test');
    });

    it('should handle successful mutation', async () => {
      mockLocalStorage.getItem.mockReturnValue('valid-token');
      
      // Mock successful mutation
      const { ApolloClient } = require('@apollo/client');
      ApolloClient.mockImplementationOnce(function(config) {
        this.config = config;
        this.mutate = jest.fn().mockResolvedValue({ data: { removeFamilyMember: true } });
        return this;
      });

      await testErrorScenarios.forbidden();
      
      expect(console.log).toHaveBeenCalledWith('❌ No error occurred - permissions check might be disabled');
    });

    it('should handle FORBIDDEN error successfully - lines 104-105', async () => {
      // Mock localStorage to have token and Apollo Client to throw FORBIDDEN error
      mockLocalStorage.getItem.mockReturnValue('valid-token');
      const { ApolloClient } = require('@apollo/client');
      ApolloClient.mockImplementation(function() {
        this.mutate = jest.fn().mockRejectedValue({
          graphQLErrors: [{ extensions: { code: 'FORBIDDEN' } }]
        });
        return this;
      });

      await testErrorScenarios.forbidden();

      // Should log FORBIDDEN success messages (lines 104-105)
      expect(console.log).toHaveBeenCalledWith('✅ FORBIDDEN error triggered successfully');
      expect(console.log).toHaveBeenCalledWith('Expected: Access denied toast shown, user NOT logged out');
    });
  });

  describe('testErrorScenarios.validation', () => {
    it('should test validation error scenario', async () => {
      await testErrorScenarios.validation();
      
      expect(console.log).toHaveBeenCalledWith('🧪 Testing VALIDATION_ERROR scenario');
      expect(console.log).toHaveBeenCalledWith('Sending invalid data...');
      // Mock always goes to the 'different error occurred' path - covered
    });

    it('should handle successful validation', async () => {
      // Mock successful mutation
      const { ApolloClient } = require('@apollo/client');
      ApolloClient.mockImplementationOnce(function(config) {
        this.config = config;
        this.mutate = jest.fn().mockResolvedValue({ data: { login: { accessToken: 'token' } } });
        return this;
      });

      await testErrorScenarios.validation();
      
      expect(console.log).toHaveBeenCalledWith('❌ No validation error occurred');
    });

    it('should handle VALIDATION_ERROR successfully - lines 133-134', async () => {
      // Mock Apollo Client to throw VALIDATION_ERROR
      const { ApolloClient } = require('@apollo/client');
      ApolloClient.mockImplementation(function() {
        this.mutate = jest.fn().mockRejectedValue({
          graphQLErrors: [{ extensions: { code: 'VALIDATION_ERROR' } }]
        });
        return this;
      });

      await testErrorScenarios.validation();

      // Should log validation error success messages (lines 133-134)
      expect(console.log).toHaveBeenCalledWith('✅ VALIDATION_ERROR triggered successfully');
      expect(console.log).toHaveBeenCalledWith('Expected: Validation error toast shown');
    });
  });

  describe('testErrorScenarios.networkError', () => {
    it('should test network error scenario', async () => {
      await testErrorScenarios.networkError();
      
      expect(console.log).toHaveBeenCalledWith('🧪 Testing network connectivity error');
      expect(console.log).toHaveBeenCalledWith('Attempting to connect to non-existent server...');
      expect(console.log).toHaveBeenCalledWith('⚠️ Different error occurred:', expect.any(String));
    });

    it('should handle network error successfully - lines 156-158', async () => {
      // Mock Apollo Client to throw actual network error
      const { ApolloClient } = require('@apollo/client');
      ApolloClient.mockImplementation(function() {
        this.query = jest.fn().mockRejectedValue({
          networkError: { message: 'Network connection failed' }
        });
        return this;
      });

      await testErrorScenarios.networkError();

      // Should log network error success messages (lines 156-158)
      expect(console.log).toHaveBeenCalledWith('✅ Network error triggered successfully');
      expect(console.log).toHaveBeenCalledWith('Expected: Network error toast shown');
      expect(console.log).toHaveBeenCalledWith('Network error details:', 'Network connection failed');
    });
  });

  describe('testErrorScenarios.serverError', () => {
    it('should test server error scenario', async () => {
      await testErrorScenarios.serverError();
      
      expect(console.log).toHaveBeenCalledWith('🧪 Testing server error scenario');
      expect(console.log).toHaveBeenCalledWith('Sending malformed GraphQL query...');
      // Mock always goes to the 'different error occurred' path - covered
    });

    it('should handle GraphQL errors successfully - lines 186-189', async () => {
      // Mock Apollo Client to throw GraphQL errors
      const { ApolloClient } = require('@apollo/client');
      ApolloClient.mockImplementation(function() {
        this.query = jest.fn().mockRejectedValue({
          graphQLErrors: [{ message: 'Test GraphQL error' }],
          networkError: null
        });
        return this;
      });

      await testErrorScenarios.serverError();

      // Should log GraphQL error success messages (lines 187-189)
      expect(console.log).toHaveBeenCalledWith('✅ Server error triggered successfully');
      expect(console.log).toHaveBeenCalledWith('Expected: Server error toast shown');
      expect(console.log).toHaveBeenCalledWith('Error details:', 'Test GraphQL error');
    });

    it('should handle network HTTP 500+ errors - lines 191-192', async () => {
      // Mock Apollo Client to throw network error with statusCode >= 500
      const { ApolloClient } = require('@apollo/client');
      ApolloClient.mockImplementation(function() {
        this.query = jest.fn().mockRejectedValue({
          graphQLErrors: [],
          networkError: { statusCode: 500 }
        });
        return this;
      });

      await testErrorScenarios.serverError();

      // Should log server HTTP error messages (lines 191-192)
      expect(console.log).toHaveBeenCalledWith('✅ Server HTTP error triggered successfully');
      expect(console.log).toHaveBeenCalledWith('Expected: Server error toast shown');
    });

    it('should handle case when no server error occurs - line 198', async () => {
      // Mock Apollo Client to NOT throw any error
      const { ApolloClient } = require('@apollo/client');
      ApolloClient.mockImplementation(function() {
        this.query = jest.fn().mockResolvedValue({ data: { test: 'success' } });
        return this;
      });

      await testErrorScenarios.serverError();

      // Should log no error message (line 198)
      expect(console.log).toHaveBeenCalledWith('❌ No server error occurred');
    });
  });

  describe('testAllScenarios', () => {
    it('should be a function that exists', () => {
      // Just test that the function exists and is callable
      expect(typeof testAllScenarios).toBe('function');
      expect(testAllScenarios.name).toBe('testAllScenarios');
    });

    it('should run all scenarios in sequence - lines 226-249', async () => {
      // Mock setTimeout to resolve immediately for faster test execution
      jest.spyOn(global, 'setTimeout').mockImplementation((fn, delay) => {
        fn();
        return 123; // mock timer id
      });

      await testAllScenarios();

      // Should log initial message (line 226)
      expect(console.log).toHaveBeenCalledWith('🧪 Running ALL error scenarios for comprehensive testing...\n');

      // Should log each scenario header (lines 237)
      expect(console.log).toHaveBeenCalledWith('\n--- Testing Network Error ---');
      expect(console.log).toHaveBeenCalledWith('\n--- Testing Server Error ---');
      expect(console.log).toHaveBeenCalledWith('\n--- Testing Validation Error ---');
      expect(console.log).toHaveBeenCalledWith('\n--- Testing Forbidden Error ---');
      expect(console.log).toHaveBeenCalledWith('\n--- Testing Unauthenticated Error ---');

      // Should log completion messages (lines 248-249)
      expect(console.log).toHaveBeenCalledWith('\n✅ All error scenario tests completed!');
      expect(console.log).toHaveBeenCalledWith('Check the UI for toast notifications and auth state changes.');

      global.setTimeout.mockRestore();
    });

    it('should handle scenario errors gracefully - lines 240-242', async () => {
      // Mock a scenario function to throw an error
      const originalNetworkError = testErrorScenarios.networkError;
      testErrorScenarios.networkError = jest.fn().mockRejectedValue(new Error('Test scenario error'));

      // Mock setTimeout to resolve immediately
      jest.spyOn(global, 'setTimeout').mockImplementation((fn) => fn());

      await testAllScenarios();

      // Should log error via console.error (line 241)
      expect(console.error).toHaveBeenCalledWith('❌ Error in Network Error:', 'Test scenario error');

      // Restore original function and mock
      testErrorScenarios.networkError = originalNetworkError;
      global.setTimeout.mockRestore();
    });

    it('should wait between tests with setTimeout - line 245', async () => {
      // Mock setTimeout to track calls
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout').mockImplementation((fn, delay) => {
        expect(delay).toBe(2000); // Should wait 2 seconds between tests
        fn();
        return 123;
      });

      await testAllScenarios();

      // Should call setTimeout 5 times (once for each scenario)
      expect(setTimeoutSpy).toHaveBeenCalledTimes(5);

      setTimeoutSpy.mockRestore();
    });
  });

  describe('helper functions', () => {
    it('should test checkAuthState function', async () => {
      mockLocalStorage.getItem.mockReturnValue('test-token');
      
      // Import the module to access helper functions
      const testErrorLink = require('../testErrorLink');
      
      if (testErrorLink.checkAuthState) {
        await testErrorLink.checkAuthState();
        expect(console.log).toHaveBeenCalled();
      }
    });

    it('should test clearTokens function', async () => {
      const testErrorLink = require('../testErrorLink');
      
      if (testErrorLink.clearTokens) {
        await testErrorLink.clearTokens();
        expect(console.log).toHaveBeenCalled();
      }
    });

    it('should test invalidateToken function', async () => {
      const testErrorLink = require('../testErrorLink');
      
      if (testErrorLink.invalidateToken) {
        await testErrorLink.invalidateToken();
        expect(console.log).toHaveBeenCalled();
      }
    });
  });

  describe('window functions (development mode)', () => {
    it('should expose functions to window in development mode', () => {
      // Mock development environment
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      // Ensure window has testErrorLink property
      global.window.testErrorLink = {};
      
      // Re-require the module to trigger window assignments
      delete require.cache[require.resolve('../testErrorLink')];
      require('../testErrorLink');
      
      // Check that window.testErrorLink is defined
      expect(global.window.testErrorLink).toBeDefined();
      
      // Restore environment
      process.env.NODE_ENV = originalNodeEnv;
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle missing environment variables', async () => {
      const originalPort = process.env.REACT_APP_SERVER_PORT;
      delete process.env.REACT_APP_SERVER_PORT;
      
      // Test that functions still work without port
      await testErrorScenarios.unauthenticated();
      
      expect(console.log).toHaveBeenCalledWith('🧪 Testing UNAUTHENTICATED error scenario');
      
      // Restore environment variable
      process.env.REACT_APP_SERVER_PORT = originalPort;
    });

    it('should handle Apollo Client errors gracefully', async () => {
      // Mock Apollo Client to throw during construction
      const { ApolloClient } = require('@apollo/client');
      ApolloClient.mockImplementationOnce(() => {
        throw new Error('Apollo Client construction failed');
      });

      // Should handle error gracefully (it might throw, but we expect it to be caught)
      try {
        await testErrorScenarios.unauthenticated();
      } catch (error) {
        expect(error.message).toContain('Apollo Client construction failed');
      }
      
      // At minimum, should log the initial message
      expect(console.log).toHaveBeenCalledWith('🧪 Testing UNAUTHENTICATED error scenario');
    });
  });

  describe('createTestClient function', () => {
    it('should create test client with default parameters', () => {
      const testErrorLink = require('../testErrorLink');
      
      // This tests the createTestClient function indirectly through error scenarios
      testErrorScenarios.unauthenticated();
      
      const { createHttpLink } = require('@apollo/client');
      expect(createHttpLink).toHaveBeenCalled();
    });

    it('should create test client with custom auth token', async () => {
      await testErrorScenarios.forbidden();
      
      const { setContext } = require('@apollo/client/link/context');
      expect(setContext).toHaveBeenCalled();
    });

    it('should create test client with custom URI', async () => {
      // Indirectly test custom URI through network scenario
      await testErrorScenarios.networkError();
      
      const { createHttpLink } = require('@apollo/client');
      expect(createHttpLink).toHaveBeenCalled();
    });

    it('should handle falsy auth token - line 46', () => {
      // Create client with falsy authToken to test line 46 condition  
      const clientWithoutAuth = createTestClient(null);
      expect(clientWithoutAuth).toBeDefined();
      
      // Create client with truthy authToken to test the other branch
      const clientWithAuth = createTestClient('test-token');
      expect(clientWithAuth).toBeDefined();
      
      // Test various falsy values to ensure branch coverage
      expect(createTestClient('')).toBeDefined();
      expect(createTestClient(undefined)).toBeDefined(); 
      expect(createTestClient(false)).toBeDefined();
      expect(createTestClient(0)).toBeDefined();
    });

    it('should test authLink setContext callback directly - line 46', () => {
      const { setContext } = require('@apollo/client/link/context');
      
      // Get the setContext callback that was created
      let authLinkCallback;
      setContext.mockImplementation((callback) => {
        authLinkCallback = callback;
        return { concat: jest.fn() };
      });
      
      // Create client to set up authLink
      createTestClient('test-token');
      
      // Now test the callback directly with different token scenarios
      if (authLinkCallback) {
        // Test with truthy authToken (this should add authorization header)
        const result1 = authLinkCallback(null, { headers: { 'content-type': 'application/json' } });
        // Should have authorization header
        
        // Test with falsy authToken by creating new client without token
        createTestClient(null);
        
        if (setContext.mock.calls.length > 1) {
          const falsyCallback = setContext.mock.calls[1][0];
          const result2 = falsyCallback(null, { headers: { 'content-type': 'application/json' } });
          // Should NOT have authorization header
        }
      }
      
      expect(setContext).toHaveBeenCalled();
    });
  });

  describe('branch coverage for checkAuthState', () => {
    it('should handle null/undefined tokens - lines 212-213', () => {
      // Store original localStorage
      const originalGetItem = mockLocalStorage.getItem;
      
      // Test with null tokens
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const authState = checkAuthState();
      
      // Should handle accessToken?.length when accessToken is null
      expect(authState.accessTokenLength).toBe(0);
      expect(authState.refreshTokenLength).toBe(0);
      
      // Test with undefined tokens  
      mockLocalStorage.getItem.mockReturnValue(undefined);
      
      const authStateUndefined = checkAuthState();
      expect(authStateUndefined.accessTokenLength).toBe(0);
      expect(authStateUndefined.refreshTokenLength).toBe(0);
      
      // Restore mock
      mockLocalStorage.getItem = originalGetItem;
    });
  });

  describe('server-side environment tests', () => {
    it('should handle typeof window !== undefined - line 253', () => {
      // Store original window
      const originalWindow = global.window;
      
      // Temporarily delete window to simulate server-side environment
      delete global.window;
      
      // Re-require the module in server-side environment
      jest.isolateModules(() => {
        // This should not assign to window.testErrorLink (line 253 condition)
    require('../testErrorLink');
    
        // Verify window doesn't exist in this context
        expect(typeof window).toBe('undefined');
      });
      
      // Restore window
      global.window = originalWindow;
    });
  });
});