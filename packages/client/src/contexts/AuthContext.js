import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { jwtDecode } from 'jwt-decode';
import { toaster } from 'baseui/toast';
import { setGlobalLogout } from '../apollo/authLink';

// GraphQL queries and mutations
const ME_QUERY = gql`
  query Me {
    me {
      id
      firstName
      lastName
      middleName
      email
      isEmailVerified
      familyId
      roleInFamily
      lastLoginAt
      createdAt
    }
  }
`;

const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      refreshToken
      user {
        id
        firstName
        lastName
        middleName
        email
        familyId
        roleInFamily
      }
    }
  }
`;

const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout
  }
`;

// Create context
const AuthContext = createContext({
  user: null,
  family: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: () => {},
  error: null,
});

// Hook to use context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Utility function to check token validity
const isTokenValid = token => {
  if (!token) {
    return false;
  }

  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp > currentTime;
  } catch (error) {
    console.error('Error decoding token:', error);
    return false;
  }
};

// Auth Provider component
export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if there's a valid token on initialization
  const [hasValidToken, setHasValidToken] = useState(() => {
    const token = localStorage.getItem('accessToken');
    return isTokenValid(token);
  });

  // Query to get current user (only if there's a valid token)
  const { data: userData, loading: userLoading, refetch: refetchUser } = useQuery(ME_QUERY, {
    skip: !hasValidToken,
    errorPolicy: 'all',
    onCompleted: data => {
      setError(null);
    },
    onError: error => {
      setError(error.message);
      // If authentication error, clear tokens
      if (error.graphQLErrors?.some(e => e.extensions?.code === 'UNAUTHENTICATED')) {
        handleLogout();
      }
    },
  });

  // Get user from query data directly (reactive!)
  const user = userData?.me || null;

  // Login mutation
  const [loginMutation] = useMutation(LOGIN_MUTATION, {
    onCompleted: data => {
      // Save tokens
      localStorage.setItem('accessToken', data.login.accessToken);
      localStorage.setItem('refreshToken', data.login.refreshToken);

      // Update token state
      setHasValidToken(true);
      setError(null);

      // Show success toast after login mutation completes
      toaster.positive('Successfully logged in!');
    },
    onError: error => {
      console.error('Login error:', error);
      setError(error.message);

      // Show error toast immediately when mutation fails
      // Check error code first, then fallback to message
      const errorCode = error.graphQLErrors?.[0]?.extensions?.code;
      const errorMessage = error.message || error.graphQLErrors?.[0]?.message;

      if (errorCode === 'INVALID_CREDENTIALS' || errorMessage?.includes('Invalid email or password')) {
        toaster.negative('Invalid email or password');
      } else if (errorMessage?.includes('not verified')) {
        toaster.info('Email verification required');
      } else {
        toaster.negative('Login error. Try again later.');
      }
    },
  });

  // Logout mutation
  const [logoutMutation] = useMutation(LOGOUT_MUTATION, {
    onCompleted: () => {
      handleLogout();
    },
    onError: error => {
      console.error('Logout error:', error);
      // Clear local data even if server logout failed
      handleLogout();
    },
  });

  // Login function - supports both traditional login and post-registration login
  const login = async (email, password, preAuthData = null) => {
    try {
      setError(null);

      // Clear any existing tokens before attempting login
      // This prevents ME_QUERY from running with stale tokens
      if (!preAuthData) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setHasValidToken(false);
      }

      if (preAuthData) {
        // Post-registration login with pre-authenticated data
        const { accessToken, refreshToken } = preAuthData;

        // Save tokens
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);

        // Update token state - ME_QUERY will automatically run when hasValidToken becomes true
        setHasValidToken(true);
        setIsLoading(false);

        return true;
      } else {
        // Traditional login
        await loginMutation({
          variables: {
            input: {
              email,
              password,
            },
          },
        });

        // ME_QUERY will automatically run when onCompleted sets hasValidToken to true
        return true;
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  // Logout function
  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    // Clear state (user will be null automatically when hasValidToken is false)
    setHasValidToken(false);
    setError(null);
  };

  const logout = useCallback(async () => {
    await logoutMutation();
  }, [logoutMutation]);

  // Effect for state initialization
  useEffect(() => {
    const token = localStorage.getItem('accessToken');

    if (!isTokenValid(token)) {
      // Token is invalid, clear
      handleLogout();
      setIsLoading(false);
    } else {
      // Token is valid, user data will load through ME_QUERY
      setHasValidToken(true);
    }
  }, []);

  // Update isLoading based on query state
  useEffect(() => {
    if (hasValidToken) {
      setIsLoading(userLoading);
    } else {
      setIsLoading(false);
    }
  }, [hasValidToken, userLoading]);

  // Register logout function with errorLink for automatic logout on auth errors
  useEffect(() => {
    // Pass handleLogout instead of logout to avoid mutation calls during error handling
    setGlobalLogout(handleLogout);
    console.log('Registered logout function with Apollo errorLink');

    // Cleanup on unmount
    return () => {
      setGlobalLogout(null);
    };
  }, []);

  const value = {
    user,
    family: null, // Family info will be loaded separately when needed
    isAuthenticated: hasValidToken && (!!user || userLoading), // Authenticated if token valid and (user loaded OR loading)
    isLoading,
    login,
    logout,
    refetchUser,
    error,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
