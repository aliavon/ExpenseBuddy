import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import FamilyIncomeDashboard, { getDefaultDateRange } from '../FamilyIncomeDashboard';
import { GET_FAMILY_INCOME_RECORDS_QUERY } from '../../../gql/income';

jest.mock('../FamilyIncomeFilters', () => {
  return function MockFamilyIncomeFilters({ onFilterChange, initialFilters }) {
    return (
      <div data-testid="mock-filters">
        <button onClick={() => onFilterChange({ dateFrom: '2020-01-01', dateTo: '2020-12-31' })}>
          Apply Filters
        </button>
      </div>
    );
  };
});

jest.mock('../FamilyIncomeTable', () => {
  return function MockFamilyIncomeTable({ data, onEdit, onDelete }) {
    return (
      <div data-testid="mock-table">
        <div>Records: {data.length}</div>
        <button onClick={() => onEdit({ id: '1' })}>Edit</button>
        <button onClick={() => onDelete({ id: '1' })}>Delete</button>
      </div>
    );
  };
});

jest.mock('../AddIncomeModal', () => {
  return function MockAddIncomeModal({ isOpen, onClose, refetch }) {
    return isOpen ? (
      <div data-testid="mock-add-modal">
        <button onClick={onClose}>Close Add</button>
        <button onClick={refetch}>Refetch</button>
      </div>
    ) : null;
  };
});

jest.mock('../EditIncomeModal', () => {
  return function MockEditIncomeModal({ income, isOpen, onClose, refetch }) {
    return isOpen ? (
      <div data-testid="mock-edit-modal">
        <div>Editing: {income?.id}</div>
        <button onClick={onClose}>Close Edit</button>
        <button onClick={refetch}>Refetch</button>
      </div>
    ) : null;
  };
});

jest.mock('../DeleteIncomeDialog', () => {
  return function MockDeleteIncomeDialog({ income, isOpen, onClose, refetch }) {
    return isOpen ? (
      <div data-testid="mock-delete-dialog">
        <div>Deleting: {income?.id}</div>
        <button onClick={onClose}>Close Delete</button>
        <button onClick={refetch}>Refetch</button>
      </div>
    ) : null;
  };
});

jest.mock('../charts/IncomeStatisticsCards', () => {
  return function MockIncomeStatisticsCards({ dateFrom, dateTo }) {
    return (
      <div data-testid="mock-statistics">
        Statistics: {dateFrom} - {dateTo}
      </div>
    );
  };
});

jest.mock('../charts/IncomeByTypeChart', () => {
  return function MockIncomeByTypeChart({ dateFrom, dateTo }) {
    return (
      <div data-testid="mock-type-chart">
        Type Chart: {dateFrom} - {dateTo}
      </div>
    );
  };
});

jest.mock('../charts/IncomeByContributorChart', () => {
  return function MockIncomeByContributorChart({ dateFrom, dateTo }) {
    return (
      <div data-testid="mock-contributor-chart">
        Contributor Chart: {dateFrom} - {dateTo}
      </div>
    );
  };
});

const mockIncomeData = {
  getFamilyIncomeRecords: {
    items: [
      {
        id: '1',
        date: '2020-01-15',
        amount: 5000,
        note: 'Salary',
        periodicity: 'ONE_TIME',
        type: { id: 't1', name: 'Salary', description: 'Monthly salary' },
        contributor: { id: 'u1', fullName: 'John Doe' },
        currency: { id: 'c1', code: 'USD', name: 'US Dollar', symbol: '$' },
      },
      {
        id: '2',
        date: '2020-02-15',
        amount: 3000,
        note: 'Bonus',
        periodicity: 'ONE_TIME',
        type: { id: 't2', name: 'Bonus', description: 'Annual bonus' },
        contributor: { id: 'u1', fullName: 'John Doe' },
        currency: { id: 'c1', code: 'USD', name: 'US Dollar', symbol: '$' },
      },
    ],
    pagination: {
      currentPage: 1,
      nextPage: null,
      totalPages: 1,
      totalCount: 2,
    },
  },
};

describe('FamilyIncomeDashboard', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2020, 3, 1));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDefaultDateRange', () => {
    it('returns start of year and today', () => {
      const [dateFrom, dateTo] = getDefaultDateRange();
      
      expect(dateFrom.getMonth()).toBe(0);
      expect(dateFrom.getDate()).toBe(1);
      expect(dateFrom.getHours()).toBe(0);
      expect(dateFrom.getMinutes()).toBe(0);
      expect(dateFrom.getSeconds()).toBe(0);
      expect(dateFrom.getMilliseconds()).toBe(0);
      
      expect(dateTo).toBeInstanceOf(Date);
    });
  });

  describe('Loading State', () => {
    it('shows spinner when loading', () => {
      const mocks = [];

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <FamilyIncomeDashboard />
        </MockedProvider>
      );

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('shows error notification on query error', async () => {
      const [dateFrom, dateTo] = getDefaultDateRange();
      const mocks = [
        {
          request: {
            query: GET_FAMILY_INCOME_RECORDS_QUERY,
            variables: {
              filters: {
                dateFrom: dateFrom.toISOString(),
                dateTo: dateTo.toISOString(),
              },
              pagination: { page: 1, limit: 1000 },
              sort: { sortBy: 'date', sortOrder: 'desc' },
            },
          },
          error: new Error('Network error'),
        },
      ];

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <FamilyIncomeDashboard />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/Failed to load income records/)).toBeInTheDocument();
      });
    });
  });

  describe('Component Rendering', () => {
    it('handles empty data', async () => {
      const [dateFrom, dateTo] = getDefaultDateRange();
      const emptyMocks = [
        {
          request: {
            query: GET_FAMILY_INCOME_RECORDS_QUERY,
            variables: {
              filters: {
                dateFrom: dateFrom.toISOString(),
                dateTo: dateTo.toISOString(),
              },
              pagination: { page: 1, limit: 1000 },
              sort: { sortBy: 'date', sortOrder: 'desc' },
            },
          },
          result: {
            data: {
              getFamilyIncomeRecords: {
                items: [],
                pagination: {
                  currentPage: 1,
                  nextPage: null,
                  totalPages: 0,
                  totalCount: 0,
                },
              },
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={emptyMocks} addTypename={false}>
          <FamilyIncomeDashboard />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Records: 0')).toBeInTheDocument();
      });
    });

    it('handles null items', async () => {
      const [dateFrom, dateTo] = getDefaultDateRange();
      const nullItemsMocks = [
        {
          request: {
            query: GET_FAMILY_INCOME_RECORDS_QUERY,
            variables: {
              filters: {
                dateFrom: dateFrom.toISOString(),
                dateTo: dateTo.toISOString(),
              },
              pagination: { page: 1, limit: 1000 },
              sort: { sortBy: 'date', sortOrder: 'desc' },
            },
          },
          result: {
            data: {
              getFamilyIncomeRecords: {
                items: null,
                pagination: {
                  currentPage: 1,
                  nextPage: null,
                  totalPages: 0,
                  totalCount: 0,
                },
              },
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={nullItemsMocks} addTypename={false}>
          <FamilyIncomeDashboard />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Records: 0')).toBeInTheDocument();
      });
    });
  });

  describe('Tabs', () => {
    it('renders tabs', async () => {
      const [dateFrom, dateTo] = getDefaultDateRange();
      const mocks = [
        {
          request: {
            query: GET_FAMILY_INCOME_RECORDS_QUERY,
            variables: {
              filters: {
                dateFrom: dateFrom.toISOString(),
                dateTo: dateTo.toISOString(),
              },
              pagination: { page: 1, limit: 1000 },
              sort: { sortBy: 'date', sortOrder: 'desc' },
            },
          },
          result: {
            data: mockIncomeData,
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks} addTypename={false}>
          <FamilyIncomeDashboard />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Records: 2')).toBeInTheDocument();
      });

      expect(screen.getByText('Records')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
    });
  });

});
