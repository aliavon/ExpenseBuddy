import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import useUpdateMoneyBundle, { UPDATE_MONEY_BUNDLE_MUTATION } from '../use-update-money-bundle';

const mockUpdateInput = {
  id: '1',
  amount: 2000,
  storage: 'Bank',
  description: 'Updated salary',
  type: 'income',
  transfer: [
    {
      to: 'Savings',
      amount: 500,
    },
  ],
};

const mockUpdatedBundle = {
  id: '1',
  currency: 'USD',
  description: 'Updated salary',
  amount: 2000,
  storage: 'Bank',
  createdAt: '2023-01-01T10:00:00Z',
  type: 'income',
};

const mockUpdateMutation = {
  request: {
    query: UPDATE_MONEY_BUNDLE_MUTATION,
    variables: mockUpdateInput,
  },
  result: {
    data: {
      moneyBundle: mockUpdatedBundle,
    },
  },
};

const mockUpdateMutationError = {
  request: {
    query: UPDATE_MONEY_BUNDLE_MUTATION,
    variables: mockUpdateInput,
  },
  error: new Error('Failed to update money bundle'),
};

const mockUpdateMutationLoading = {
  request: {
    query: UPDATE_MONEY_BUNDLE_MUTATION,
    variables: mockUpdateInput,
  },
  delay: 100,
  result: {
    data: {
      moneyBundle: mockUpdatedBundle,
    },
  },
};

const wrapper = ({ children, mocks = [mockUpdateMutation] }) => (
  <MockedProvider mocks={mocks} addTypename={false}>
    {children}
  </MockedProvider>
);

describe('useUpdateMoneyBundle', () => {
  it('should initialize with correct default state', () => {
    const onCompleted = jest.fn();
    const { result } = renderHook(() => useUpdateMoneyBundle({ onCompleted }), {
      wrapper,
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(typeof result.current.updateMoneyBundle).toBe('function');
  });

  it('should successfully update money bundle', async () => {
    const onCompleted = jest.fn();
    const { result } = renderHook(() => useUpdateMoneyBundle({ onCompleted }), {
      wrapper,
    });

    await act(async () => {
      await result.current.updateMoneyBundle(mockUpdateInput);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(onCompleted).toHaveBeenCalledWith({
      moneyBundle: mockUpdatedBundle,
    }, expect.anything());
  });

  it('should handle mutation error', async () => {
    const onCompleted = jest.fn();
    const { result } = renderHook(() => useUpdateMoneyBundle({ onCompleted }), {
      wrapper: (props) => wrapper({ ...props, mocks: [mockUpdateMutationError] }),
    });

    await act(async () => {
      try {
        await result.current.updateMoneyBundle(mockUpdateInput);
      } catch (error) {
        // Expected to throw
      }
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeDefined();
    expect(result.current.error.message).toBe('Failed to update money bundle');
    expect(onCompleted).not.toHaveBeenCalled();
  });

  it('should show loading state during mutation', async () => {
    const onCompleted = jest.fn();
    const { result } = renderHook(() => useUpdateMoneyBundle({ onCompleted }), {
      wrapper: (props) => wrapper({ ...props, mocks: [mockUpdateMutationLoading] }),
    });

    let mutationPromise;
    act(() => {
      mutationPromise = result.current.updateMoneyBundle(mockUpdateInput);
    });

    // Should be loading during mutation
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeUndefined();

    await act(async () => {
      await mutationPromise;
    });

    // Should complete successfully
    expect(result.current.loading).toBe(false);
    expect(onCompleted).toHaveBeenCalled();
  });

  it('should handle update without optional fields', async () => {
    const onCompleted = jest.fn();
    
    const minimalUpdateInput = {
      id: '1',
      amount: 1000,
    };

    const minimalUpdateMock = {
      request: {
        query: UPDATE_MONEY_BUNDLE_MUTATION,
        variables: minimalUpdateInput,
      },
      result: {
        data: {
          moneyBundle: {
            ...mockUpdatedBundle,
            amount: 1000,
            storage: null,
            description: null,
            type: null,
          },
        },
      },
    };

    const { result } = renderHook(() => useUpdateMoneyBundle({ onCompleted }), {
      wrapper: (props) => wrapper({ ...props, mocks: [minimalUpdateMock] }),
    });

    await act(async () => {
      await result.current.updateMoneyBundle(minimalUpdateInput);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(onCompleted).toHaveBeenCalled();
  });

  it('should handle update with transfers', async () => {
    const onCompleted = jest.fn();
    
    const updateWithTransfers = {
      id: '1',
      amount: 3000,
      transfer: [
        { to: 'Savings', amount: 1000 },
        { to: 'Investment', amount: 500 },
      ],
    };

    const transferUpdateMock = {
      request: {
        query: UPDATE_MONEY_BUNDLE_MUTATION,
        variables: updateWithTransfers,
      },
      result: {
        data: {
          moneyBundle: {
            ...mockUpdatedBundle,
            amount: 3000,
          },
        },
      },
    };

    const { result } = renderHook(() => useUpdateMoneyBundle({ onCompleted }), {
      wrapper: (props) => wrapper({ ...props, mocks: [transferUpdateMock] }),
    });

    await act(async () => {
      await result.current.updateMoneyBundle(updateWithTransfers);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(onCompleted).toHaveBeenCalled();
  });

  it('should handle update with empty transfers array', async () => {
    const onCompleted = jest.fn();
    
    const updateWithEmptyTransfers = {
      id: '1',
      amount: 1500,
      transfer: [],
    };

    const emptyTransferMock = {
      request: {
        query: UPDATE_MONEY_BUNDLE_MUTATION,
        variables: updateWithEmptyTransfers,
      },
      result: {
        data: {
          moneyBundle: {
            ...mockUpdatedBundle,
            amount: 1500,
          },
        },
      },
    };

    const { result } = renderHook(() => useUpdateMoneyBundle({ onCompleted }), {
      wrapper: (props) => wrapper({ ...props, mocks: [emptyTransferMock] }),
    });

    await act(async () => {
      await result.current.updateMoneyBundle(updateWithEmptyTransfers);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(onCompleted).toHaveBeenCalled();
  });

  it('should handle network errors', async () => {
    const onCompleted = jest.fn();
    const networkErrorMock = {
      request: {
        query: UPDATE_MONEY_BUNDLE_MUTATION,
        variables: mockUpdateInput,
      },
      networkError: new Error('Network connection failed'),
    };

    const { result } = renderHook(() => useUpdateMoneyBundle({ onCompleted }), {
      wrapper: (props) => wrapper({ ...props, mocks: [networkErrorMock] }),
    });

    await act(async () => {
      try {
        await result.current.updateMoneyBundle(mockUpdateInput);
      } catch (error) {
        // Expected network error
      }
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeDefined();
    expect(onCompleted).not.toHaveBeenCalled();
  });

  it('should work without onCompleted callback', async () => {
    const { result } = renderHook(() => useUpdateMoneyBundle({}), {
      wrapper,
    });

    await act(async () => {
      await result.current.updateMoneyBundle(mockUpdateInput);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    // Should not throw even without callback
  });

  it('should handle zero amount update', async () => {
    const onCompleted = jest.fn();
    
    const zeroAmountInput = {
      id: '1',
      amount: 0,
      description: 'Zero amount transaction',
    };

    const zeroAmountMock = {
      request: {
        query: UPDATE_MONEY_BUNDLE_MUTATION,
        variables: zeroAmountInput,
      },
      result: {
        data: {
          moneyBundle: {
            ...mockUpdatedBundle,
            amount: 0,
            description: 'Zero amount transaction',
          },
        },
      },
    };

    const { result } = renderHook(() => useUpdateMoneyBundle({ onCompleted }), {
      wrapper: (props) => wrapper({ ...props, mocks: [zeroAmountMock] }),
    });

    await act(async () => {
      await result.current.updateMoneyBundle(zeroAmountInput);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(onCompleted).toHaveBeenCalled();
  });

  it('should handle validation errors', async () => {
    const onCompleted = jest.fn();
    const validationErrorMock = {
      request: {
        query: UPDATE_MONEY_BUNDLE_MUTATION,
        variables: { id: '1', amount: -1000 }, // Invalid amount
      },
      error: new Error('Validation failed: Amount cannot be negative'),
    };

    const { result } = renderHook(() => useUpdateMoneyBundle({ onCompleted }), {
      wrapper: (props) => wrapper({ ...props, mocks: [validationErrorMock] }),
    });

    await act(async () => {
      try {
        await result.current.updateMoneyBundle({ id: '1', amount: -1000 });
      } catch (error) {
        // Expected validation error
      }
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeDefined();
    expect(result.current.error.message).toContain('Validation failed');
    expect(onCompleted).not.toHaveBeenCalled();
  });

  it('should handle missing required ID', async () => {
    const onCompleted = jest.fn();
    const missingIdMock = {
      request: {
        query: UPDATE_MONEY_BUNDLE_MUTATION,
        variables: { amount: 1000 }, // Missing required ID
      },
      error: new Error('ID is required for update'),
    };

    const { result } = renderHook(() => useUpdateMoneyBundle({ onCompleted }), {
      wrapper: (props) => wrapper({ ...props, mocks: [missingIdMock] }),
    });

    await act(async () => {
      try {
        await result.current.updateMoneyBundle({ amount: 1000 });
      } catch (error) {
        // Expected validation error
      }
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeDefined();
    expect(onCompleted).not.toHaveBeenCalled();
  });
}); 