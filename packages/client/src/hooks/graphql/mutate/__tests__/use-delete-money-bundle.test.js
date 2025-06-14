import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import useDeleteMoneyBundle, { DELETE_MONEY_BUNDLE_MUTATION } from '../use-delete-money-bundle';

const mockDeletedBundle = {
  id: '1',
  currency: 'USD',
  description: 'Deleted bundle',
  amount: 1500,
  storage: 'Bank',
  createdAt: '2023-01-01T10:00:00Z',
  updatedAt: '2023-01-02T10:00:00Z',
  deletedAt: '2023-01-03T10:00:00Z',
};

const mockDeleteMutation = {
  request: {
    query: DELETE_MONEY_BUNDLE_MUTATION,
    variables: { id: '1' },
  },
  result: {
    data: {
      deletedMoneyBundle: mockDeletedBundle,
    },
  },
};

const mockDeleteMutationError = {
  request: {
    query: DELETE_MONEY_BUNDLE_MUTATION,
    variables: { id: '1' },
  },
  error: new Error('Failed to delete money bundle'),
};

const mockDeleteMutationLoading = {
  request: {
    query: DELETE_MONEY_BUNDLE_MUTATION,
    variables: { id: '1' },
  },
  delay: 100,
  result: {
    data: {
      deletedMoneyBundle: mockDeletedBundle,
    },
  },
};

const wrapper = ({ children, mocks = [mockDeleteMutation] }) => (
  <MockedProvider mocks={mocks} addTypename={false}>
    {children}
  </MockedProvider>
);

describe('useDeleteMoneyBundle', () => {
  it('should initialize with correct default state', () => {
    const onCompleted = jest.fn();
    const { result } = renderHook(() => useDeleteMoneyBundle({ onCompleted }), {
      wrapper,
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(typeof result.current.deleteMoneyBundle).toBe('function');
  });

  it('should successfully delete money bundle', async () => {
    const onCompleted = jest.fn();
    const { result } = renderHook(() => useDeleteMoneyBundle({ onCompleted }), {
      wrapper,
    });

    await act(async () => {
      await result.current.deleteMoneyBundle('1');
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(onCompleted).toHaveBeenCalledWith({
      deletedMoneyBundle: mockDeletedBundle,
    }, expect.anything());
  });

  it('should handle mutation error', async () => {
    const onCompleted = jest.fn();
    const { result } = renderHook(() => useDeleteMoneyBundle({ onCompleted }), {
      wrapper: (props) => wrapper({ ...props, mocks: [mockDeleteMutationError] }),
    });

    await act(async () => {
      try {
        await result.current.deleteMoneyBundle('1');
      } catch (error) {
        // Expected to throw
      }
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeDefined();
    expect(result.current.error.message).toBe('Failed to delete money bundle');
    expect(onCompleted).not.toHaveBeenCalled();
  });

  it('should show loading state during mutation', async () => {
    const onCompleted = jest.fn();
    const { result } = renderHook(() => useDeleteMoneyBundle({ onCompleted }), {
      wrapper: (props) => wrapper({ ...props, mocks: [mockDeleteMutationLoading] }),
    });

    let mutationPromise;
    act(() => {
      mutationPromise = result.current.deleteMoneyBundle('1');
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

  it('should handle different ID formats', async () => {
    const onCompleted = jest.fn();

    const numericIdMock = {
      request: {
        query: DELETE_MONEY_BUNDLE_MUTATION,
        variables: { id: 123 },
      },
      result: {
        data: {
          deletedMoneyBundle: {
            ...mockDeletedBundle,
            id: 123,
          },
        },
      },
    };

    const { result } = renderHook(() => useDeleteMoneyBundle({ onCompleted }), {
      wrapper: (props) => wrapper({ ...props, mocks: [numericIdMock] }),
    });

    await act(async () => {
      await result.current.deleteMoneyBundle(123);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(onCompleted).toHaveBeenCalled();
  });

  it('should handle UUID format IDs', async () => {
    const onCompleted = jest.fn();
    const uuid = '550e8400-e29b-41d4-a716-446655440000';

    const uuidMock = {
      request: {
        query: DELETE_MONEY_BUNDLE_MUTATION,
        variables: { id: uuid },
      },
      result: {
        data: {
          deletedMoneyBundle: {
            ...mockDeletedBundle,
            id: uuid,
          },
        },
      },
    };

    const { result } = renderHook(() => useDeleteMoneyBundle({ onCompleted }), {
      wrapper: (props) => wrapper({ ...props, mocks: [uuidMock] }),
    });

    await act(async () => {
      await result.current.deleteMoneyBundle(uuid);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(onCompleted).toHaveBeenCalled();
  });

  it('should handle network errors', async () => {
    const onCompleted = jest.fn();
    const networkErrorMock = {
      request: {
        query: DELETE_MONEY_BUNDLE_MUTATION,
        variables: { id: '1' },
      },
      networkError: new Error('Network connection failed'),
    };

    const { result } = renderHook(() => useDeleteMoneyBundle({ onCompleted }), {
      wrapper: (props) => wrapper({ ...props, mocks: [networkErrorMock] }),
    });

    await act(async () => {
      try {
        await result.current.deleteMoneyBundle('1');
      } catch (error) {
        // Expected network error
      }
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeDefined();
    expect(onCompleted).not.toHaveBeenCalled();
  });

  it('should work without onCompleted callback', async () => {
    const { result } = renderHook(() => useDeleteMoneyBundle({}), {
      wrapper,
    });

    await act(async () => {
      await result.current.deleteMoneyBundle('1');
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    // Should not throw even without callback
  });

  it('should handle non-existent ID', async () => {
    const onCompleted = jest.fn();
    const notFoundMock = {
      request: {
        query: DELETE_MONEY_BUNDLE_MUTATION,
        variables: { id: 'non-existent' },
      },
      error: new Error('Money bundle not found'),
    };

    const { result } = renderHook(() => useDeleteMoneyBundle({ onCompleted }), {
      wrapper: (props) => wrapper({ ...props, mocks: [notFoundMock] }),
    });

    await act(async () => {
      try {
        await result.current.deleteMoneyBundle('non-existent');
      } catch (error) {
        // Expected error
      }
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeDefined();
    expect(result.current.error.message).toBe('Money bundle not found');
    expect(onCompleted).not.toHaveBeenCalled();
  });

  it('should handle permission errors', async () => {
    const onCompleted = jest.fn();
    const permissionErrorMock = {
      request: {
        query: DELETE_MONEY_BUNDLE_MUTATION,
        variables: { id: '1' },
      },
      error: new Error('Permission denied: Cannot delete this money bundle'),
    };

    const { result } = renderHook(() => useDeleteMoneyBundle({ onCompleted }), {
      wrapper: (props) => wrapper({ ...props, mocks: [permissionErrorMock] }),
    });

    await act(async () => {
      try {
        await result.current.deleteMoneyBundle('1');
      } catch (error) {
        // Expected permission error
      }
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeDefined();
    expect(result.current.error.message).toContain('Permission denied');
    expect(onCompleted).not.toHaveBeenCalled();
  });

  it('should handle empty or null ID', async () => {
    const onCompleted = jest.fn();
    const emptyIdMock = {
      request: {
        query: DELETE_MONEY_BUNDLE_MUTATION,
        variables: { id: '' },
      },
      error: new Error('ID cannot be empty'),
    };

    const { result } = renderHook(() => useDeleteMoneyBundle({ onCompleted }), {
      wrapper: (props) => wrapper({ ...props, mocks: [emptyIdMock] }),
    });

    await act(async () => {
      try {
        await result.current.deleteMoneyBundle('');
      } catch (error) {
        // Expected validation error
      }
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeDefined();
    expect(onCompleted).not.toHaveBeenCalled();
  });

  it('should handle server errors', async () => {
    const onCompleted = jest.fn();
    const serverErrorMock = {
      request: {
        query: DELETE_MONEY_BUNDLE_MUTATION,
        variables: { id: '1' },
      },
      error: new Error('Internal server error'),
    };

    const { result } = renderHook(() => useDeleteMoneyBundle({ onCompleted }), {
      wrapper: (props) => wrapper({ ...props, mocks: [serverErrorMock] }),
    });

    await act(async () => {
      try {
        await result.current.deleteMoneyBundle('1');
      } catch (error) {
        // Expected server error
      }
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeDefined();
    expect(result.current.error.message).toBe('Internal server error');
    expect(onCompleted).not.toHaveBeenCalled();
  });

  it('should return deleted bundle with correct structure', async () => {
    const onCompleted = jest.fn();
    const { result } = renderHook(() => useDeleteMoneyBundle({ onCompleted }), {
      wrapper,
    });

    await act(async () => {
      await result.current.deleteMoneyBundle('1');
    });

    expect(onCompleted).toHaveBeenCalledWith({
      deletedMoneyBundle: expect.objectContaining({
        id: expect.any(String),
        currency: expect.any(String),
        amount: expect.any(Number),
        storage: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        deletedAt: expect.any(String),
      }),
    }, expect.anything());
  });
}); 