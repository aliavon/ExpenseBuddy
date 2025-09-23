// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  removeItem: jest.fn()
};
Object.defineProperty(global, 'localStorage', { value: mockLocalStorage });

// Mock window.location
const mockLocation = {
  pathname: '/dashboard',
  href: ''
};
Object.defineProperty(global, 'window', {
  value: { location: mockLocation }
});

// Mock console
global.console = {
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn()
};

// Mock setTimeout
global.setTimeout = jest.fn((fn) => fn());

// Mock navigator
global.navigator = {
  onLine: true
};

// Mock baseui/toast
jest.mock('baseui/toast', () => ({
  toaster: {
    negative: jest.fn(),
    warning: jest.fn()
  }
}));

import { toaster } from 'baseui/toast';
import { 
  authContextFn, 
  setGlobalLogout, 
  getGlobalLogout, 
  handleAuthError, 
  errorHandlerFn 
} from '../authLink';

describe('authLink', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
    toaster.negative.mockClear();
    toaster.warning.mockClear();
    console.error.mockClear();
    console.warn.mockClear();
    console.log.mockClear();
    global.setTimeout.mockClear();
    
    mockLocation.pathname = '/dashboard';
    mockLocation.href = '';
    
    // Reset global logout function
    setGlobalLogout(null);
  });

  describe('setGlobalLogout and getGlobalLogout', () => {
    it('should store and retrieve logout function', () => {
      const mockLogout = jest.fn();
      setGlobalLogout(mockLogout);
      
      expect(getGlobalLogout()).toBe(mockLogout);
    });

    it('should start with null logout function', () => {
      expect(getGlobalLogout()).toBeNull();
    });

    it('should allow overriding logout function', () => {
      const firstLogout = jest.fn();
      const secondLogout = jest.fn();
      
      setGlobalLogout(firstLogout);
      expect(getGlobalLogout()).toBe(firstLogout);
      
      setGlobalLogout(secondLogout);
      expect(getGlobalLogout()).toBe(secondLogout);
    });
  });

  describe('authContextFn', () => {
    it('should add Bearer token when accessToken exists', () => {
      mockLocalStorage.getItem.mockReturnValue('test-token-123');
      
      const result = authContextFn(undefined, { headers: { 'Content-Type': 'application/json' } });
      
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('accessToken');
      expect(result).toEqual({
        headers: {
          'Content-Type': 'application/json',
          authorization: 'Bearer test-token-123'
        }
      });
    });

    it('should not add authorization header when no token exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const result = authContextFn(undefined, { headers: { 'Content-Type': 'application/json' } });
      
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('accessToken');
      expect(result).toEqual({
        headers: {
          'Content-Type': 'application/json'
        }
      });
    });

    it('should handle empty headers object', () => {
      mockLocalStorage.getItem.mockReturnValue('token-456');
      
      const result = authContextFn(undefined, { headers: {} });
      
      expect(result).toEqual({
        headers: {
          authorization: 'Bearer token-456'
        }
      });
    });

    it('should handle missing headers completely', () => {
      mockLocalStorage.getItem.mockReturnValue('token-789');
      
      const result = authContextFn(undefined, {});
      
      expect(result).toEqual({
        headers: {
          authorization: 'Bearer token-789'
        }
      });
    });

    it('should handle empty string token', () => {
      mockLocalStorage.getItem.mockReturnValue('');
      
      const result = authContextFn(undefined, { headers: { 'X-Test': 'value' } });
      
      expect(result).toEqual({
        headers: {
          'X-Test': 'value'
        }
      });
    });

    it('should handle falsy token values', () => {
      mockLocalStorage.getItem.mockReturnValue(undefined);
      
      const result = authContextFn(undefined, { headers: { 'X-Test': 'value' } });
      
      expect(result).toEqual({
        headers: {
          'X-Test': 'value'
        }
      });
    });
  });

  describe('handleAuthError', () => {
    it('should clear tokens and call logout function successfully', () => {
      const mockLogout = jest.fn();
      setGlobalLogout(mockLogout);
      
      handleAuthError();
      
      expect(console.log).toHaveBeenCalledWith('Handling authentication error...');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('accessToken');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refreshToken');
      expect(mockLogout).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('Called global logout function');
    });

    it('should handle logout function error gracefully', () => {
      const mockLogout = jest.fn(() => { throw new Error('Logout failed'); });
      setGlobalLogout(mockLogout);
      
      handleAuthError();
      
      expect(mockLogout).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith('Error calling global logout:', expect.any(Error));
    });

    it('should handle missing global logout function', () => {
      setGlobalLogout(null);
      
      handleAuthError();
      
      expect(console.log).toHaveBeenCalledWith('Handling authentication error...');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('accessToken');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refreshToken');
      expect(console.log).not.toHaveBeenCalledWith('Called global logout function');
    });

    it('should redirect from non-auth page', () => {
      mockLocation.pathname = '/dashboard';
      
      handleAuthError();
      
      expect(console.log).toHaveBeenCalledWith('Redirecting to login...');
      expect(global.setTimeout).toHaveBeenCalledWith(expect.any(Function), 1000);
    });

    it('should NOT redirect from /login page', () => {
      mockLocation.pathname = '/login';
      
      handleAuthError();
      
      expect(console.log).not.toHaveBeenCalledWith('Redirecting to login...');
      expect(global.setTimeout).not.toHaveBeenCalled();
    });

    it('should NOT redirect from /register page', () => {
      mockLocation.pathname = '/register';
      
      handleAuthError();
      
      expect(global.setTimeout).not.toHaveBeenCalled();
    });

    it('should NOT redirect from /auth/reset-password page', () => {
      mockLocation.pathname = '/auth/reset-password';
      
      handleAuthError();
      
      expect(global.setTimeout).not.toHaveBeenCalled();
    });

    it('should NOT redirect from /auth/verify-email page', () => {
      mockLocation.pathname = '/auth/verify-email';
      
      handleAuthError();
      
      expect(global.setTimeout).not.toHaveBeenCalled();
    });

    it('should NOT redirect from /auth/confirm-email-change page', () => {
      mockLocation.pathname = '/auth/confirm-email-change';
      
      handleAuthError();
      
      expect(global.setTimeout).not.toHaveBeenCalled();
    });

    it('should redirect from nested path not starting with auth paths', () => {
      mockLocation.pathname = '/dashboard/profile';
      
      handleAuthError();
      
      expect(console.log).toHaveBeenCalledWith('Redirecting to login...');
      expect(global.setTimeout).toHaveBeenCalledWith(expect.any(Function), 1000);
    });

    it('should verify setTimeout callback sets window.location.href', () => {
      mockLocation.pathname = '/protected';
      mockLocation.href = '';
      
      handleAuthError();
      
      // Get the setTimeout callback and execute it
      const setTimeoutCallback = global.setTimeout.mock.calls[0][0];
      setTimeoutCallback();
      
      expect(mockLocation.href).toBe('/login');
    });
  });

  describe('errorHandlerFn - GraphQL Errors', () => {
    it('should handle UNAUTHENTICATED error', () => {
      const mockLogout = jest.fn();
      setGlobalLogout(mockLogout);
      
      errorHandlerFn({ 
        graphQLErrors: [{
          message: 'Authentication required',
          locations: ['line 1'],
          path: ['user'],
          extensions: { code: 'UNAUTHENTICATED' }
        }], 
        operation: { operationName: 'GetUser' } 
      });
      
      expect(console.error).toHaveBeenCalledWith(
        '[GraphQL error]: Message: Authentication required, Location: line 1, Path: user, Operation: GetUser'
      );
      expect(console.warn).toHaveBeenCalledWith('Authentication error - user needs to login');
      expect(toaster.negative).toHaveBeenCalledWith(
        'Authentication required. Please log in again.',
        { autoHideDuration: 6000 }
      );
      expect(mockLogout).toHaveBeenCalled(); // handleAuthError called
    });

    it('should handle FORBIDDEN error', () => {
      errorHandlerFn({ 
        graphQLErrors: [{
          message: 'Access denied',
          locations: ['line 5'],
          path: ['adminData'],
          extensions: { code: 'FORBIDDEN' }
        }], 
        operation: { operationName: 'GetAdminData' } 
      });
      
      expect(console.error).toHaveBeenCalledWith(
        '[GraphQL error]: Message: Access denied, Location: line 5, Path: adminData, Operation: GetAdminData'
      );
      expect(console.warn).toHaveBeenCalledWith('Authorization error - insufficient permissions');
      expect(toaster.negative).toHaveBeenCalledWith(
        "Access denied. You don't have permission for this action.",
        { autoHideDuration: 5000 }
      );
    });

    // Test all GraphQL error types
    it('should handle all GraphQL error types', () => {
      // VALIDATION_ERROR
      errorHandlerFn({ 
        graphQLErrors: [{
          message: 'Invalid email format',
          extensions: { code: 'VALIDATION_ERROR' }
        }], 
        operation: { operationName: 'UpdateProfile' } 
      });
      expect(console.warn).toHaveBeenCalledWith('Validation error:', 'Invalid email format');
      
      // RATE_LIMITED
      errorHandlerFn({ 
        graphQLErrors: [{
          message: 'Too many requests',
          extensions: { code: 'RATE_LIMITED' }
        }], 
        operation: { operationName: 'SendMessage' } 
      });
      expect(console.warn).toHaveBeenCalledWith('Rate limit exceeded');
      expect(toaster.warning).toHaveBeenCalledWith(
        'Too many requests. Please wait a moment before trying again.',
        { autoHideDuration: 6000 }
      );
      
      // EMAIL_CHANGE_REQUEST_FAILED
      errorHandlerFn({ 
        graphQLErrors: [{
          message: 'Email change failed',
          extensions: { code: 'EMAIL_CHANGE_REQUEST_FAILED' }
        }], 
        operation: { operationName: 'ChangeEmail' } 
      });
      expect(console.warn).toHaveBeenCalledWith('Authentication operation failed:', 'Email change failed');
      
      // EMAIL_CHANGE_CONFIRMATION_FAILED with null message (covers line 140)
      errorHandlerFn({ 
        graphQLErrors: [{
          message: null,
          extensions: { code: 'EMAIL_CHANGE_CONFIRMATION_FAILED' }
        }], 
        operation: { operationName: 'ConfirmEmail' } 
      });
      expect(toaster.negative).toHaveBeenCalledWith(
        'Authentication operation failed. Please try again.',
        { autoHideDuration: 6000 }
      );
      
      // FAMILY_OPERATION_FAILED
      errorHandlerFn({ 
        graphQLErrors: [{
          message: 'Failed to add family member',
          extensions: { code: 'FAMILY_OPERATION_FAILED' }
        }], 
        operation: { operationName: 'AddFamilyMember' } 
      });
      expect(console.warn).toHaveBeenCalledWith('Family operation failed:', 'Failed to add family member');
      
      // INTERNAL_SERVER_ERROR
      errorHandlerFn({ 
        graphQLErrors: [{
          message: 'Database error',
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        }], 
        operation: { operationName: 'GetData' } 
      });
      expect(console.error).toHaveBeenCalledWith('Server error:', 'Database error');
    });

    it('should handle default case and message filtering', () => {
      // Normal unknown error
      errorHandlerFn({ 
        graphQLErrors: [{
          message: 'Unknown error occurred',
          extensions: { code: 'UNKNOWN_CODE' }
        }], 
        operation: { operationName: 'UnknownOp' } 
      });
      expect(console.warn).toHaveBeenCalledWith('Unhandled GraphQL error:', 'Unknown error occurred');
      expect(toaster.negative).toHaveBeenCalledWith('Unknown error occurred', { autoHideDuration: 4000 });
      
      // Long message truncation
      toaster.negative.mockClear();
      const longMessage = 'A'.repeat(150);
      errorHandlerFn({ 
        graphQLErrors: [{
          message: longMessage,
          extensions: { code: 'UNKNOWN_CODE' }
        }], 
        operation: { operationName: 'LongError' } 
      });
      expect(toaster.negative).toHaveBeenCalledWith('An error occurred. Please try again.', { autoHideDuration: 4000 });
      
      // Skip toast for duplicate errors
      toaster.negative.mockClear();
      errorHandlerFn({ 
        graphQLErrors: [{
          message: 'duplicate key value violates unique constraint',
          extensions: { code: 'UNKNOWN_CODE' }
        }], 
        operation: { operationName: 'DuplicateError' } 
      });
      expect(toaster.negative).not.toHaveBeenCalled();
      
      // Skip toast for not found errors
      errorHandlerFn({ 
        graphQLErrors: [{
          message: 'User not found in database',
          extensions: { code: 'UNKNOWN_CODE' }
        }], 
        operation: { operationName: 'NotFoundError' } 
      });
      expect(toaster.negative).not.toHaveBeenCalled();
    });

    it('should handle null/empty messages and multiple errors', () => {
      // Null message with fallback
      errorHandlerFn({ 
        graphQLErrors: [{
          message: null,
          extensions: { code: 'FAMILY_OPERATION_FAILED' }
        }], 
        operation: { operationName: 'FamilyOp' } 
      });
      expect(toaster.negative).toHaveBeenCalledWith('Family operation failed. Please try again.', { autoHideDuration: 5000 });
      
      // Multiple errors
      errorHandlerFn({ 
        graphQLErrors: [
          { message: 'First error', extensions: { code: 'VALIDATION_ERROR' } },
          { message: 'Second error', extensions: { code: 'FORBIDDEN' } }
        ], 
        operation: { operationName: 'MultipleErrors' } 
      });
      expect(console.warn).toHaveBeenCalledWith('Validation error:', 'First error');
      expect(console.warn).toHaveBeenCalledWith('Authorization error - insufficient permissions');
    });
  });

  describe('errorHandlerFn - Network Errors', () => {
    it('should handle all network error types', () => {
      const mockLogout = jest.fn();
      setGlobalLogout(mockLogout);
      
      // 401 network error
      errorHandlerFn({ networkError: { statusCode: 401 } });
      expect(console.warn).toHaveBeenCalledWith('Network authentication error (401)');
      expect(toaster.negative).toHaveBeenCalledWith('Session expired. Please log in again.', { autoHideDuration: 6000 });
      expect(mockLogout).toHaveBeenCalled();
      
      // 403 network error
      errorHandlerFn({ networkError: { statusCode: 403 } });
      expect(console.warn).toHaveBeenCalledWith('Network authorization error (403)');
      
      // 500+ server errors
      errorHandlerFn({ networkError: { statusCode: 502 } });
      expect(console.error).toHaveBeenCalledWith('Server error:', { statusCode: 502 });
      expect(toaster.negative).toHaveBeenCalledWith('Server error (502). Please try again later.', { autoHideDuration: 6000 });
      
      // NetworkError
      errorHandlerFn({ networkError: { name: 'NetworkError' } });
      expect(console.error).toHaveBeenCalledWith('Network connectivity error');
      expect(toaster.warning).toHaveBeenCalledWith(
        'Network connection lost. Please check your internet connection.',
        { autoHideDuration: 8000 }
      );
      
      // Generic network error
      errorHandlerFn({ networkError: { statusCode: 400 } });
      expect(console.error).toHaveBeenCalledWith('Unhandled network error:', { statusCode: 400 });
      expect(toaster.negative).toHaveBeenCalledWith('Connection error. Please try again.', { autoHideDuration: 4000 });
    });

    it('should handle offline status and no errors cases', () => {
      // Test with navigator.onLine = false
      Object.defineProperty(global.navigator, 'onLine', { value: false, configurable: true });
      errorHandlerFn({ networkError: { statusCode: 400 } });
      expect(console.error).toHaveBeenCalledWith('Network connectivity error');
      
      // Reset navigator.onLine
      Object.defineProperty(global.navigator, 'onLine', { value: true, configurable: true });
      
      // No errors case
      errorHandlerFn({ operation: { operationName: 'TestOp' } });
      // Should not crash or throw
    });
  });
});