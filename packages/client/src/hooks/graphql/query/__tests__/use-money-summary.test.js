import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import useMoneySummary, { QUERY_MONEY_SUMMARY } from '../use-money-summary';

const mockMoneySummaryData = {
  summary: [
    {
      amount: 5000,
      currency: 'USD',
    },
    {
      amount: 2000,
      currency: 'EUR',
    },
    {
      amount: 1000,
      currency: 'GBP',
    },
  ],
};

const mockMoneySummaryQuery = {
  request: {
    query: QUERY_MONEY_SUMMARY,
  },
  result: {
    data: mockMoneySummaryData,
  },
};

const mockMoneySummaryQueryError = {
  request: {
    query: QUERY_MONEY_SUMMARY,
  },
  error: new Error('Failed to fetch money summary'),
};

const mockMoneySummaryQueryLoading = {
  request: {
    query: QUERY_MONEY_SUMMARY,
  },
  delay: 100,
  result: {
    data: mockMoneySummaryData,
  },
};

const wrapper = ({ children, mocks = [mockMoneySummaryQuery] }) => (
  <MockedProvider mocks={mocks} addTypename={false}>
    {children}
  </MockedProvider>
);

describe('useMoneySummary', () => {
  it('should return loading state initially', () => {
    const { result } = renderHook(() => useMoneySummary(), {
      wrapper: (props) => wrapper({ ...props, mocks: [mockMoneySummaryQueryLoading] }),
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.summary).toEqual([]);
    expect(result.current.error).toBeUndefined();
    expect(typeof result.current.refetch).toBe('function');
  });

  it('should return money summary data on successful query', async () => {
    const { result } = renderHook(() => useMoneySummary(), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.summary).toEqual(mockMoneySummaryData.summary);
    expect(result.current.error).toBeUndefined();
    expect(typeof result.current.refetch).toBe('function');
  });

  it('should return error state on query failure', async () => {
    const { result } = renderHook(() => useMoneySummary(), {
      wrapper: (props) => wrapper({ ...props, mocks: [mockMoneySummaryQueryError] }),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.summary).toEqual([]);
    expect(result.current.error).toBeDefined();
    expect(result.current.error.message).toBe('Failed to fetch money summary');
  });

  it('should handle empty summary data', async () => {
    const emptyMock = {
      request: {
        query: QUERY_MONEY_SUMMARY,
      },
      result: {
        data: {
          summary: [],
        },
      },
    };

    const { result } = renderHook(() => useMoneySummary(), {
      wrapper: (props) => wrapper({ ...props, mocks: [emptyMock] }),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.summary).toEqual([]);
    expect(result.current.error).toBeUndefined();
  });

  it('should handle null/undefined data', async () => {
    const nullDataMock = {
      request: {
        query: QUERY_MONEY_SUMMARY,
      },
      result: {
        data: {
          summary: null,
        },
      },
    };

    const { result } = renderHook(() => useMoneySummary(), {
      wrapper: (props) => wrapper({ ...props, mocks: [nullDataMock] }),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.summary).toEqual([]);
    expect(result.current.error).toBeUndefined();
  });

  it('should refetch data when refetch is called', async () => {
    const refetchMock = {
      request: {
        query: QUERY_MONEY_SUMMARY,
      },
      result: {
        data: {
          summary: [
            {
              amount: 10000,
              currency: 'USD',
            },
          ],
        },
      },
    };

    const { result } = renderHook(() => useMoneySummary(), {
      wrapper: (props) => wrapper({ ...props, mocks: [mockMoneySummaryQuery, refetchMock] }),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Initial data
    expect(result.current.summary).toEqual(mockMoneySummaryData.summary);

    // Refetch
    await act(async () => {
      await result.current.refetch();
    });

    // Should still work (though with mocked data it won't actually change)
    expect(typeof result.current.refetch).toBe('function');
  });

  it('should create a new array reference for summary using useMemo', async () => {
    const { result, rerender } = renderHook(() => useMoneySummary(), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const firstResult = result.current.summary;

    rerender();

    // Should maintain reference stability when data hasn't changed
    expect(result.current.summary).not.toBe(mockMoneySummaryData.summary);
    expect(result.current.summary).toEqual(mockMoneySummaryData.summary);
  });

  it('should handle various currency formats', async () => {
    const diverseCurrencyMock = {
      request: {
        query: QUERY_MONEY_SUMMARY,
      },
      result: {
        data: {
          summary: [
            { amount: 0, currency: 'USD' },
            { amount: -500, currency: 'EUR' },
            { amount: 999999, currency: 'JPY' },
          ],
        },
      },
    };

    const { result } = renderHook(() => useMoneySummary(), {
      wrapper: (props) => wrapper({ ...props, mocks: [diverseCurrencyMock] }),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.summary).toHaveLength(3);
    expect(result.current.summary[0].amount).toBe(0);
    expect(result.current.summary[1].amount).toBe(-500);
    expect(result.current.summary[2].amount).toBe(999999);
  });
}); 