import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { toaster } from 'baseui/toast';
import AddIncomeModal from '../AddIncomeModal';
import { CREATE_FAMILY_INCOME_MUTATION } from '../../../gql/income';

jest.mock('baseui/toast', () => ({
  toaster: {
    positive: jest.fn(),
    negative: jest.fn(),
  },
}));

jest.mock('../IncomeForm', () => {
  return function MockIncomeForm({ onSubmit, loading }) {
    return (
      <div data-testid="mock-income-form">
        <button onClick={() => onSubmit({ amount: 1000 })} disabled={loading}>
          Submit
        </button>
      </div>
    );
  };
});

describe('AddIncomeModal', () => {
  const mockOnClose = jest.fn();
  const mockRefetch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal when isOpen is true', () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <AddIncomeModal
          isOpen={true}
          onClose={mockOnClose}
          refetch={mockRefetch}
        />
      </MockedProvider>
    );

    expect(screen.getByText('Add Income')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <MockedProvider mocks={[]} addTypename={false}>
        <AddIncomeModal
          isOpen={false}
          onClose={mockOnClose}
          refetch={mockRefetch}
        />
      </MockedProvider>
    );

    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
  });

  it('calls mutation on success', async () => {
    const mocks = [
      {
        request: {
          query: CREATE_FAMILY_INCOME_MUTATION,
          variables: {
            familyIncomes: [{ amount: 1000 }],
          },
        },
        result: {
          data: {
            createFamilyIncome: { success: true },
          },
        },
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <AddIncomeModal
          isOpen={true}
          onClose={mockOnClose}
          refetch={mockRefetch}
        />
      </MockedProvider>
    );

    const submitBtn = screen.getByText('Submit');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(toaster.positive).toHaveBeenCalledWith('Income added successfully', {});
    });

    expect(mockRefetch).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows error toast on mutation error', async () => {
    const mocks = [
      {
        request: {
          query: CREATE_FAMILY_INCOME_MUTATION,
          variables: {
            familyIncomes: [{ amount: 1000 }],
          },
        },
        error: new Error('Test error'),
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <AddIncomeModal
          isOpen={true}
          onClose={mockOnClose}
          refetch={mockRefetch}
        />
      </MockedProvider>
    );

    const submitBtn = screen.getByText('Submit');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(toaster.negative).toHaveBeenCalledWith(
        'Failed to add income: Test error',
        {}
      );
    });

    expect(mockRefetch).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('calls onClose when modal is closed', () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <AddIncomeModal
          isOpen={true}
          onClose={mockOnClose}
          refetch={mockRefetch}
        />
      </MockedProvider>
    );

    const closeBtn = screen.getByLabelText('Close');
    fireEvent.click(closeBtn);

    expect(mockOnClose).toHaveBeenCalled();
  });
});
