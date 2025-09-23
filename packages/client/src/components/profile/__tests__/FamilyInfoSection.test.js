import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FamilyInfoSection from '../FamilyInfoSection';

describe('FamilyInfoSection', () => {
  const mockUserWithFamily = {
    id: 'user-1',
    firstName: 'John',
    lastName: 'Doe',
    roleInFamily: 'OWNER',
    family: {
      id: 'family-1',
      name: 'Test Family',
      description: 'Test family description',
    },
  };

  const defaultProps = {
    user: mockUserWithFamily,
    onDashboardClick: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders family info correctly', () => {
    render(<FamilyInfoSection {...defaultProps} />);

    expect(screen.getByText('Current Family')).toBeInTheDocument();
    expect(screen.getByText('Family Member')).toBeInTheDocument();
    expect(screen.getByText('Your role: OWNER')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('calls onDashboardClick when dashboard button is clicked', () => {
    const mockOnDashboardClick = jest.fn();
    
    render(
      <FamilyInfoSection 
        {...defaultProps} 
        onDashboardClick={mockOnDashboardClick} 
      />
    );

    const dashboardButton = screen.getByText('Dashboard');
    fireEvent.click(dashboardButton);

    expect(mockOnDashboardClick).toHaveBeenCalledTimes(1);
  });

  it('displays different roles correctly', () => {
    const userWithAdminRole = {
      ...mockUserWithFamily,
      roleInFamily: 'ADMIN',
    };

    render(<FamilyInfoSection {...defaultProps} user={userWithAdminRole} />);

    expect(screen.getByText('Your role: ADMIN')).toBeInTheDocument();
  });

  it('displays member role correctly', () => {
    const userWithMemberRole = {
      ...mockUserWithFamily,
      roleInFamily: 'MEMBER',
    };

    render(<FamilyInfoSection {...defaultProps} user={userWithMemberRole} />);

    expect(screen.getByText('Your role: MEMBER')).toBeInTheDocument();
  });

  it('does not render when user has no family', () => {
    const userWithoutFamily = {
      id: 'user-1',
      firstName: 'John',
      lastName: 'Doe',
      family: null,
    };

    render(<FamilyInfoSection {...defaultProps} user={userWithoutFamily} />);

    expect(screen.queryByText('Current Family')).not.toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('does not render when family is undefined', () => {
    const userWithUndefinedFamily = {
      id: 'user-1',
      firstName: 'John',
      lastName: 'Doe',
      family: undefined,
    };

    render(<FamilyInfoSection {...defaultProps} user={userWithUndefinedFamily} />);

    expect(screen.queryByText('Current Family')).not.toBeInTheDocument();
  });

  it('does not render when user is null', () => {
    render(<FamilyInfoSection {...defaultProps} user={null} />);

    expect(screen.queryByText('Current Family')).not.toBeInTheDocument();
  });

  it('does not render when user is undefined', () => {
    render(<FamilyInfoSection {...defaultProps} user={undefined} />);

    expect(screen.queryByText('Current Family')).not.toBeInTheDocument();
  });

  it('handles empty family object', () => {
    const userWithEmptyFamily = {
      id: 'user-1',
      firstName: 'John',
      lastName: 'Doe',
      roleInFamily: 'OWNER',
      family: {},
    };

    render(<FamilyInfoSection {...defaultProps} user={userWithEmptyFamily} />);

    // Should still render because family object exists (even if empty)
    expect(screen.getByText('Current Family')).toBeInTheDocument();
    expect(screen.getByText('Your role: OWNER')).toBeInTheDocument();
  });

  it('handles missing roleInFamily', () => {
    const userWithoutRole = {
      ...mockUserWithFamily,
      roleInFamily: undefined,
    };

    render(<FamilyInfoSection {...defaultProps} user={userWithoutRole} />);

    expect(screen.getByText('Your role:')).toBeInTheDocument();
  });

  it('renders card structure correctly', () => {
    render(<FamilyInfoSection {...defaultProps} />);

    // Check for main content
    expect(screen.getByText('Current Family')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('shows correct text labels', () => {
    render(<FamilyInfoSection {...defaultProps} />);

    expect(screen.getByText('Current Family')).toBeInTheDocument();
    expect(screen.getByText('Family Member')).toBeInTheDocument();
  });

  it('handles different family data', () => {
    const userWithDifferentFamily = {
      ...mockUserWithFamily,
      roleInFamily: 'MEMBER',
      family: {
        id: 'family-2',
        name: 'Different Family',
        description: 'Different description',
      },
    };

    render(<FamilyInfoSection {...defaultProps} user={userWithDifferentFamily} />);

    expect(screen.getByText('Your role: MEMBER')).toBeInTheDocument();
    // Family name is not shown in this component, only the role
  });

  it('preserves button functionality with different props', () => {
    const alternativeHandler = jest.fn();
    
    render(
      <FamilyInfoSection 
        user={mockUserWithFamily}
        onDashboardClick={alternativeHandler} 
      />
    );

    const dashboardButton = screen.getByText('Dashboard');
    fireEvent.click(dashboardButton);

    expect(alternativeHandler).toHaveBeenCalledTimes(1);
    expect(defaultProps.onDashboardClick).not.toHaveBeenCalled();
  });
});
