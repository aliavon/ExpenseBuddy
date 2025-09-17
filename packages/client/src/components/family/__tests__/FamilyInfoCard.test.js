import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FamilyInfoCard from '../FamilyInfoCard';
import { mockBaseUIComponents } from '../../../test-utils/mocks';

// Setup mocks
mockBaseUIComponents();

describe('FamilyInfoCard', () => {
  const mockUser = {
    family: {
      name: 'Test Family',
      description: 'Test family description',
      createdAt: '2023-01-01',
    },
  };

  const mockMembers = [
    { id: '1', firstName: 'John', lastName: 'Doe', roleInFamily: 'OWNER' },
    { id: '2', firstName: 'Jane', lastName: 'Doe', roleInFamily: 'MEMBER' },
  ];

  const defaultProps = {
    user: mockUser,
    members: mockMembers,
    isOwner: false,
    onEditClick: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders family information correctly', () => {
    render(<FamilyInfoCard {...defaultProps} />);

    expect(screen.getByText('Test Family')).toBeInTheDocument();
    expect(screen.getByText('Test family description')).toBeInTheDocument();
    expect(screen.getByText(/2.*members/)).toBeInTheDocument(); // Members count
    expect(screen.getByText('1/1/2023')).toBeInTheDocument(); // Created date
  });

  it('shows default values when family info is missing', () => {
    const propsWithoutFamily = {
      ...defaultProps,
      user: { family: null },
    };

    render(<FamilyInfoCard {...propsWithoutFamily} />);

    expect(screen.getByText('Your Family')).toBeInTheDocument();
    expect(screen.getByText('No description provided')).toBeInTheDocument();
    expect(screen.getByText('Unknown')).toBeInTheDocument(); // Created date
  });

  it('shows edit button only for owners', () => {
    render(<FamilyInfoCard {...defaultProps} isOwner={true} />);

    const editButton = screen.getByText('Edit Family Info');
    expect(editButton).toBeInTheDocument();
  });

  it('does not show edit button for non-owners', () => {
    render(<FamilyInfoCard {...defaultProps} isOwner={false} />);

    expect(screen.queryByText('Edit Family Info')).not.toBeInTheDocument();
  });

  it('calls onEditClick when edit button is clicked', () => {
    const mockOnEditClick = jest.fn();
    
    render(
      <FamilyInfoCard 
        {...defaultProps} 
        isOwner={true} 
        onEditClick={mockOnEditClick} 
      />
    );

    const editButton = screen.getByText('Edit Family Info');
    fireEvent.click(editButton);

    expect(mockOnEditClick).toHaveBeenCalledTimes(1);
  });

  it('handles empty members array', () => {
    render(<FamilyInfoCard {...defaultProps} members={[]} />);

    expect(screen.getByText(/0.*members/)).toBeInTheDocument(); // Members count
  });

  it('handles undefined members', () => {
    render(<FamilyInfoCard {...defaultProps} members={undefined} />);

    expect(screen.getByText(/0.*members/)).toBeInTheDocument(); // Members count
  });

  it('formats date correctly', () => {
    const userWithSpecificDate = {
      family: {
        name: 'Test Family',
        description: 'Test description',
        createdAt: '2023-12-25',
      },
    };

    render(<FamilyInfoCard {...defaultProps} user={userWithSpecificDate} />);

    expect(screen.getByText('12/25/2023')).toBeInTheDocument();
  });

  it('shows Unknown for invalid date', () => {
    const userWithInvalidDate = {
      family: {
        name: 'Test Family',
        description: 'Test description',
        createdAt: null,
      },
    };

    render(<FamilyInfoCard {...defaultProps} user={userWithInvalidDate} />);

    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });

  it('handles missing user prop', () => {
    render(<FamilyInfoCard {...defaultProps} user={null} />);

    expect(screen.getByText('Your Family')).toBeInTheDocument();
    expect(screen.getByText('No description provided')).toBeInTheDocument();
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });
});
