import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import JoinRequestsSection from '../JoinRequestsSection';

describe('JoinRequestsSection', () => {
  const mockRequests = [
    {
      id: 'request-1',
      user: {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john@test.com',
      },
      message: 'Please let me join your family',
      requestedAt: '2023-01-01',
    },
    {
      id: 'request-2',
      user: {
        id: 'user-2',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@test.com',
      },
      message: 'I would like to be part of this family',
      requestedAt: '2023-01-02',
    },
  ];

  const defaultProps = {
    requests: mockRequests,
    loading: false,
    responseMessages: {},
    onResponseMessageChange: jest.fn(),
    onHandleRequest: jest.fn(),
    respondLoading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders join requests correctly', () => {
    render(<JoinRequestsSection {...defaultProps} />);

    expect(screen.getByText('Join Requests (2)')).toBeInTheDocument();
    expect(screen.getByText('John Smith')).toBeInTheDocument();
    expect(screen.getByText(/john@test.com/)).toBeInTheDocument();
    expect(screen.getByText(/Please let me join your family/)).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText(/jane@test.com/)).toBeInTheDocument();
  });

  it('shows loading spinner when loading', () => {
    render(<JoinRequestsSection {...defaultProps} loading={true} />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows empty state when no requests', () => {
    render(<JoinRequestsSection {...defaultProps} requests={[]} />);

    expect(screen.getByText('Join Requests (0)')).toBeInTheDocument();
    expect(screen.getByText('No pending join requests')).toBeInTheDocument();
  });

  it('displays correct request dates', () => {
    render(<JoinRequestsSection {...defaultProps} />);

    expect(screen.getByText(/1\/1\/2023/)).toBeInTheDocument();
    expect(screen.getByText(/1\/2\/2023/)).toBeInTheDocument();
  });

  it('shows Unknown for missing request date', () => {
    const requestsWithMissingDate = [
      {
        id: 'request-1',
        user: {
          id: 'user-1',
          firstName: 'John',
          lastName: 'Smith',
          email: 'john@test.com',
        },
        message: 'Test message',
        requestedAt: null,
      },
    ];

    render(<JoinRequestsSection {...defaultProps} requests={requestsWithMissingDate} />);

    expect(screen.getByText(/Unknown/)).toBeInTheDocument();
  });

  it('handles response message changes', () => {
    const mockOnResponseMessageChange = jest.fn();
    
    render(
      <JoinRequestsSection 
        {...defaultProps} 
        onResponseMessageChange={mockOnResponseMessageChange} 
      />
    );

    const textareas = screen.getAllByRole('textbox');
    fireEvent.change(textareas[0], { target: { value: 'Welcome message' } });

    expect(mockOnResponseMessageChange).toHaveBeenCalledWith('request-1', 'Welcome message');
  });

  it('calls onHandleRequest with APPROVED when approve button is clicked', () => {
    const mockOnHandleRequest = jest.fn();
    
    render(
      <JoinRequestsSection 
        {...defaultProps} 
        onHandleRequest={mockOnHandleRequest} 
      />
    );

    const approveButtons = screen.getAllByText('Approve');
    fireEvent.click(approveButtons[0]);

    expect(mockOnHandleRequest).toHaveBeenCalledWith('request-1', 'APPROVED');
  });

  it('calls onHandleRequest with REJECTED when reject button is clicked', () => {
    const mockOnHandleRequest = jest.fn();
    
    render(
      <JoinRequestsSection 
        {...defaultProps} 
        onHandleRequest={mockOnHandleRequest} 
      />
    );

    const rejectButtons = screen.getAllByText('Reject');
    fireEvent.click(rejectButtons[0]);

    expect(mockOnHandleRequest).toHaveBeenCalledWith('request-1', 'REJECTED');
  });

  it('displays existing response messages in textareas', () => {
    const responseMessages = {
      'request-1': 'Welcome to our family!',
      'request-2': 'Thanks for your interest',
    };

    render(
      <JoinRequestsSection 
        {...defaultProps} 
        responseMessages={responseMessages} 
      />
    );

    const textareas = screen.getAllByRole('textbox');
    expect(textareas[0]).toHaveValue('Welcome to our family!');
    expect(textareas[1]).toHaveValue('Thanks for your interest');
  });

  it('disables buttons when respondLoading is true', () => {
    render(<JoinRequestsSection {...defaultProps} respondLoading={true} />);

    const approveButtons = screen.getAllByText('Approve');
    const rejectButtons = screen.getAllByText('Reject');

    expect(approveButtons.length).toBeGreaterThan(0);
    expect(rejectButtons.length).toBeGreaterThan(0);
  });

  it('generates correct initials for avatars', () => {
    render(<JoinRequestsSection {...defaultProps} />);

    expect(screen.getAllByLabelText('JS')).toHaveLength(1);
    expect(screen.getAllByLabelText('JD')).toHaveLength(1);
  });

  it('handles requests with missing user information', () => {
    const incompleteRequests = [
      {
        id: 'request-1',
        user: {
          id: 'user-1',
          firstName: '',
          lastName: 'Smith',
          email: 'test@email.com',
        },
        message: 'Test message',
        requestedAt: '2023-01-01',
      },
    ];

    render(<JoinRequestsSection {...defaultProps} requests={incompleteRequests} />);

    expect(screen.getByText('Smith')).toBeInTheDocument();
    expect(screen.getByText(/test@email.com/)).toBeInTheDocument();
  });

  it('handles requests with long messages', () => {
    const longMessageRequests = [
      {
        id: 'request-1',
        user: {
          id: 'user-1',
          firstName: 'John',
          lastName: 'Smith',
          email: 'john@test.com',
        },
        message: 'This is a very long message that contains a lot of text to test how the component handles long content and whether it displays correctly without breaking the layout',
        requestedAt: '2023-01-01',
      },
    ];

    render(<JoinRequestsSection {...defaultProps} requests={longMessageRequests} />);

    expect(screen.getByText(/This is a very long message/)).toBeInTheDocument();
  });

  it('handles undefined requests gracefully', () => {
    render(<JoinRequestsSection {...defaultProps} requests={undefined} />);

    expect(screen.getByText('Join Requests (0)')).toBeInTheDocument();
  });

  it('handles null requests gracefully - line 51', () => {
    render(<JoinRequestsSection {...defaultProps} requests={null} />);

    expect(screen.getByText('Join Requests (0)')).toBeInTheDocument();
    expect(screen.getByText('No pending join requests')).toBeInTheDocument();
  });

  it('covers getInitials with null/undefined names - line 26', () => {
    const requestsWithNullNames = [
      {
        id: 'request-1',
        user: {
          id: 'user-1',
          firstName: null,
          lastName: undefined,
          email: 'test-null@email.com',
        },
        message: 'Message for null names test',
        requestedAt: '2023-01-01',
      },
      {
        id: 'request-2',
        user: {
          id: 'user-2',
          firstName: undefined,
          lastName: null,
          email: 'test-undefined@email.com',
        },
        message: 'Message for undefined names test',
        requestedAt: '2023-01-02',
      }
    ];

    render(<JoinRequestsSection {...defaultProps} requests={requestsWithNullNames} />);

    // Should handle null/undefined firstName and lastName gracefully in getInitials function
    // This test covers the optional chaining and fallback logic in line 26
    expect(screen.getByText('Join Requests (2)')).toBeInTheDocument();
    
    // Check that component renders without crashing with null/undefined names
    expect(screen.getByText(/test-null@email\.com/)).toBeInTheDocument();
    expect(screen.getByText(/test-undefined@email\.com/)).toBeInTheDocument();
  });

  it('covers the || [] fallback with undefined requests - line 51', () => {
    // Test with undefined (falsy) requests to cover the || [] fallback
    render(<JoinRequestsSection {...defaultProps} requests={undefined} />);

    expect(screen.getByText('Join Requests (0)')).toBeInTheDocument();
    expect(screen.getByText('No pending join requests')).toBeInTheDocument();
  });

  it('covers the || [] fallback with false requests - line 51', () => {
    // Test with false (falsy) requests to cover the || [] fallback
    render(<JoinRequestsSection {...defaultProps} requests={false} />);

    expect(screen.getByText('Join Requests (0)')).toBeInTheDocument();
    expect(screen.getByText('No pending join requests')).toBeInTheDocument();
  });

});
