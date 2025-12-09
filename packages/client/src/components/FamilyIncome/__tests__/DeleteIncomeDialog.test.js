import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { toaster } from 'baseui/toast';
import DeleteIncomeDialog from '../DeleteIncomeDialog';
import { DELETE_FAMILY_INCOME_MUTATION } from '../../../gql/income';

jest.mock('baseui/toast', () => ({
  toaster: {
    positive: jest.fn(),
    negative: jest.fn(),
  },
}));

describe('DeleteIncomeDialog', () => {
  const mockIncome = {
    id: '1',
    amount: 5000,
    date: '2023-06-15T10:00:00.000Z',
    currency: {
      symbol: '$',
      code: 'USD',
    },
  };

  const mockOnClose = jest.fn();
  const mockRefetch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders nothing when income is null', () => {
      const { container } = render(
        <MockedProvider mocks={[]} addTypename={false}>
          <DeleteIncomeDialog
            income={null}
            isOpen={true}
            onClose={mockOnClose}
            refetch={mockRefetch}
          />
        </MockedProvider>
      );

      expect(container.firstChild).toBeNull();
    });

    it('renders nothing when income is undefined', () => {
      const { container } = render(
        <MockedProvider mocks={[]} addTypename={false}>
          <DeleteIncomeDialog
            income={undefined}
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
          <DeleteIncomeDialog
            income={mockIncome}
            isOpen={true}
            onClose={mockOnClose}
            refetch={mockRefetch}
          />
        </MockedProvider>
      );

      expect(screen.getByText('Delete Income?')).toBeInTheDocument();
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
      expect(screen.getByText(/this action cannot be undone/i)).toBeInTheDocument();
    });

    it('displays income details correctly', () => {
      render(
        <MockedProvider mocks={[]} addTypename={false}>
          <DeleteIncomeDialog
            income={mockIncome}
            isOpen={true}
            onClose={mockOnClose}
            refetch={mockRefetch}
          />
        </MockedProvider>
      );

      expect(screen.getByText((content, element) => {
        return element.tagName.toLowerCase() === 'strong' && content.includes('5000');
      })).toBeInTheDocument();
      expect(screen.getByText(/\$/)).toBeInTheDocument();
    });

    it('displays formatted date correctly', () => {
      render(
        <MockedProvider mocks={[]} addTypename={false}>
          <DeleteIncomeDialog
            income={mockIncome}
            isOpen={true}
            onClose={mockOnClose}
            refetch={mockRefetch}
          />
        </MockedProvider>
      );

      const formattedDate = new Date('2023-06-15T10:00:00.000Z').toLocaleDateString();
      expect(screen.getByText(formattedDate, { exact: false })).toBeInTheDocument();
    });

    it('handles income without currency symbol', () => {
      const incomeWithoutSymbol = {
        ...mockIncome,
        currency: { code: 'USD' }, // No symbol
      };

      render(
        <MockedProvider mocks={[]} addTypename={false}>
          <DeleteIncomeDialog
            income={incomeWithoutSymbol}
            isOpen={true}
            onClose={mockOnClose}
            refetch={mockRefetch}
          />
        </MockedProvider>
      );

      expect(screen.getByText('5000')).toBeInTheDocument();
    });

    it('handles income without currency at all', () => {
      const incomeNoCurrency = {
        ...mockIncome,
        currency: null,
      };

      render(
        <MockedProvider mocks={[]} addTypename={false}>
          <DeleteIncomeDialog
            income={incomeNoCurrency}
            isOpen={true}
            onClose={mockOnClose}
            refetch={mockRefetch}
          />
        </MockedProvider>
      );

      expect(screen.getByText('5000')).toBeInTheDocument();
    });

    it('renders Cancel button', () => {
      render(
        <MockedProvider mocks={[]} addTypename={false}>
          <DeleteIncomeDialog
            income={mockIncome}
            isOpen={true}
            onClose={mockOnClose}
            refetch={mockRefetch}
          />
        </MockedProvider>
      );

      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('renders Delete button', () => {
      render(
        <MockedProvider mocks={[]} addTypename={false}>
          <DeleteIncomeDialog
            income={mockIncome}
            isOpen={true}
            onClose={mockOnClose}
            refetch={mockRefetch}
          />
        </MockedProvider>
      );

      expect(screen.getByText('Delete')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls onClose when Cancel button is clicked', () => {
      render(
        <MockedProvider mocks={[]} addTypename={false}>
          <DeleteIncomeDialog
            income={mockIncome}
            isOpen={true}
            onClose={mockOnClose}
            refetch={mockRefetch}
          />
        </MockedProvider>
      );

      fireEvent.click(screen.getByText('Cancel'));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls mutation when Delete button is clicked', async () => {
      const mocks = [
        {
          request: {
            query: DELETE_FAMILY_INCOME_MUTATION,
            variables: {
              ids: ['1'],
            },
          },
          result: {
            data: {
              deleteFamilyIncome: {
                success: true,
              },
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <DeleteIncomeDialog
            income={mockIncome}
            isOpen={true}
            onClose={mockOnClose}
            refetch={mockRefetch}
          />
        </MockedProvider>
      );

      fireEvent.click(screen.getByText('Delete'));

      await waitFor(() => {
        expect(toaster.positive).toHaveBeenCalledWith('Income deleted successfully', {});
      });

      expect(mockRefetch).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('shows error toast when mutation fails', async () => {
      const mocks = [
        {
          request: {
            query: DELETE_FAMILY_INCOME_MUTATION,
            variables: {
              ids: ['1'],
            },
          },
          error: new Error('Network error'),
        },
      ];

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <DeleteIncomeDialog
            income={mockIncome}
            isOpen={true}
            onClose={mockOnClose}
            refetch={mockRefetch}
          />
        </MockedProvider>
      );

      fireEvent.click(screen.getByText('Delete'));

      await waitFor(() => {
        expect(toaster.negative).toHaveBeenCalledWith(
          expect.stringContaining('Failed to delete income'),
          {}
        );
      });

      expect(mockRefetch).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('disables buttons while loading', async () => {
      const mocks = [
        {
          request: {
            query: DELETE_FAMILY_INCOME_MUTATION,
            variables: {
              ids: ['1'],
            },
          },
          result: {
            data: {
              deleteFamilyIncome: {
                success: true,
              },
            },
          },
          delay: 100,
        },
      ];

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <DeleteIncomeDialog
            income={mockIncome}
            isOpen={true}
            onClose={mockOnClose}
            refetch={mockRefetch}
          />
        </MockedProvider>
      );

      const deleteButton = screen.getByText('Delete');
      const cancelButton = screen.getByText('Cancel');

      fireEvent.click(deleteButton);

      // Buttons should be disabled during mutation
      await waitFor(() => {
        expect(cancelButton).toBeDisabled();
      });
    });
  });

  describe('Props validation', () => {
    it('uses isOpen prop correctly', () => {
      const { rerender, container } = render(
        <MockedProvider mocks={[]} addTypename={false}>
          <DeleteIncomeDialog
            income={mockIncome}
            isOpen={false}
            onClose={mockOnClose}
            refetch={mockRefetch}
          />
        </MockedProvider>
      );

      // Modal should exist but not be visible
      expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();

      rerender(
        <MockedProvider mocks={[]} addTypename={false}>
          <DeleteIncomeDialog
            income={mockIncome}
            isOpen={true}
            onClose={mockOnClose}
            refetch={mockRefetch}
          />
        </MockedProvider>
      );

      // Now modal should be visible
      expect(screen.getByText('Delete Income?')).toBeInTheDocument();
    });

    it('handles refetch being called on success', async () => {
      const mocks = [
        {
          request: {
            query: DELETE_FAMILY_INCOME_MUTATION,
            variables: {
              ids: ['1'],
            },
          },
          result: {
            data: {
              deleteFamilyIncome: {
                success: true,
              },
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <DeleteIncomeDialog
            income={mockIncome}
            isOpen={true}
            onClose={mockOnClose}
            refetch={mockRefetch}
          />
        </MockedProvider>
      );

      fireEvent.click(screen.getByText('Delete'));

      await waitFor(() => {
        expect(mockRefetch).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Edge cases', () => {
    it('handles income with missing properties gracefully', () => {
      const minimalIncome = {
        id: '1',
        amount: 100,
        date: '2023-01-01T00:00:00.000Z',
      };

      expect(() => {
        render(
          <MockedProvider mocks={[]} addTypename={false}>
            <DeleteIncomeDialog
              income={minimalIncome}
              isOpen={true}
              onClose={mockOnClose}
              refetch={mockRefetch}
            />
          </MockedProvider>
        );
      }).not.toThrow();
    });

    it('handles very large amount numbers', () => {
      const largeIncome = {
        ...mockIncome,
        amount: 999999999.99,
      };

      render(
        <MockedProvider mocks={[]} addTypename={false}>
          <DeleteIncomeDialog
            income={largeIncome}
            isOpen={true}
            onClose={mockOnClose}
            refetch={mockRefetch}
          />
        </MockedProvider>
      );

      expect(screen.getByText((content, element) => {
        return element.tagName.toLowerCase() === 'strong' && content.includes('999999999.99');
      })).toBeInTheDocument();
    });

    it('handles negative amount numbers', () => {
      const negativeIncome = {
        ...mockIncome,
        amount: -500,
      };

      render(
        <MockedProvider mocks={[]} addTypename={false}>
          <DeleteIncomeDialog
            income={negativeIncome}
            isOpen={true}
            onClose={mockOnClose}
            refetch={mockRefetch}
          />
        </MockedProvider>
      );

      expect(screen.getByText((content, element) => {
        return element.tagName.toLowerCase() === 'strong' && content.includes('-500');
      })).toBeInTheDocument();
    });

    it('handles zero amount', () => {
      const zeroIncome = {
        ...mockIncome,
        amount: 0,
      };

      render(
        <MockedProvider mocks={[]} addTypename={false}>
          <DeleteIncomeDialog
            income={zeroIncome}
            isOpen={true}
            onClose={mockOnClose}
            refetch={mockRefetch}
          />
        </MockedProvider>
      );

      expect(screen.getByText((content, element) => {
        return element.tagName.toLowerCase() === 'strong' && content.includes('0');
      })).toBeInTheDocument();
    });
  });
});

