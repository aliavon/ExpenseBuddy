
import {useMemo} from 'react';
import {useQuery, gql} from '@apollo/client';

const QUERY_MONEY_SUMMARY = gql`
  query MoneySummary {
    summary: moneySummary {
      amount
      currency
    }
  }
`;

const useMoneySummary = () => {
  const {data, loading, error, refetch} = useQuery(QUERY_MONEY_SUMMARY, {notifyOnNetworkStatusChange: true});

  const summary = useMemo(() => ([...(data?.summary || [])]), [data]);

  return {
    summary,
    loading,
    error,
    refetch,
  };
};
export default useMoneySummary;
