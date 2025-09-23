import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RemoveMemberModal from '../RemoveMemberModal';

describe('RemoveMemberModal', () => {
  const mockMember = {
    id: 'member-1',
    firstName: 'John',
    lastName: 'Doe',
    roleInFamily: 'MEMBER',
  };

  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    memberToRemove: mockMember,
    onConfirm: jest.fn(),
    loading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal when open', () => {
    render(<RemoveMemberModal {...defaultProps} />);

    expect(screen.getByText('Confirm Member Removal')).toBeInTheDocument();
    expect(screen.getByText('John Doe', { exact: false })).toBeInTheDocument();
    expect(screen.getByText(/This action cannot be undone/)).toBeInTheDocument();
  });

  it('does not render modal when closed', () => {
    render(<RemoveMemberModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('displays member name correctly', () => {
    render(<RemoveMemberModal {...defaultProps} />);

    expect(screen.getByText('John Doe', { exact: false })).toBeInTheDocument();
  });

  it('calls onClose when Cancel button is clicked', () => {
    const mockOnClose = jest.fn();
    
    render(<RemoveMemberModal {...defaultProps} onClose={mockOnClose} />);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when modal close button is clicked', () => {
    const mockOnClose = jest.fn();
    
    render(<RemoveMemberModal {...defaultProps} onClose={mockOnClose} />);

    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when Remove Member button is clicked', () => {
    const mockOnConfirm = jest.fn();
    
    render(<RemoveMemberModal {...defaultProps} onConfirm={mockOnConfirm} />);

    const confirmButton = screen.getByText('Remove Member');
    fireEvent.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it('shows loading state correctly', () => {
    render(<RemoveMemberModal {...defaultProps} loading={true} />);

    const confirmButton = screen.getByText('Remove Member');
    expect(confirmButton).toBeInTheDocument();
  });

  it('handles member with missing name parts', () => {
    const memberWithMissingLastName = {
      id: 'member-1',
      firstName: 'John',
      lastName: '',
      roleInFamily: 'MEMBER',
    };

    render(
      <RemoveMemberModal 
        {...defaultProps} 
        memberToRemove={memberWithMissingLastName} 
      />
    );

    expect(screen.getByText('John')).toBeInTheDocument();
  });

  it('handles member with missing first name', () => {
    const memberWithMissingFirstName = {
      id: 'member-1',
      firstName: '',
      lastName: 'Doe',
      roleInFamily: 'MEMBER',
    };

    render(
      <RemoveMemberModal 
        {...defaultProps} 
        memberToRemove={memberWithMissingFirstName} 
      />
    );

    expect(screen.getByText('Doe')).toBeInTheDocument();
  });

  it('handles null member gracefully', () => {
    render(<RemoveMemberModal {...defaultProps} memberToRemove={null} />);

    expect(screen.getByText('Confirm Member Removal')).toBeInTheDocument();
    // Should not crash even with null member
  });

  it('handles undefined member gracefully', () => {
    render(<RemoveMemberModal {...defaultProps} memberToRemove={undefined} />);

    expect(screen.getByText('Confirm Member Removal')).toBeInTheDocument();
  });

  it('shows different member names correctly', () => {
    const differentMember = {
      id: 'member-2',
      firstName: 'Jane',
      lastName: 'Smith',
      roleInFamily: 'ADMIN',
    };

    render(
      <RemoveMemberModal 
        {...defaultProps} 
        memberToRemove={differentMember} 
      />
    );

    expect(screen.getByText('Jane Smith', { exact: false })).toBeInTheDocument();
  });

  it('renders modal structure correctly', () => {
    render(<RemoveMemberModal {...defaultProps} />);

    expect(screen.getByText('Confirm Member Removal')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Remove Member')).toBeInTheDocument();
  });

  it('shows warning message', () => {
    render(<RemoveMemberModal {...defaultProps} />);

    expect(screen.getByText(/This action cannot be undone/)).toBeInTheDocument();
  });

  it('does not disable Cancel button when loading', () => {
    render(<RemoveMemberModal {...defaultProps} loading={true} />);

    const cancelButton = screen.getByText('Cancel');
    expect(cancelButton).not.toBeDisabled();
  });

  it('shows confirmation text with member name', () => {
    render(<RemoveMemberModal {...defaultProps} />);

    expect(screen.getByText(/Are you sure you want to remove/)).toBeInTheDocument();
    expect(screen.getByText('John Doe', { exact: false })).toBeInTheDocument();
  });
});
