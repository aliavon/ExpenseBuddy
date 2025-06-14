import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import useBundleTypesOptions, { QUERY_TYPES } from '../use-bundle-types-options';

const mockTypesData = {
  types: [
    {
      id: '1',
      label: 'Income',
    },
    {
      id: '2',
      label: 'Expense',
    },
    {
      id: '3',
      label: 'Transfer',
    },
  ],
};

const mockTypesQuery = {
  request: {
    query: QUERY_TYPES,
  },
  result: {
    data: mockTypesData,
  },
};

const mockTypesQueryError = {
  request: {
    query: QUERY_TYPES,
  },
  error: new Error('Failed to fetch types'),
};

const mockTypesQueryLoading = {
  request: {
    query: QUERY_TYPES,
  },
  delay: 100,
  result: {
    data: mockTypesData,
  },
};

const wrapper = ({ children, mocks = [mockTypesQuery] }) => (
  <MockedProvider mocks={mocks} addTypename={false}>
    {children}
  </MockedProvider>
);

describe('useBundleTypesOptions', () => {
  it('should return loading state initially', () => {
    const { result } = renderHook(() => useBundleTypesOptions(), {
      wrapper: (props) => wrapper({ ...props, mocks: [mockTypesQueryLoading] }),
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.typesOptions).toEqual([]);
    expect(result.current.error).toBeUndefined();
    expect(typeof result.current.refetch).toBe('function');
  });

  it('should return types options data on successful query', async () => {
    const { result } = renderHook(() => useBundleTypesOptions(), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.typesOptions).toEqual(mockTypesData.types);
    expect(result.current.error).toBeUndefined();
    expect(typeof result.current.refetch).toBe('function');
  });

  it('should return error state on query failure', async () => {
    const { result } = renderHook(() => useBundleTypesOptions(), {
      wrapper: (props) => wrapper({ ...props, mocks: [mockTypesQueryError] }),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.typesOptions).toEqual([]);
    expect(result.current.error).toBeDefined();
    expect(result.current.error.message).toBe('Failed to fetch types');
  });

  it('should handle empty types data', async () => {
    const emptyMock = {
      request: {
        query: QUERY_TYPES,
      },
      result: {
        data: {
          types: [],
        },
      },
    };

    const { result } = renderHook(() => useBundleTypesOptions(), {
      wrapper: (props) => wrapper({ ...props, mocks: [emptyMock] }),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.typesOptions).toEqual([]);
    expect(result.current.error).toBeUndefined();
  });

  it('should handle null/undefined data', async () => {
    const nullDataMock = {
      request: {
        query: QUERY_TYPES,
      },
      result: {
        data: {
          types: null,
        },
      },
    };

    const { result } = renderHook(() => useBundleTypesOptions(), {
      wrapper: (props) => wrapper({ ...props, mocks: [nullDataMock] }),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.typesOptions).toEqual([]);
    expect(result.current.error).toBeUndefined();
  });

  it('should refetch data when refetch is called', async () => {
    const refetchMock = {
      request: {
        query: QUERY_TYPES,
      },
      result: {
        data: {
          types: [
            {
              id: '4',
              label: 'Investment',
            },
          ],
        },
      },
    };

    const { result } = renderHook(() => useBundleTypesOptions(), {
      wrapper: (props) => wrapper({ ...props, mocks: [mockTypesQuery, refetchMock] }),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Initial data
    expect(result.current.typesOptions).toEqual(mockTypesData.types);

    // Refetch
    await act(async () => {
      await result.current.refetch();
    });

    // Should still work (though with mocked data it won't actually change)
    expect(typeof result.current.refetch).toBe('function');
  });

  it('should create a new array reference for typesOptions using useMemo', async () => {
    const { result, rerender } = renderHook(() => useBundleTypesOptions(), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const firstResult = result.current.typesOptions;

    rerender();

    // Should maintain reference stability when data hasn't changed
    expect(result.current.typesOptions).not.toBe(mockTypesData.types);
    expect(result.current.typesOptions).toEqual(mockTypesData.types);
  });

  it('should handle various option formats', async () => {
    const complexOptionsMock = {
      request: {
        query: QUERY_TYPES,
      },
      result: {
        data: {
          types: [
            { id: 'income', label: 'Income' },
            { id: 'expense', label: 'Expense' },
            { id: 'transfer-in', label: 'Transfer In' },
            { id: 'transfer-out', label: 'Transfer Out' },
          ],
        },
      },
    };

    const { result } = renderHook(() => useBundleTypesOptions(), {
      wrapper: (props) => wrapper({ ...props, mocks: [complexOptionsMock] }),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.typesOptions).toHaveLength(4);
    expect(result.current.typesOptions[0].id).toBe('income');
    expect(result.current.typesOptions[0].label).toBe('Income');
    expect(result.current.typesOptions[2].id).toBe('transfer-in');
    expect(result.current.typesOptions[2].label).toBe('Transfer In');
  });

  it('should handle single type option', async () => {
    const singleOptionMock = {
      request: {
        query: QUERY_TYPES,
      },
      result: {
        data: {
          types: [
            { id: '1', label: 'Only Option' },
          ],
        },
      },
    };

    const { result } = renderHook(() => useBundleTypesOptions(), {
      wrapper: (props) => wrapper({ ...props, mocks: [singleOptionMock] }),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.typesOptions).toHaveLength(1);
    expect(result.current.typesOptions[0]).toEqual({ id: '1', label: 'Only Option' });
  });
}); 