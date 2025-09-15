import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { from } from '@apollo/client';

/**
 * Auth Link for automatic JWT token addition
 */
const authLink = setContext((_, { headers }) => {
  // Get token from localStorage
  const token = localStorage.getItem('accessToken');

  return {
    headers: {
      ...headers,
      // Add Authorization header if token exists
      ...(token && { authorization: `Bearer ${token}` }),
    },
  };
});

/**
 * Error Link for auth error handling
 */
const errorLink = onError(({ graphQLErrors, networkError, _operation, _forward }) => {
  // Handle GraphQL errors
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path, extensions }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      );

      // Handle auth errors
      if (extensions?.code === 'UNAUTHENTICATED' || extensions?.code === 'FORBIDDEN') {
        console.warn('Authentication error, clearing tokens...');

        // Clear tokens
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');

        // Redirect to login (via window.location for simplicity)
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    });
  }

  // Handle network errors
  if (networkError) {
    console.error(`[Network error]: ${networkError}`);

    // Handle 401/403 HTTP errors
    if (networkError.statusCode === 401 || networkError.statusCode === 403) {
      console.warn('Network auth error, clearing tokens...');

      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');

      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
  }
});

// Combine links
const combinedAuthLink = from([errorLink, authLink]);

export default combinedAuthLink;
