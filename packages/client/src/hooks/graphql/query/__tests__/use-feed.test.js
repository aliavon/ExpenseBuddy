import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import useFeed, { QUERY_FEED } from '../use-feed';

const mockFeedData = {
  feed: {
    page: 0,
    feeds: [
      {
        id: '1',
        createdAt: '2023-01-01',
        to: 'Bank',
        from: 'Wallet',
        transferredTo: null,
      },
      {
        id: '2',
        createdAt: '2023-01-02',
        to: 'Cash',
        from: 'Bank',
        transferredTo: null,
      },
    ],
  },
};

const mockFeedQuery = {
  request: {
    query: QUERY_FEED,
    variables: {
      page: 0,
      perPage: 10,
    },
  },
  result: {
    data: mockFeedData,
  },
};

const mockFeedQueryError = {
  request: {
    query: QUERY_FEED,
    variables: {
      page: 0,
      perPage: 10,
    },
  },
  error: new Error('Network error'),
};

const mockFeedQueryLoading = {
  request: {
    query: QUERY_FEED,
    variables: {
      page: 0,
      perPage: 10,
    },
  },
  delay: 100,
  result: {
    data: mockFeedData,
  },
};

const mockFeedQueryNextPage = {
  request: {
    query: QUERY_FEED,
    variables: {
      page: 1,
      perPage: 10,
    },
  },
  result: {
    data: {
      feed: {
        page: 1,
        feeds: [
          {
            id: '3',
            createdAt: '2023-01-03',
            to: 'Store',
            from: 'Cash',
            transferredTo: null,
          },
        ],
      },
    },
  },
};

const wrapper = ({ children, mocks = [mockFeedQuery] }) => (
  <MockedProvider mocks={mocks} addTypename={false}>
    {children}
  </MockedProvider>
);

describe('useFeed', () => {
  it('should return loading state initially', () => {
    const { result } = renderHook(() => useFeed(), {
      wrapper: (props) => wrapper({ ...props, mocks: [mockFeedQueryLoading] }),
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.feed).toEqual([]);
    expect(result.current.error).toBeUndefined();
  });

  it('should return feed data on successful query', async () => {
    const { result } = renderHook(() => useFeed(), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.feed).toEqual(mockFeedData.feed.feeds);
    expect(result.current.error).toBeUndefined();
    expect(typeof result.current.loadMore).toBe('function');
  });

  it('should return error state on query failure', async () => {
    const { result } = renderHook(() => useFeed(), {
      wrapper: (props) => wrapper({ ...props, mocks: [mockFeedQueryError] }),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.feed).toEqual([]);
    expect(result.current.error).toBeDefined();
  });

  it('should load more data when loadMore is called', async () => {
    const { result } = renderHook(() => useFeed(), {
      wrapper: (props) => wrapper({ 
        ...props, 
        mocks: [mockFeedQuery, mockFeedQueryNextPage] 
      }),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Initial data loaded
    expect(result.current.feed).toEqual(mockFeedData.feed.feeds);

    // Load more data
    await act(async () => {
      result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.feed).toHaveLength(3);
    });

    // Should have combined data from both pages
    expect(result.current.feed[2].id).toBe('3');
  });

  it('should handle empty feed data', async () => {
    const emptyMock = {
      request: {
        query: QUERY_FEED,
        variables: {
          page: 0,
          perPage: 10,
        },
      },
      result: {
        data: {
          feed: {
            page: 0,
            feeds: [],
          },
        },
      },
    };

    const { result } = renderHook(() => useFeed(), {
      wrapper: (props) => wrapper({ ...props, mocks: [emptyMock] }),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.feed).toEqual([]);
    expect(result.current.error).toBeUndefined();
  });
}); 