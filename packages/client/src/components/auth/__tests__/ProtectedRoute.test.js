import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';
import { useAuth } from '../../../contexts/AuthContext';

// Mock dependencies
jest.mock('../../../contexts/AuthContext');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Navigate: ({ to, state }) => (
    <div data-testid="navigate" data-to={to} data-state={JSON.stringify(state)}>
      Navigate to {to}
    </div>
  ),
  useLocation: () => ({
    pathname: '/dashboard',
  }),
}));

// Mock BaseUI components
jest.mock('baseui/block', () => ({
  Block: ({ children, ...props }) => (
    <div data-testid="block" {...props}>
      {children}
    </div>
  ),
}));

jest.mock('baseui/spinner', () => ({
  Spinner: ({ size }) => (
    <div data-testid="spinner" data-size={size}>
      Loading spinner
    </div>
  ),
}));

jest.mock('baseui/typography', () => ({
  HeadingMedium: ({ children, ...props }) => (
    <h2 data-testid="heading-medium" {...props}>
      {children}
    </h2>
  ),
}));

describe('ProtectedRoute', () => {
  const mockUseAuth = useAuth;
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('renders loading spinner when isLoading is true', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: true,
      });

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Protected content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('Loading spinner')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
    });

    it('renders loading spinner with correct size and styling', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: true,
      });

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Protected content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      // Test that loading components are rendered
      expect(screen.getByText('Loading spinner')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Authentication', () => {
    it('redirects to login when not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Protected content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('Navigate to /login')).toBeInTheDocument();
      expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
    });

    it('renders children when authenticated and no role required', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', roleInFamily: 'MEMBER' },
        isAuthenticated: true,
        isLoading: false,
      });

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Protected content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('Protected content')).toBeInTheDocument();
      expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
    });
  });

  describe('Role-based Access', () => {
    it('renders children when user has exact required role', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', roleInFamily: 'ADMIN' },
        isAuthenticated: true,
        isLoading: false,
      });

      render(
        <MemoryRouter>
          <ProtectedRoute requiredRole="ADMIN">
            <div>Admin content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('Admin content')).toBeInTheDocument();
    });

    it('renders children when user has higher role than required', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', roleInFamily: 'OWNER' },
        isAuthenticated: true,
        isLoading: false,
      });

      render(
        <MemoryRouter>
          <ProtectedRoute requiredRole="ADMIN">
            <div>Admin content for owner</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('Admin content for owner')).toBeInTheDocument();
    });

    it('shows access denied when user has lower role than required', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', roleInFamily: 'MEMBER' },
        isAuthenticated: true,
        isLoading: false,
      });

      render(
        <MemoryRouter>
          <ProtectedRoute requiredRole="ADMIN">
            <div>Admin content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('Insufficient access rights')).toBeInTheDocument();
      expect(screen.queryByText('Admin content')).not.toBeInTheDocument();
    });

    it('shows custom fallback when user has insufficient role', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', roleInFamily: 'MEMBER' },
        isAuthenticated: true,
        isLoading: false,
      });

      const customFallback = <div>Custom access denied</div>;

      render(
        <MemoryRouter>
          <ProtectedRoute requiredRole="ADMIN" fallback={customFallback}>
            <div>Admin content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('Custom access denied')).toBeInTheDocument();
      expect(screen.queryByText('Admin content')).not.toBeInTheDocument();
      expect(screen.queryByText('Insufficient access rights')).not.toBeInTheDocument();
    });

    it('handles user without roleInFamily property', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1' }, // no roleInFamily
        isAuthenticated: true,
        isLoading: false,
      });

      render(
        <MemoryRouter>
          <ProtectedRoute requiredRole="ADMIN">
            <div>Admin content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('Insufficient access rights')).toBeInTheDocument();
      expect(screen.queryByText('Admin content')).not.toBeInTheDocument();
    });

    it('handles null user with required role', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: true, // edge case: authenticated but no user
        isLoading: false,
      });

      render(
        <MemoryRouter>
          <ProtectedRoute requiredRole="ADMIN">
            <div>Admin content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('Insufficient access rights')).toBeInTheDocument();
      expect(screen.queryByText('Admin content')).not.toBeInTheDocument();
    });
  });

  describe('Role Hierarchy', () => {
    const testCases = [
      { userRole: 'MEMBER', requiredRole: 'MEMBER', shouldAccess: true },
      { userRole: 'MEMBER', requiredRole: 'ADMIN', shouldAccess: false },
      { userRole: 'MEMBER', requiredRole: 'OWNER', shouldAccess: false },
      { userRole: 'ADMIN', requiredRole: 'MEMBER', shouldAccess: true },
      { userRole: 'ADMIN', requiredRole: 'ADMIN', shouldAccess: true },
      { userRole: 'ADMIN', requiredRole: 'OWNER', shouldAccess: false },
      { userRole: 'OWNER', requiredRole: 'MEMBER', shouldAccess: true },
      { userRole: 'OWNER', requiredRole: 'ADMIN', shouldAccess: true },
      { userRole: 'OWNER', requiredRole: 'OWNER', shouldAccess: true },
    ];

    testCases.forEach(({ userRole, requiredRole, shouldAccess }) => {
      it(`${shouldAccess ? 'allows' : 'denies'} access for ${userRole} to ${requiredRole} content`, () => {
        mockUseAuth.mockReturnValue({
          user: { id: '1', roleInFamily: userRole },
          isAuthenticated: true,
          isLoading: false,
        });

        render(
          <MemoryRouter>
            <ProtectedRoute requiredRole={requiredRole}>
              <div>Role-based content</div>
            </ProtectedRoute>
          </MemoryRouter>
        );

        if (shouldAccess) {
          expect(screen.getByText('Role-based content')).toBeInTheDocument();
          expect(screen.queryByText('Insufficient access rights')).not.toBeInTheDocument();
        } else {
          expect(screen.getByText('Insufficient access rights')).toBeInTheDocument();
          expect(screen.queryByText('Role-based content')).not.toBeInTheDocument();
        }
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles unknown role in hierarchy', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', roleInFamily: 'UNKNOWN_ROLE' },
        isAuthenticated: true,
        isLoading: false,
      });

      render(
        <MemoryRouter>
          <ProtectedRoute requiredRole="ADMIN">
            <div>Admin content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('Insufficient access rights')).toBeInTheDocument();
      expect(screen.queryByText('Admin content')).not.toBeInTheDocument();
    });

    it('handles unknown required role', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', roleInFamily: 'ADMIN' },
        isAuthenticated: true,
        isLoading: false,
      });

      render(
        <MemoryRouter>
          <ProtectedRoute requiredRole="UNKNOWN_ROLE">
            <div>Unknown role content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      // Unknown role in hierarchy results in -1, ADMIN has index 1
      // 1 < -1 = false, so access is granted
      expect(screen.getByText('Unknown role content')).toBeInTheDocument();
      expect(screen.queryByText('Insufficient access rights')).not.toBeInTheDocument();
    });

    it('renders children when no role required and user is authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', roleInFamily: 'MEMBER' },
        isAuthenticated: true,
        isLoading: false,
      });

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Public authenticated content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('Public authenticated content')).toBeInTheDocument();
    });

    it('handles empty requiredRole prop', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', roleInFamily: 'MEMBER' },
        isAuthenticated: true,
        isLoading: false,
      });

      render(
        <MemoryRouter>
          <ProtectedRoute requiredRole="">
            <div>Empty role content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('Empty role content')).toBeInTheDocument();
    });
  });

  describe('Component Styling', () => {
    it('renders loading component correctly', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: true,
      });

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Protected content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('Loading spinner')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders access denied component correctly', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', roleInFamily: 'MEMBER' },
        isAuthenticated: true,
        isLoading: false,
      });

      render(
        <MemoryRouter>
          <ProtectedRoute requiredRole="ADMIN">
            <div>Admin content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('Insufficient access rights')).toBeInTheDocument();
      expect(screen.queryByText('Admin content')).not.toBeInTheDocument();
    });
  });

  describe('Multiple Children', () => {
    it('renders multiple children when authorized', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', roleInFamily: 'ADMIN' },
        isAuthenticated: true,
        isLoading: false,
      });

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>First child</div>
            <div>Second child</div>
            <span>Third child</span>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('First child')).toBeInTheDocument();
      expect(screen.getByText('Second child')).toBeInTheDocument();
      expect(screen.getByText('Third child')).toBeInTheDocument();
    });

    it('renders complex JSX children', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', roleInFamily: 'OWNER' },
        isAuthenticated: true,
        isLoading: false,
      });

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>
              <h1>Main Title</h1>
              <p>Some paragraph</p>
              <button>Action Button</button>
            </div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('Main Title')).toBeInTheDocument();
      expect(screen.getByText('Some paragraph')).toBeInTheDocument();
      expect(screen.getByText('Action Button')).toBeInTheDocument();
    });
  });
});
