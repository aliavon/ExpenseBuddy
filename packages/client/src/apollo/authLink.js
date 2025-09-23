import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { from } from '@apollo/client';
import { toaster } from 'baseui/toast';

/**
 * Auth context function for JWT token addition
 */
export const authContextFn = (_, { headers }) => {
  // Get token from localStorage
  const token = localStorage.getItem('accessToken');

  return {
    headers: {
      ...headers,
      // Add Authorization header if token exists
      ...(token && { authorization: `Bearer ${token}` }),
    },
  };
};

/**
 * Auth Link for automatic JWT token addition
 */
const authLink = setContext(authContextFn);

/**
 * Global logout function that can be called from errorLink
 * This will be set by AuthProvider when it initializes
 */
let globalLogoutFn = null;

// Export function to set logout callback
export const setGlobalLogout = logoutFn => {
  globalLogoutFn = logoutFn;
};

// Export function to get current logout callback (for testing)
export const getGlobalLogout = () => globalLogoutFn;

/**
 * Handle authentication errors by clearing tokens and redirecting
 */
export const handleAuthError = () => {
  console.log('Handling authentication error...');

  // Clear tokens from localStorage
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');

  // Call global logout function if available (cleaner than direct localStorage)
  if (globalLogoutFn) {
    try {
      globalLogoutFn();
      console.log('Called global logout function');
    } catch (error) {
      console.error('Error calling global logout:', error);
    }
  }

  // Redirect to login if not already there
  const currentPath = window.location.pathname;
  const authPaths = [
    '/login',
    '/register',
    '/auth/reset-password',
    '/auth/verify-email',
    '/auth/confirm-email-change',
  ];

  if (!authPaths.some(path => currentPath.startsWith(path))) {
    console.log('Redirecting to login...');

    // Add delay to allow toast to show
    setTimeout(() => {
      window.location.href = '/login';
    }, 1000);
  }
};

/**
 * Error handler function for GraphQL and network errors
 */
export const errorHandlerFn = ({ graphQLErrors, networkError, operation, _forward }) => {
  // Handle GraphQL errors
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path, extensions }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}, Operation: ${operation.operationName}`
      );

      // Handle different error types
      switch (extensions?.code) {
      case 'UNAUTHENTICATED':
        console.warn('Authentication error - user needs to login');

        toaster.negative(
          'Authentication required. Please log in again.',
          { autoHideDuration: 6000 }
        );

        handleAuthError();
        break;

      case 'FORBIDDEN':
        console.warn('Authorization error - insufficient permissions');

        toaster.negative(
          'Access denied. You don\'t have permission for this action.',
          { autoHideDuration: 5000 }
        );

        // Don't logout for forbidden errors, just show error
        break;

      case 'VALIDATION_ERROR':
        console.warn('Validation error:', message);

        toaster.negative(
          `Validation failed: ${message}`,
          { autoHideDuration: 4000 }
        );
        break;

      case 'RATE_LIMITED':
        console.warn('Rate limit exceeded');

        toaster.warning(
          'Too many requests. Please wait a moment before trying again.',
          { autoHideDuration: 6000 }
        );
        break;

      case 'EMAIL_CHANGE_REQUEST_FAILED':
      case 'EMAIL_CHANGE_CONFIRMATION_FAILED':
      case 'PASSWORD_RESET_FAILED':
        console.warn('Authentication operation failed:', message);

        toaster.negative(
          message || 'Authentication operation failed. Please try again.',
          { autoHideDuration: 6000 }
        );
        break;

      case 'FAMILY_OPERATION_FAILED':
        console.warn('Family operation failed:', message);

        toaster.negative(
          message || 'Family operation failed. Please try again.',
          { autoHideDuration: 5000 }
        );
        break;

      case 'INTERNAL_SERVER_ERROR':
        console.error('Server error:', message);

        toaster.negative(
          'Server error. Please try again later.',
          { autoHideDuration: 5000 }
        );
        break;

      default:
        // Generic error handling for unknown error codes
        console.warn('Unhandled GraphQL error:', message);

        // Only show toast for non-trivial errors
        if (message && !message.includes('duplicate') && !message.includes('not found')) {
          toaster.negative(
            message.length > 100 ? 'An error occurred. Please try again.' : message,
            { autoHideDuration: 4000 }
          );
        }
        break;
      }
    });
  }

  // Handle network errors
  if (networkError) {
    console.error('[Network error]:', networkError);

    // Handle specific HTTP status codes
    if (networkError.statusCode === 401) {
      console.warn('Network authentication error (401)');

      toaster.negative(
        'Session expired. Please log in again.',
        { autoHideDuration: 6000 }
      );

      handleAuthError();
    } else if (networkError.statusCode === 403) {
      console.warn('Network authorization error (403)');

      toaster.negative(
        'Access denied. You don\'t have permission for this action.',
        { autoHideDuration: 5000 }
      );
    } else if (networkError.statusCode >= 500) {
      console.error('Server error:', networkError);

      toaster.negative(
        `Server error (${networkError.statusCode}). Please try again later.`,
        { autoHideDuration: 6000 }
      );
    } else if (networkError.name === 'NetworkError' || !navigator.onLine) {
      console.error('Network connectivity error');

      toaster.warning(
        'Network connection lost. Please check your internet connection.',
        { autoHideDuration: 8000 }
      );
    } else {
      // Generic network error
      console.error('Unhandled network error:', networkError);

      toaster.negative(
        'Connection error. Please try again.',
        { autoHideDuration: 4000 }
      );
    }
  }
};

/**
 * Error Link for comprehensive GraphQL error handling
 */
const errorLink = onError(errorHandlerFn);

// Combine links
const combinedAuthLink = from([errorLink, authLink]);

export default combinedAuthLink;
