import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import useCreateMoneyBundle, { CREATE_MONEY_BUNDLE_MUTATION } from '../use-create-money-bundle';

const mockCreateInput = {
  currency: 'USD',
  amount: 1500,
  storage: 'Bank',
  type: 'income',
  description: 'Salary payment',
};

const mockCreatedBundle = {
  id: '1',
  currency: 'USD',
  description: 'Salary payment',
  amount: 1500,
  storage: 'Bank',
  createdAt: '2023-01-01T10:00:00Z',
};

const mockCreateMutation = {
  request: {
    query: CREATE_MONEY_BUNDLE_MUTATION,
    variables: mockCreateInput,
  },
  result: {
    data: {
      moneyBundle: mockCreatedBundle,
    },
  },
};

const mockCreateMutationError = {
  request: {
    query: CREATE_MONEY_BUNDLE_MUTATION,
    variables: mockCreateInput,
  },
  error: new Error('Failed to create money bundle'),
};

const mockCreateMutationLoading = {
  request: {
    query: CREATE_MONEY_BUNDLE_MUTATION,
    variables: mockCreateInput,
  },
  delay: 100,
  result: {
    data: {
      moneyBundle: mockCreatedBundle,
    },
  },
};

const wrapper = ({ children, mocks = [mockCreateMutation] }) => (
  <MockedProvider mocks={mocks} addTypename={false}>
    {children}
  </MockedProvider>
);

describe('useCreateMoneyBundle', () => {
  it('should initialize with correct default state', () => {
    const onCompleted = jest.fn();
    const { result } = renderHook(() => useCreateMoneyBundle({ onCompleted }), {
      wrapper,
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(typeof result.current.createMoneyBundle).toBe('function');
  });

  it('should successfully create money bundle', async () => {
    const onCompleted = jest.fn();
    const { result } = renderHook(() => useCreateMoneyBundle({ onCompleted }), {
      wrapper,
    });

    await act(async () => {
      await result.current.createMoneyBundle(mockCreateInput);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(onCompleted).toHaveBeenCalledWith({
      moneyBundle: mockCreatedBundle,
    }, expect.anything());
  });

  it('should handle mutation error', async () => {
    const onCompleted = jest.fn();
    const { result } = renderHook(() => useCreateMoneyBundle({ onCompleted }), {
      wrapper: (props) => wrapper({ ...props, mocks: [mockCreateMutationError] }),
    });

    await act(async () => {
      try {
        await result.current.createMoneyBundle(mockCreateInput);
      } catch (error) {
        // Expected to throw
      }
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeDefined();
    expect(result.current.error.message).toBe('Failed to create money bundle');
    expect(onCompleted).not.toHaveBeenCalled();
  });

  it('should show loading state during mutation', async () => {
    const onCompleted = jest.fn();
    const { result } = renderHook(() => useCreateMoneyBundle({ onCompleted }), {
      wrapper: (props) => wrapper({ ...props, mocks: [mockCreateMutationLoading] }),
    });

    let mutationPromise;
    act(() => {
      mutationPromise = result.current.createMoneyBundle(mockCreateInput);
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

  it('should handle different input variations', async () => {
    const onCompleted = jest.fn();
    
    const variationInput = {
      currency: 'EUR',
      amount: 0,
      storage: 'Cash',
      type: 'expense',
      description: '',
    };

    const variationMock = {
      request: {
        query: CREATE_MONEY_BUNDLE_MUTATION,
        variables: variationInput,
      },
      result: {
        data: {
          moneyBundle: {
            ...mockCreatedBundle,
            currency: 'EUR',
            amount: 0,
            storage: 'Cash',
            description: '',
          },
        },
      },
    };

    const { result } = renderHook(() => useCreateMoneyBundle({ onCompleted }), {
      wrapper: (props) => wrapper({ ...props, mocks: [variationMock] }),
    });

    await act(async () => {
      await result.current.createMoneyBundle(variationInput);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(onCompleted).toHaveBeenCalled();
  });

  it('should handle missing optional description', async () => {
    const onCompleted = jest.fn();
    
    const inputWithoutDescription = {
      currency: 'USD',
      amount: 1000,
      storage: 'Bank',
      type: 'income',
    };

    const mockWithoutDescription = {
      request: {
        query: CREATE_MONEY_BUNDLE_MUTATION,
        variables: inputWithoutDescription,
      },
      result: {
        data: {
          moneyBundle: {
            ...mockCreatedBundle,
            description: null,
          },
        },
      },
    };

    const { result } = renderHook(() => useCreateMoneyBundle({ onCompleted }), {
      wrapper: (props) => wrapper({ ...props, mocks: [mockWithoutDescription] }),
    });

    await act(async () => {
      await result.current.createMoneyBundle(inputWithoutDescription);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(onCompleted).toHaveBeenCalled();
  });

  it('should handle network errors', async () => {
    const onCompleted = jest.fn();
    const networkErrorMock = {
      request: {
        query: CREATE_MONEY_BUNDLE_MUTATION,
        variables: mockCreateInput,
      },
      networkError: new Error('Network connection failed'),
    };

    const { result } = renderHook(() => useCreateMoneyBundle({ onCompleted }), {
      wrapper: (props) => wrapper({ ...props, mocks: [networkErrorMock] }),
    });

    await act(async () => {
      try {
        await result.current.createMoneyBundle(mockCreateInput);
      } catch (error) {
        // Expected network error
      }
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeDefined();
    expect(onCompleted).not.toHaveBeenCalled();
  });

  it('should work without onCompleted callback', async () => {
    const { result } = renderHook(() => useCreateMoneyBundle({}), {
      wrapper,
    });

    await act(async () => {
      await result.current.createMoneyBundle(mockCreateInput);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    // Should not throw even without callback
  });

  it('should handle large amounts', async () => {
    const onCompleted = jest.fn();
    
    const largeAmountInput = {
      currency: 'USD',
      amount: 999999999,
      storage: 'Investment',
      type: 'income',
      description: 'Large investment',
    };

    const largeAmountMock = {
      request: {
        query: CREATE_MONEY_BUNDLE_MUTATION,
        variables: largeAmountInput,
      },
      result: {
        data: {
          moneyBundle: {
            ...mockCreatedBundle,
            amount: 999999999,
            description: 'Large investment',
          },
        },
      },
    };

    const { result } = renderHook(() => useCreateMoneyBundle({ onCompleted }), {
      wrapper: (props) => wrapper({ ...props, mocks: [largeAmountMock] }),
    });

    await act(async () => {
      await result.current.createMoneyBundle(largeAmountInput);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(onCompleted).toHaveBeenCalled();
  });
}); 