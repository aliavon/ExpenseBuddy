/**
 * Test utilities for errorLink functionality
 * Use these in development to test different error scenarios
 */

import { gql, createHttpLink, ApolloClient, InMemoryCache } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

// Real GraphQL queries/mutations for testing
const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      firstName
    }
  }
`;

const REMOVE_FAMILY_MEMBER_MUTATION = gql`
  mutation RemoveFamilyMember($memberId: ID!) {
    removeFamilyMember(memberId: $memberId)
  }
`;

const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      user {
        id
      }
    }
  }
`;

// Create test Apollo Client with configurable auth
export const createTestClient = (authToken = null, customUri = null) => {
  const httpLink = createHttpLink({
    uri: customUri || `http://localhost:${process.env.REACT_APP_SERVER_PORT || 8000}/graphql`,
  });

  const authLink = setContext((_, { headers }) => ({
    headers: {
      ...headers,
      ...(authToken && { authorization: `Bearer ${authToken}` }),
    },
  }));

  return new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: { errorPolicy: 'all' },
      query: { errorPolicy: 'all' },
      mutate: { errorPolicy: 'all' },
    },
  });
};

/**
 * Simulate different GraphQL error scenarios for testing
 */
export const testErrorScenarios = {
  // Test authentication error (should trigger logout)
  unauthenticated: async () => {
    console.log('🧪 Testing UNAUTHENTICATED error scenario');
    console.log('Setting invalid token and making authenticated request...');

    const testClient = createTestClient('invalid.jwt.token.here');

    try {
      await testClient.query({
        query: ME_QUERY,
      });
    } catch (error) {
      console.log('✅ UNAUTHENTICATED error triggered successfully');
      console.log('Expected: User should be logged out and redirected');
      return;
    }
    console.log('❌ No error occurred - authentication check might be disabled');
  },

  // Test authorization error (should show error but not logout)
  forbidden: async () => {
    console.log('🧪 Testing FORBIDDEN error scenario');
    console.log('Attempting admin action without permissions...');

    const currentToken = localStorage.getItem('accessToken');
    if (!currentToken) {
      console.log('❌ Need to be logged in first for this test');
      return;
    }

    const testClient = createTestClient(currentToken);

    try {
      await testClient.mutate({
        mutation: REMOVE_FAMILY_MEMBER_MUTATION,
        variables: { memberId: 'non-existent-member-id' },
      });
    } catch (error) {
      if (error.graphQLErrors?.some(e => e.extensions?.code === 'FORBIDDEN')) {
        console.log('✅ FORBIDDEN error triggered successfully');
        console.log('Expected: Access denied toast shown, user NOT logged out');
      } else {
        console.log('⚠️ Different error occurred:', error.message);
      }
      return;
    }
    console.log('❌ No error occurred - permissions check might be disabled');
  },

  // Test validation error
  validation: async () => {
    console.log('🧪 Testing VALIDATION_ERROR scenario');
    console.log('Sending invalid data...');

    const testClient = createTestClient();

    try {
      await testClient.mutate({
        mutation: LOGIN_MUTATION,
        variables: {
          input: {
            email: 'not-an-email', // Invalid email format
            password: '', // Empty password
          },
        },
      });
    } catch (error) {
      if (error.graphQLErrors?.some(e => e.extensions?.code === 'VALIDATION_ERROR')) {
        console.log('✅ VALIDATION_ERROR triggered successfully');
        console.log('Expected: Validation error toast shown');
      } else {
        console.log('⚠️ Different error occurred:', error.message);
      }
      return;
    }
    console.log('❌ No validation error occurred');
  },

  // Test network error
  networkError: async () => {
    console.log('🧪 Testing network connectivity error');
    console.log('Attempting to connect to non-existent server...');

    const testClient = createTestClient(null, 'http://non-existent-server:9999/graphql');

    try {
      await testClient.query({
        query: ME_QUERY,
      });
    } catch (error) {
      if (error.networkError) {
        console.log('✅ Network error triggered successfully');
        console.log('Expected: Network error toast shown');
        console.log('Network error details:', error.networkError.message);
      } else {
        console.log('⚠️ Different error occurred:', error.message);
      }
      return;
    }
    console.log('❌ No network error occurred');
  },

  // Test server error by sending malformed request
  serverError: async () => {
    console.log('🧪 Testing server error scenario');
    console.log('Sending malformed GraphQL query...');

    const testClient = createTestClient();

    try {
      // Send a malformed query that should cause server error
      await testClient.query({
        query: gql`
          query InvalidQuery {
            nonExistentField {
              anotherNonExistentField
            }
          }
        `,
      });
    } catch (error) {
      if (error.graphQLErrors?.length > 0) {
        console.log('✅ Server error triggered successfully');
        console.log('Expected: Server error toast shown');
        console.log('Error details:', error.graphQLErrors[0].message);
      } else if (error.networkError?.statusCode >= 500) {
        console.log('✅ Server HTTP error triggered successfully');
        console.log('Expected: Server error toast shown');
      } else {
        console.log('⚠️ Different error occurred:', error.message);
      }
      return;
    }
    console.log('❌ No server error occurred');
  },
};

/**
 * Helper to check current auth state
 */
export const checkAuthState = () => {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');

  const authState = {
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    accessTokenLength: accessToken?.length || 0,
    refreshTokenLength: refreshToken?.length || 0,
    currentPath: window.location.pathname,
    timestamp: new Date().toISOString(),
  };

  console.log('🔍 Current auth state:', authState);
  return authState;
};

/**
 * Run all error scenarios in sequence for comprehensive testing
 */
export const testAllScenarios = async () => {
  console.log('🧪 Running ALL error scenarios for comprehensive testing...\n');

  const scenarios = [
    { name: 'Network Error', fn: testErrorScenarios.networkError },
    { name: 'Server Error', fn: testErrorScenarios.serverError },
    { name: 'Validation Error', fn: testErrorScenarios.validation },
    { name: 'Forbidden Error', fn: testErrorScenarios.forbidden },
    { name: 'Unauthenticated Error', fn: testErrorScenarios.unauthenticated },
  ];

  for (const scenario of scenarios) {
    console.log(`\n--- Testing ${scenario.name} ---`);
    try {
      await scenario.fn();
    } catch (error) {
      console.error(`❌ Error in ${scenario.name}:`, error.message);
    }

    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n✅ All error scenario tests completed!');
  console.log('Check the UI for toast notifications and auth state changes.');
};

// Export for easy access in browser console
if (typeof window !== 'undefined') {
  window.testErrorLink = {
    // Error scenario tests
    scenarios: testErrorScenarios,
    testAllScenarios,
    checkAuthState,

    // Quick access to individual scenarios
    testUnauthenticated: testErrorScenarios.unauthenticated,
    testForbidden: testErrorScenarios.forbidden,
    testValidation: testErrorScenarios.validation,
    testNetwork: testErrorScenarios.networkError,
    testServer: testErrorScenarios.serverError,
  };
}