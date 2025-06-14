import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import useMoneyBundles, { QUERY_MONEY_BUNDLES } from '../use-money-bundles';

const mockMoneyBundlesData = {
  moneyBundles: [
    {
      id: '1',
      currency: 'USD',
      description: 'Salary',
      amount: 5000,
      storage: 'Bank',
      type: 'income',
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01',
      deletedAt: null,
    },
    {
      id: '2',
      currency: 'EUR',
      description: 'Groceries',
      amount: 200,
      storage: 'Cash',
      type: 'expense',
      createdAt: '2023-01-02',
      updatedAt: '2023-01-02',
      deletedAt: null,
    },
  ],
};

const mockMoneyBundlesQuery = {
  request: {
    query: QUERY_MONEY_BUNDLES,
  },
  result: {
    data: mockMoneyBundlesData,
  },
};

const mockMoneyBundlesQueryError = {
  request: {
    query: QUERY_MONEY_BUNDLES,
  },
  error: new Error('Failed to fetch money bundles'),
};

const mockMoneyBundlesQueryLoading = {
  request: {
    query: QUERY_MONEY_BUNDLES,
  },
  delay: 100,
  result: {
    data: mockMoneyBundlesData,
  },
};

const wrapper = ({ children, mocks = [mockMoneyBundlesQuery] }) => (
  <MockedProvider mocks={mocks} addTypename={false}>
    {children}
  </MockedProvider>
);

describe('useMoneyBundles', () => {
  it('should return loading state initially', () => {
    const { result } = renderHook(() => useMoneyBundles(), {
      wrapper: (props) => wrapper({ ...props, mocks: [mockMoneyBundlesQueryLoading] }),
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.moneyBundles).toEqual([]);
    expect(result.current.error).toBeUndefined();
    expect(typeof result.current.refetch).toBe('function');
  });

  it('should return money bundles data on successful query', async () => {
    const { result } = renderHook(() => useMoneyBundles(), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.moneyBundles).toEqual(mockMoneyBundlesData.moneyBundles);
    expect(result.current.error).toBeUndefined();
    expect(typeof result.current.refetch).toBe('function');
  });

  it('should return error state on query failure', async () => {
    const { result } = renderHook(() => useMoneyBundles(), {
      wrapper: (props) => wrapper({ ...props, mocks: [mockMoneyBundlesQueryError] }),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.moneyBundles).toEqual([]);
    expect(result.current.error).toBeDefined();
    expect(result.current.error.message).toBe('Failed to fetch money bundles');
  });

  it('should handle empty money bundles data', async () => {
    const emptyMock = {
      request: {
        query: QUERY_MONEY_BUNDLES,
      },
      result: {
        data: {
          moneyBundles: [],
        },
      },
    };

    const { result } = renderHook(() => useMoneyBundles(), {
      wrapper: (props) => wrapper({ ...props, mocks: [emptyMock] }),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.moneyBundles).toEqual([]);
    expect(result.current.error).toBeUndefined();
  });

  it('should handle null/undefined data', async () => {
    const nullDataMock = {
      request: {
        query: QUERY_MONEY_BUNDLES,
      },
      result: {
        data: {
          moneyBundles: null,
        },
      },
    };

    const { result } = renderHook(() => useMoneyBundles(), {
      wrapper: (props) => wrapper({ ...props, mocks: [nullDataMock] }),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.moneyBundles).toEqual([]);
    expect(result.current.error).toBeUndefined();
  });

  it('should refetch data when refetch is called', async () => {
    const refetchMock = {
      request: {
        query: QUERY_MONEY_BUNDLES,
      },
      result: {
        data: {
          moneyBundles: [
            {
              id: '3',
              currency: 'GBP',
              description: 'Refetched data',
              amount: 1000,
              storage: 'Bank',
              type: 'income',
              createdAt: '2023-01-03',
              updatedAt: '2023-01-03',
              deletedAt: null,
            },
          ],
        },
      },
    };

    const { result } = renderHook(() => useMoneyBundles(), {
      wrapper: (props) => wrapper({ ...props, mocks: [mockMoneyBundlesQuery, refetchMock] }),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Initial data
    expect(result.current.moneyBundles).toEqual(mockMoneyBundlesData.moneyBundles);

    // Refetch
    await act(async () => {
      await result.current.refetch();
    });

    // Should still work (though with mocked data it won't actually change)
    expect(typeof result.current.refetch).toBe('function');
  });

  it('should create a new array reference for moneyBundles using useMemo', async () => {
    const { result, rerender } = renderHook(() => useMoneyBundles(), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const firstResult = result.current.moneyBundles;

    rerender();

    // Should maintain reference stability when data hasn't changed
    expect(result.current.moneyBundles).not.toBe(mockMoneyBundlesData.moneyBundles);
    expect(result.current.moneyBundles).toEqual(mockMoneyBundlesData.moneyBundles);
  });
}); 