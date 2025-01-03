import React from 'react';
import {useQuery, gql} from '@apollo/client';

const QUERY_FEED = gql`
  query Feed($page: Int!, $perPage: Int!) {
    feed(page: $page, perPage: $perPage) {
      page
      feeds {
        id
        createdAt
        to
        from
        transferredTo
      }
    }
  }
`;

const useFeed = () => {
  const [page, setPage] = React.useState(0);
  const {data, loading, error, fetchMore} = useQuery(QUERY_FEED, {
    variables: {
      page: 0,
      perPage: 10,
    },
    notifyOnNetworkStatusChange: true,
  });

  const loadMore = () => {
    fetchMore({
      variables: {
        page: page + 1,
        perPage: 10,
      },
      updateQuery: (prev, {fetchMoreResult}) => {
        if (!fetchMoreResult) {
          return prev;
        }

        return {
          feed: {
            ...fetchMoreResult.feed,
            feeds: [...prev.feed.feeds, ...fetchMoreResult.feed.feeds],
          },
        };
      },
    });
    setPage(prev => prev + 1);
  };

  return {
    feed: data?.feed?.feeds || [],
    loading,
    error,
    loadMore,
  };
};
export default useFeed;
