import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { toaster } from 'baseui/toast';
import EditIncomeModal from '../EditIncomeModal';
import { UPDATE_FAMILY_INCOME_MUTATION } from '../../../gql/income';

jest.mock('baseui/toast', () => ({
  toaster: {
    positive: jest.fn(),
    negative: jest.fn(),
  },
}));

jest.mock('../IncomeForm', () => {
  return function MockIncomeForm({ onSubmit, loading, initialValues }) {
    return (
      <div data-testid="mock-income-form">
        {initialValues && <div>Has initial values</div>}
        <button onClick={() => onSubmit({ amount: 2000 })} disabled={loading}>
          Submit
        </button>
      </div>
    );
  };
});

describe('EditIncomeModal', () => {
  const mockIncome = {
    id: '1',
    date: '2023-06-15T10:00:00.000Z',
    amount: 5000,
    note: 'Monthly salary',
    periodicity: 'monthly',
    type: { id: 't1', name: 'Salary' },
    contributor: { id: 'c1', firstName: 'John' },
    currency: { id: 'cur1', code: 'USD', symbol: '$' },
  };

  const mockOnClose = jest.fn();
  const mockRefetch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when income is not provided', () => {
    const { container } = render(
      <MockedProvider mocks={[]} addTypename={false}>
        <EditIncomeModal
          income={null}
          isOpen={true}
          onClose={mockOnClose}
          refetch={mockRefetch}
        />
      </MockedProvider>
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders modal when income is provided', () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <EditIncomeModal
          income={mockIncome}
          isOpen={true}
          onClose={mockOnClose}
          refetch={mockRefetch}
        />
      </MockedProvider>
    );

    expect(screen.getByText('Edit Income')).toBeInTheDocument();
    expect(screen.getByText('Has initial values')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <MockedProvider mocks={[]} addTypename={false}>
        <EditIncomeModal
          income={mockIncome}
          isOpen={false}
          onClose={mockOnClose}
          refetch={mockRefetch}
        />
      </MockedProvider>
    );

    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
  });

  it('prepares initial values correctly', () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <EditIncomeModal
          income={mockIncome}
          isOpen={true}
          onClose={mockOnClose}
          refetch={mockRefetch}
        />
      </MockedProvider>
    );

    expect(screen.getByText('Has initial values')).toBeInTheDocument();
  });

  it('handles income without optional fields', () => {
    const minimalIncome = {
      id: '1',
      date: '2023-01-01T00:00:00.000Z',
      amount: 100,
      periodicity: 'once',
      note: null,
      currency: null,
      type: null,
      contributor: null,
    };

    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <EditIncomeModal
          income={minimalIncome}
          isOpen={true}
          onClose={mockOnClose}
          refetch={mockRefetch}
        />
      </MockedProvider>
    );

    expect(screen.getByText('Edit Income')).toBeInTheDocument();
  });

  it('calls mutation on success', async () => {
    const mocks = [
      {
        request: {
          query: UPDATE_FAMILY_INCOME_MUTATION,
          variables: {
            updates: [{ id: '1', amount: 2000 }],
          },
        },
        result: {
          data: {
            updateFamilyIncome: { success: true },
          },
        },
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <EditIncomeModal
          income={mockIncome}
          isOpen={true}
          onClose={mockOnClose}
          refetch={mockRefetch}
        />
      </MockedProvider>
    );

    const submitBtn = screen.getByText('Submit');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(toaster.positive).toHaveBeenCalledWith('Income updated successfully', {});
    });

    expect(mockRefetch).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows error toast on mutation error', async () => {
    const mocks = [
      {
        request: {
          query: UPDATE_FAMILY_INCOME_MUTATION,
          variables: {
            updates: [{ id: '1', amount: 2000 }],
          },
        },
        error: new Error('Test error'),
      },
    ];

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <EditIncomeModal
          income={mockIncome}
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
        expect.stringContaining('Failed to update income'),
        {}
      );
    });

    expect(mockRefetch).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('calls onClose when modal is closed', () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <EditIncomeModal
          income={mockIncome}
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
