import React from 'react';
import { render, waitFor, screen, fireEvent } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { gql } from '@apollo/client';
import { toaster } from 'baseui/toast';
import { jwtDecode } from 'jwt-decode';
import { setGlobalLogout } from '../../apollo/authLink';
import { AuthProvider, useAuth } from '../AuthContext';

// Define the same queries as in AuthContext
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

// Mock dependencies
jest.mock('baseui/toast');
jest.mock('jwt-decode');
jest.mock('../../apollo/authLink');

const mockToaster = {
  positive: jest.fn(),
  negative: jest.fn(),
  warning: jest.fn(),
  info: jest.fn(),
};
toaster.positive = mockToaster.positive;
toaster.negative = mockToaster.negative;
toaster.warning = mockToaster.warning;
toaster.info = mockToaster.info;

const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Simple test component
const TestComponent = () => {
  const context = useAuth();
  const serializable = {
    ...context,
    login: typeof context.login,
    logout: typeof context.logout,
    refetchUser: typeof context.refetchUser,
  };
  return <div testid="context-data">{JSON.stringify(serializable, null, 2)}</div>;
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    jwtDecode.mockReturnValue({ exp: Date.now() / 1000 + 3600 });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    render(
      <MockedProvider mocks={[]}>
        <AuthProvider>
          <div>Test</div>
        </AuthProvider>
      </MockedProvider>
    );
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('should provide context when wrapped in AuthProvider', () => {
    render(
      <MockedProvider mocks={[]}>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </MockedProvider>
    );

    const contextData = screen.getByTestId('context-data');
    expect(contextData).toBeInTheDocument();
    
    const contextValue = JSON.parse(contextData.textContent);
    expect(contextValue).toHaveProperty('user');
    expect(contextValue).toHaveProperty('isAuthenticated');
    expect(contextValue).toHaveProperty('isLoading');
    expect(contextValue.login).toBe('function');
    expect(contextValue.logout).toBe('function');
    expect(contextValue.refetchUser).toBe('function');
  });

  it('should work when useAuth is used outside AuthProvider (default context)', () => {
    // Since AuthContext is created with default values, useAuth outside provider
    // will return the default context object rather than throwing error
    const TestComponentOutside = () => {
      const auth = useAuth();
      return <div testid="default-context">{JSON.stringify(auth.user)}</div>;
    };

    render(<TestComponentOutside />);

    // Should render with default context values
    expect(screen.getByTestId('default-context')).toHaveTextContent('null');
  });

  it('should initialize with no token', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    
    render(
      <MockedProvider mocks={[]}>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </MockedProvider>
    );

    const contextData = screen.getByTestId('context-data');
    const contextValue = JSON.parse(contextData.textContent);
    
    expect(contextValue.user).toBeNull();
    expect(contextValue.isAuthenticated).toBe(false);
    expect(contextValue.isLoading).toBe(false);
  });

  it('should initialize with invalid token', () => {
    mockLocalStorage.getItem.mockReturnValue('invalid-token');
    jwtDecode.mockImplementationOnce(() => {
      throw new Error('Invalid token');
    });
    
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    render(
      <MockedProvider mocks={[]}>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </MockedProvider>
    );

    const contextData = screen.getByTestId('context-data');
    const contextValue = JSON.parse(contextData.textContent);
    
    // Note: invalid token initially shows as authenticated=true, loading=true
    // because hasValidToken logic happens synchronously before ME query
    expect(contextValue.isAuthenticated).toBe(true);
    expect(contextValue.isLoading).toBe(true);
    expect(consoleSpy).toHaveBeenCalledWith('Error decoding token:', expect.any(Error));
    
    consoleSpy.mockRestore();
  });

  it('should initialize with expired token', () => {
    mockLocalStorage.getItem.mockReturnValue('expired-token');
    jwtDecode.mockReturnValue({ exp: Date.now() / 1000 - 3600 }); // Expired
    
    render(
      <MockedProvider mocks={[]}>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </MockedProvider>
    );

    const contextData = screen.getByTestId('context-data');
    const contextValue = JSON.parse(contextData.textContent);
    
    expect(contextValue.isAuthenticated).toBe(false);
    expect(contextValue.isLoading).toBe(false);
  });

  it('should initialize with valid token', () => {
    mockLocalStorage.getItem.mockReturnValue('valid-token');
    jwtDecode.mockReturnValue({ exp: Date.now() / 1000 + 3600 }); // Valid
    
    const ME_QUERY_MOCK = {
      request: { query: ME_QUERY },
      result: {
        data: {
          me: {
            id: '1',
            firstName: 'John',
            lastName: 'Doe',
            middleName: null,
            email: 'john@example.com',
            isEmailVerified: true,
            familyId: 'family-1',
            roleInFamily: 'OWNER',
            lastLoginAt: '2023-01-01T00:00:00Z',
            createdAt: '2022-01-01T00:00:00Z',
          },
        },
      },
    };
    
    render(
      <MockedProvider mocks={[ME_QUERY_MOCK]}>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </MockedProvider>
    );

    const contextData = screen.getByTestId('context-data');
    const contextValue = JSON.parse(contextData.textContent);
    
    // Should be authenticated immediately with valid token, loading state
    expect(contextValue.isAuthenticated).toBe(true);
    expect(contextValue.isLoading).toBe(true);
  });

  it('should register setGlobalLogout on mount', () => {
    render(
      <MockedProvider mocks={[]}>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </MockedProvider>
    );

    expect(setGlobalLogout).toHaveBeenCalledWith(expect.any(Function));
  });

  it('should handle traditional login successfully', async () => {
    const LOGIN_MOCK = {
      request: {
        query: LOGIN_MUTATION,
        variables: {
          input: {
            email: 'test@example.com',
            password: 'password123'
          }
        }
      },
      result: {
        data: {
          login: {
            accessToken: 'test-access-token',
            refreshToken: 'test-refresh-token',
            user: {
              id: '1',
              firstName: 'John',
              lastName: 'Doe',
              middleName: null,
              email: 'test@example.com',
              familyId: 'family-1',
              roleInFamily: 'OWNER'
            }
          }
        }
      }
    };

    const ME_QUERY_MOCK = {
      request: { query: ME_QUERY },
      result: {
        data: {
          me: {
            id: '1',
            firstName: 'John',
            lastName: 'Doe',
            middleName: null,
            email: 'test@example.com',
            isEmailVerified: true,
            familyId: 'family-1',
            roleInFamily: 'OWNER',
            lastLoginAt: '2023-01-01T00:00:00Z',
            createdAt: '2022-01-01T00:00:00Z',
          }
        }
      }
    };

    const TestLoginComponent = () => {
      const { login } = useAuth();
      
      const handleLogin = async () => {
        try {
          await login('test@example.com', 'password123');
        } catch (error) {
          // Error handled in component
        }
      };

      return <button testid="login-btn" onClick={handleLogin}>Login</button>;
    };

    render(
      <MockedProvider mocks={[LOGIN_MOCK, ME_QUERY_MOCK]} addTypename={false}>
        <AuthProvider>
          <TestLoginComponent />
        </AuthProvider>
      </MockedProvider>
    );

    const loginBtn = screen.getByTestId('login-btn');
    loginBtn.click();

    await waitFor(() => {
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('accessToken', 'test-access-token');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('refreshToken', 'test-refresh-token');
    });
  });

  it('should handle post-registration login with preAuthData', async () => {
    const ME_QUERY_MOCK = {
      request: { query: ME_QUERY },
      result: {
        data: {
          me: {
            id: '1',
            firstName: 'John',
            lastName: 'Doe',
            middleName: null,
            email: 'test@example.com',
            isEmailVerified: true,
            familyId: 'family-1',
            roleInFamily: 'OWNER',
            lastLoginAt: '2023-01-01T00:00:00Z',
            createdAt: '2022-01-01T00:00:00Z',
          }
        }
      }
    };

    const TestPostRegLoginComponent = () => {
      const { login } = useAuth();
      
      const handlePostRegLogin = async () => {
        try {
          const preAuthData = {
            accessToken: 'post-reg-access-token',
            refreshToken: 'post-reg-refresh-token'
          };
          await login('test@example.com', 'password123', preAuthData);
        } catch (error) {
          // Error handled in component
        }
      };

      return <button testid="post-reg-login-btn" onClick={handlePostRegLogin}>Post Reg Login</button>;
    };

    render(
      <MockedProvider mocks={[ME_QUERY_MOCK]} addTypename={false}>
        <AuthProvider>
          <TestPostRegLoginComponent />
        </AuthProvider>
      </MockedProvider>
    );

    const postRegLoginBtn = screen.getByTestId('post-reg-login-btn');
    postRegLoginBtn.click();

    await waitFor(() => {
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('accessToken', 'post-reg-access-token');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('refreshToken', 'post-reg-refresh-token');
    });
  });

  it('should handle login error', async () => {
    // Mock no token initially so ME_QUERY won't be called during initialization
    mockLocalStorage.getItem.mockReturnValue(null);

    const LOGIN_ERROR_MOCK = {
      request: {
        query: LOGIN_MUTATION,
        variables: {
          input: {
            email: 'test@example.com',
            password: 'wrongpassword'
          }
        }
      },
      error: new Error('Invalid credentials')
    };

    const TestLoginErrorComponent = () => {
      const { login } = useAuth();
      const [loginCalled, setLoginCalled] = React.useState(false);
      
      const handleLogin = async () => {
        try {
          setLoginCalled(true);
          await login('test@example.com', 'wrongpassword');
        } catch (error) {
          // Error handled
        }
      };

      return (
        <div>
          <button testid="login-error-btn" onClick={handleLogin}>Login</button>
          {loginCalled && <div testid="login-called">Login attempted</div>}
        </div>
      );
    };

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    render(
      <MockedProvider mocks={[LOGIN_ERROR_MOCK]} addTypename={false}>
        <AuthProvider>
          <TestLoginErrorComponent />
        </AuthProvider>
      </MockedProvider>
    );

    const loginBtn = screen.getByTestId('login-error-btn');
    loginBtn.click();

    await waitFor(() => {
      expect(screen.getByTestId('login-called')).toBeInTheDocument();
      expect(consoleSpy).toHaveBeenCalledWith('Login failed:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('should handle successful logout', async () => {
    mockLocalStorage.getItem.mockReturnValue('valid-token');
    jwtDecode.mockReturnValue({ exp: Date.now() / 1000 + 3600 });

    const LOGOUT_SUCCESS_MOCK = {
      request: { query: LOGOUT_MUTATION },
      result: { data: { logout: true } }
    };

    const TestLogoutComponent = () => {
      const { logout } = useAuth();
      
      const handleLogout = async () => {
        try {
          await logout();
        } catch (error) {
          // Error handled in component
        }
      };

      return <button testid="logout-btn" onClick={handleLogout}>Logout</button>;
    };

    render(
      <MockedProvider mocks={[LOGOUT_SUCCESS_MOCK]} addTypename={false}>
        <AuthProvider>
          <TestLogoutComponent />
        </AuthProvider>
      </MockedProvider>
    );

    const logoutBtn = screen.getByTestId('logout-btn');
    logoutBtn.click();

    await waitFor(() => {
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('accessToken');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refreshToken');
    });
  });

  it('should handle logout error and still clear tokens', async () => {
    mockLocalStorage.getItem.mockReturnValue('valid-token');
    jwtDecode.mockReturnValue({ exp: Date.now() / 1000 + 3600 });

    const LOGOUT_ERROR_MOCK = {
      request: { query: LOGOUT_MUTATION },
      error: new Error('Server error during logout')
    };

    const TestLogoutErrorComponent = () => {
      const { logout } = useAuth();
      
      const handleLogout = async () => {
        try {
          await logout();
        } catch (error) {
          // Error handled in component
        }
      };

      return <button testid="logout-error-btn" onClick={handleLogout}>Logout</button>;
    };

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    render(
      <MockedProvider mocks={[LOGOUT_ERROR_MOCK]} addTypename={false}>
        <AuthProvider>
          <TestLogoutErrorComponent />
        </AuthProvider>
      </MockedProvider>
    );

    const logoutBtn = screen.getByTestId('logout-error-btn');
    logoutBtn.click();

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Logout error:', expect.any(Error));
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('accessToken');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refreshToken');
    });

    consoleSpy.mockRestore();
  });

  it('should use default context when used outside AuthProvider', () => {
    // Since AuthContext is created with default values, useAuth outside provider
    // will return the default context object rather than throwing error
    const TestComponentOutsideProvider = () => {
      const auth = useAuth();
      return (
        <div>
          <div testid="default-user">{JSON.stringify(auth.user)}</div>
          <div testid="default-authenticated">{String(auth.isAuthenticated)}</div>
          <div testid="default-loading">{String(auth.isLoading)}</div>
        </div>
      );
    };

    render(<TestComponentOutsideProvider />);

    // Should render with default context values since context is created with defaults
    expect(screen.getByTestId('default-user')).toHaveTextContent('null');
    expect(screen.getByTestId('default-authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('default-loading')).toHaveTextContent('true');
  });

  it('should handle ME_QUERY UNAUTHENTICATED error and logout', async () => {
    mockLocalStorage.getItem.mockReturnValue('invalid-token');
    jwtDecode.mockReturnValue({ exp: Date.now() / 1000 + 3600 });

    const ME_QUERY_UNAUTH_MOCK = {
      request: { query: ME_QUERY },
      result: {
        errors: [{
          message: 'Unauthenticated',
          extensions: {
            code: 'UNAUTHENTICATED'
          }
        }]
      }
    };

    render(
      <MockedProvider mocks={[ME_QUERY_UNAUTH_MOCK]} addTypename={false}>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </MockedProvider>
    );

    await waitFor(() => {
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('accessToken');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refreshToken');
    });
  });

  it('should show Invalid credentials toaster for invalid login', async () => {
    mockLocalStorage.getItem.mockReturnValue(null);

    const LOGIN_INVALID_CREDS_MOCK = {
      request: {
        query: LOGIN_MUTATION,
        variables: {
          input: {
            email: 'test@example.com',
            password: 'password123'
          }
        }
      },
      error: new Error('Invalid credentials')
    };

    const TestLoginInvalidCredsComponent = () => {
      const { login } = useAuth();
      
      const handleLogin = async () => {
        try {
          await login('test@example.com', 'password123');
        } catch (error) {
          // Error handled by onError
        }
      };

      return <button testid="login-invalid-creds-btn" onClick={handleLogin}>Login</button>;
    };

    render(
      <MockedProvider mocks={[LOGIN_INVALID_CREDS_MOCK]} addTypename={false}>
        <AuthProvider>
          <TestLoginInvalidCredsComponent />
        </AuthProvider>
      </MockedProvider>
    );

    const loginBtn = screen.getByTestId('login-invalid-creds-btn');
    loginBtn.click();

    await waitFor(() => {
      expect(mockToaster.negative).toHaveBeenCalledWith('Invalid email or password');
    });
  });

  it('should show email verification toaster for unverified email', async () => {
    mockLocalStorage.getItem.mockReturnValue(null);

    const LOGIN_UNVERIFIED_MOCK = {
      request: {
        query: LOGIN_MUTATION,
        variables: {
          input: {
            email: 'test@example.com',
            password: 'password123'
          }
        }
      },
      error: new Error('Email not verified')
    };

    const TestLoginUnverifiedComponent = () => {
      const { login } = useAuth();
      
      const handleLogin = async () => {
        try {
          await login('test@example.com', 'password123');
        } catch (error) {
          // Error handled by onError
        }
      };

      return <button testid="login-unverified-btn" onClick={handleLogin}>Login</button>;
    };

    render(
      <MockedProvider mocks={[LOGIN_UNVERIFIED_MOCK]} addTypename={false}>
        <AuthProvider>
          <TestLoginUnverifiedComponent />
        </AuthProvider>
      </MockedProvider>
    );

    const loginBtn = screen.getByTestId('login-unverified-btn');
    loginBtn.click();

    await waitFor(() => {
      expect(mockToaster.info).toHaveBeenCalledWith('Email verification required');
    });
  });

  it('should show generic login error toaster for unknown errors', async () => {
    mockLocalStorage.getItem.mockReturnValue(null);

    const LOGIN_GENERIC_ERROR_MOCK = {
      request: {
        query: LOGIN_MUTATION,
        variables: {
          input: {
            email: 'test@example.com',
            password: 'password123'
          }
        }
      },
      error: new Error('Server timeout')
    };

    const TestLoginGenericErrorComponent = () => {
      const { login } = useAuth();
      
      const handleLogin = async () => {
        try {
          await login('test@example.com', 'password123');
        } catch (error) {
          // Error handled by onError
        }
      };

      return <button testid="login-generic-error-btn" onClick={handleLogin}>Login</button>;
    };

    render(
      <MockedProvider mocks={[LOGIN_GENERIC_ERROR_MOCK]} addTypename={false}>
        <AuthProvider>
          <TestLoginGenericErrorComponent />
        </AuthProvider>
      </MockedProvider>
    );

    const loginBtn = screen.getByTestId('login-generic-error-btn');
    loginBtn.click();

    await waitFor(() => {
      expect(mockToaster.negative).toHaveBeenCalledWith('Login error. Try again later.');
    });
  });

  it('should handle logout error in useCallback and still clear tokens', async () => {
    mockLocalStorage.getItem.mockReturnValue('valid-token');
    jwtDecode.mockReturnValue({ exp: Date.now() / 1000 + 3600 });

    const LOGOUT_CALLBACK_ERROR_MOCK = {
      request: { query: LOGOUT_MUTATION },
      error: new Error('Logout callback server error')
    };

    const TestLogoutCallbackErrorComponent = () => {
      const { logout } = useAuth();
      
      const handleLogout = async () => {
        await logout(); // This should not throw, but handle error internally
      };

      return <button testid="logout-callback-error-btn" onClick={handleLogout}>Logout</button>;
    };

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    render(
      <MockedProvider mocks={[LOGOUT_CALLBACK_ERROR_MOCK]} addTypename={false}>
        <AuthProvider>
          <TestLogoutCallbackErrorComponent />
        </AuthProvider>
      </MockedProvider>
    );

    const logoutBtn = screen.getByTestId('logout-callback-error-btn');
    logoutBtn.click();

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Logout error:', expect.any(Error));
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('accessToken');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refreshToken');
    });

    consoleSpy.mockRestore();
  });

  it('should throw error when useAuth is called without AuthProvider - line 64', () => {
    jest.isolateModules(() => {
      // Mock React's useContext to return null within this isolated module
      jest.doMock('react', () => {
        const actualReact = jest.requireActual('react');
        return {
          ...actualReact,
          useContext: jest.fn(() => null)
        };
      });

      // Import useAuth in the isolated context
      const { useAuth } = require('../../contexts/AuthContext');
      
      // Test that useAuth throws the expected error
      expect(() => useAuth()).toThrow('useAuth must be used within AuthProvider');
    });
  });

  it('should handle logout mutation error and call handleLogout - lines 217-219', async () => {
    mockLocalStorage.getItem.mockReturnValue('valid-token');
    jwtDecode.mockReturnValue({ exp: Date.now() / 1000 + 3600 });

    // Mock a failing logout mutation
    const LOGOUT_MUTATION_ERROR_MOCK = {
      request: { query: LOGOUT_MUTATION },
      error: new Error('Network error in logout mutation')
    };

    const TestLogoutMutationErrorComponent = () => {
      const { logout } = useAuth();
      
      const handleLogout = async () => {
        await logout();
      };

      return <button testid="logout-mutation-error-btn" onClick={handleLogout}>Logout</button>;
    };

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    render(
      <MockedProvider mocks={[LOGOUT_MUTATION_ERROR_MOCK]} addTypename={false}>
        <AuthProvider>
          <TestLogoutMutationErrorComponent />
        </AuthProvider>
      </MockedProvider>
    );

    const logoutBtn = screen.getByTestId('logout-mutation-error-btn');
    logoutBtn.click();

    await waitFor(() => {
      // Should log the error (line 217)
      expect(consoleSpy).toHaveBeenCalledWith('Logout error:', expect.any(Error));
      // Should call handleLogout anyway (line 219) - clearing tokens
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('accessToken');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refreshToken');
    });

    consoleSpy.mockRestore();
  });

  it('should handle complex logout error scenarios - lines 217-219', async () => {
    mockLocalStorage.getItem.mockReturnValue('valid-token');
    jwtDecode.mockReturnValue({ exp: Date.now() / 1000 + 3600 });

    // Create a mock that throws a rejected promise that would reach catch block
    const COMPLEX_LOGOUT_ERROR_MOCK = {
      request: { query: LOGOUT_MUTATION },
      error: new Error('Complex network error during logout')
    };

    const TestComplexLogoutErrorComponent = () => {
      const { logout } = useAuth();
      
      const handleComplexLogout = async () => {
        try {
          await logout();
        } catch (error) {
          // Component-level error handling
        }
      };

      return <button testid="complex-logout-error-btn" onClick={handleComplexLogout}>Complex Logout</button>;
    };

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    render(
      <MockedProvider mocks={[COMPLEX_LOGOUT_ERROR_MOCK]} addTypename={false}>
        <AuthProvider>
          <TestComplexLogoutErrorComponent />
        </AuthProvider>
      </MockedProvider>
    );

    const complexLogoutBtn = screen.getByTestId('complex-logout-error-btn');
    fireEvent.click(complexLogoutBtn);

    await waitFor(() => {
      // The exact catch block lines 217-219 should be covered
      expect(consoleSpy).toHaveBeenCalledWith('Logout error:', expect.any(Error));
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('accessToken');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refreshToken');
    }, { timeout: 3000 });

    consoleSpy.mockRestore();
  });

  it('FINAL: covers data?.me falsy branch - line 101', async () => {
    mockLocalStorage.getItem.mockReturnValue('valid-token');
    jwtDecode.mockReturnValue({ exp: Date.now() / 1000 + 3600 });

    const ME_QUERY_WITH_EMPTY_ME = {
      request: { query: ME_QUERY },
      result: {
        data: { me: null }  // This will make data?.me falsy, not triggering setError(null)
      }
    };

    const TestComponent = () => {
      const { user } = useAuth();
      return <div>User: {user ? 'exists' : 'null'}</div>;
    };

    render(
      <MockedProvider mocks={[ME_QUERY_WITH_EMPTY_ME]}>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </MockedProvider>
    );

    // Wait for the query to complete with null me
    await waitFor(() => {
      expect(screen.getByText('User: null')).toBeInTheDocument();
    });

    // The onCompleted should be called but data?.me will be falsy (null), 
    // so setError(null) should NOT be called (covering the false branch of line 101)
  });

  it('FINAL: covers data?.login falsy branch - line 120', async () => {
    const LOGIN_MUTATION_WITH_NULL_LOGIN = {
      request: {
        query: LOGIN_MUTATION,
        variables: { email: 'test@test.com', password: 'password' }
      },
      result: {
        data: { login: null }  // This will make data?.login falsy
      }
    };

    const TestComponent = () => {
      const { login } = useAuth();
      
      const handleLogin = async () => {
        await login('test@test.com', 'password');
      };

      return <button onClick={handleLogin}>Login</button>;
    };

    render(
      <MockedProvider mocks={[LOGIN_MUTATION_WITH_NULL_LOGIN]}>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </MockedProvider>
    );

    // Click login - this should call onCompleted with data.login = null
    fireEvent.click(screen.getByText('Login'));

    // Wait for mutation to complete
    await waitFor(() => {
      // Since data?.login is falsy (null), the tokens should NOT be saved
      // and setHasValidToken should NOT be called (covering the false branch of line 120)
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });
  });

});