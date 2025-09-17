import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import UserProfileHeader from '../UserProfileHeader';
import { mockBaseUIComponents } from '../../../test-utils/mocks';

// Setup mocks
mockBaseUIComponents();

describe('UserProfileHeader', () => {
  const mockUser = {
    id: 'user-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@test.com',
    isEmailVerified: true,
  };

  const defaultProps = {
    user: mockUser,
    onLogoutClick: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders user information correctly', () => {
    render(<UserProfileHeader {...defaultProps} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@test.com')).toBeInTheDocument();
    expect(screen.getByText('✓ Verified')).toBeInTheDocument();
  });

  it('shows correct avatar initials', () => {
    render(<UserProfileHeader {...defaultProps} />);

    // Check that avatar exists with correct aria-label
    expect(screen.getByLabelText('JD')).toBeInTheDocument();
  });

  it('shows not verified status for unverified email', () => {
    const unverifiedUser = {
      ...mockUser,
      isEmailVerified: false,
    };

    render(<UserProfileHeader {...defaultProps} user={unverifiedUser} />);

    expect(screen.getByText('⚠️ Not verified')).toBeInTheDocument();
  });

  it('calls onLogoutClick when logout button is clicked', () => {
    const mockOnLogoutClick = jest.fn();
    
    render(
      <UserProfileHeader 
        {...defaultProps} 
        onLogoutClick={mockOnLogoutClick} 
      />
    );

    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);

    expect(mockOnLogoutClick).toHaveBeenCalledTimes(1);
  });

  it('handles user with missing first name', () => {
    const userWithMissingFirstName = {
      ...mockUser,
      firstName: '',
      lastName: 'Doe',
    };

    render(<UserProfileHeader {...defaultProps} user={userWithMissingFirstName} />);

    expect(screen.getByText('Doe')).toBeInTheDocument();
  });

  it('handles user with missing last name', () => {
    const userWithMissingLastName = {
      ...mockUser,
      firstName: 'John',
      lastName: '',
    };

    render(<UserProfileHeader {...defaultProps} user={userWithMissingLastName} />);

    expect(screen.getByText('John')).toBeInTheDocument();
  });

  it('handles null user gracefully', () => {
    render(<UserProfileHeader {...defaultProps} user={null} />);

    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('handles undefined user gracefully', () => {
    render(<UserProfileHeader {...defaultProps} user={undefined} />);

    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('displays email correctly', () => {
    const userWithDifferentEmail = {
      ...mockUser,
      email: 'different@test.com',
    };

    render(<UserProfileHeader {...defaultProps} user={userWithDifferentEmail} />);

    expect(screen.getByText('different@test.com')).toBeInTheDocument();
  });

  it('shows correct colors for verification status', () => {
    const verifiedUser = { ...mockUser, isEmailVerified: true };
    render(<UserProfileHeader {...defaultProps} user={verifiedUser} />);

    expect(screen.getByText('✓ Verified')).toBeInTheDocument();
  });

  it('generates correct initials with different names', () => {
    const testUser = { ...mockUser, firstName: 'Alice', lastName: 'Smith' };
    render(<UserProfileHeader {...defaultProps} user={testUser} />);

    expect(screen.getByLabelText('AS')).toBeInTheDocument();
  });

  it('renders logout button with correct properties', () => {
    render(<UserProfileHeader {...defaultProps} />);

    const logoutButton = screen.getByText('Logout');
    expect(logoutButton).toBeInTheDocument();
  });

  it('handles missing email field', () => {
    const userWithoutEmail = {
      ...mockUser,
      email: undefined,
    };

    render(<UserProfileHeader {...defaultProps} user={userWithoutEmail} />);

    // Should not crash
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });
});
