import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FamilyMembersList from '../FamilyMembersList';

describe('FamilyMembersList', () => {
  const mockMembers = [
    {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      roleInFamily: 'OWNER',
      createdAt: '2023-01-01',
    },
    {
      id: '2',
      firstName: 'Jane',
      lastName: 'Smith',
      roleInFamily: 'ADMIN',
      createdAt: '2023-01-02',
    },
    {
      id: '3',
      firstName: 'Bob',
      lastName: 'Johnson',
      roleInFamily: 'MEMBER',
      createdAt: '2023-01-03',
    },
  ];

  const defaultProps = {
    members: mockMembers,
    loading: false,
    isOwner: false,
    onRemoveMember: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders members list correctly', () => {
    render(<FamilyMembersList {...defaultProps} />);

    expect(screen.getByText('Family Members (3)')).toBeInTheDocument();
    expect(screen.getByText(/John Doe/)).toBeInTheDocument();
    expect(screen.getByText(/Jane Smith/)).toBeInTheDocument(); 
    expect(screen.getByText(/Bob Johnson/)).toBeInTheDocument();
  });

  it('shows loading spinner when loading', () => {
    render(<FamilyMembersList {...defaultProps} loading={true} />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByLabelText('loading')).toBeInTheDocument();
  });

  it('shows empty state when no members', () => {
    render(<FamilyMembersList {...defaultProps} members={[]} />);

    expect(screen.getByText('Family Members (0)')).toBeInTheDocument();
    // No members to render, so just check the count is correct
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });

  it('shows remove button only for owners and excludes owner member', () => {
    render(<FamilyMembersList {...defaultProps} isOwner={true} />);

    // Should have remove buttons for non-owners only
    const removeButtons = screen.getAllByText('Remove');
    expect(removeButtons).toHaveLength(2); // Jane and Bob, but not John (owner)
  });

  it('does not show remove button for non-owners', () => {
    render(<FamilyMembersList {...defaultProps} isOwner={false} />);

    expect(screen.queryByText('Remove')).not.toBeInTheDocument();
  });

  it('calls onRemoveMember when remove button is clicked', () => {
    const mockOnRemoveMember = jest.fn();
    
    render(
      <FamilyMembersList 
        {...defaultProps} 
        isOwner={true}
        onRemoveMember={mockOnRemoveMember} 
      />
    );

    const removeButtons = screen.getAllByText('Remove');
    fireEvent.click(removeButtons[0]); // Click first remove button (Jane)

    expect(mockOnRemoveMember).toHaveBeenCalledTimes(1);
    expect(mockOnRemoveMember).toHaveBeenCalledWith(mockMembers[1]); // Jane
  });

  it('displays correct role badges', () => {
    render(<FamilyMembersList {...defaultProps} />);

    expect(screen.getByText('OWNER')).toBeInTheDocument();
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
    expect(screen.getByText('MEMBER')).toBeInTheDocument();
  });

  it('displays correct join dates', () => {
    render(<FamilyMembersList {...defaultProps} />);

    expect(screen.getByText(/1\/1\/2023/)).toBeInTheDocument();
    expect(screen.getByText(/1\/2\/2023/)).toBeInTheDocument();
    expect(screen.getByText(/1\/3\/2023/)).toBeInTheDocument();
  });

  it('shows Unknown for missing join date', () => {
    const membersWithMissingDate = [
      {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        roleInFamily: 'OWNER',
        createdAt: null,
      },
    ];

    render(<FamilyMembersList {...defaultProps} members={membersWithMissingDate} />);

    expect(screen.getByText(/Unknown/)).toBeInTheDocument();
  });

  it('generates correct initials for avatars', () => {
    render(<FamilyMembersList {...defaultProps} />);

    expect(screen.getAllByLabelText('JD')).toHaveLength(1);
    expect(screen.getAllByLabelText('JS')).toHaveLength(1);
    expect(screen.getAllByLabelText('BJ')).toHaveLength(1);
  });

  it('handles members with missing name parts', () => {
    const membersWithMissingNames = [
      {
        id: '1',
        firstName: '',
        lastName: 'Doe',
        roleInFamily: 'MEMBER',
        createdAt: '2023-01-01',
      },
      {
        id: '2',
        firstName: 'Jane',
        lastName: '',
        roleInFamily: 'MEMBER',
        createdAt: '2023-01-02',
      },
    ];

    render(<FamilyMembersList {...defaultProps} members={membersWithMissingNames} />);

    expect(screen.getByText('Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane')).toBeInTheDocument();
  });

  it('handles undefined members gracefully', () => {
    render(<FamilyMembersList {...defaultProps} members={undefined} />);

    expect(screen.getByText('Family Members (0)')).toBeInTheDocument();
  });

  it('shows correct count with different member counts', () => {
    render(<FamilyMembersList {...defaultProps} members={[mockMembers[0]]} />);

    expect(screen.getByText('Family Members (1)')).toBeInTheDocument();
  });
});
