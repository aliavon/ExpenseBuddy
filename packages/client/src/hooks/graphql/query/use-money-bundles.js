import {useMemo} from 'react';
import {useQuery, gql} from '@apollo/client';

const QUERY_MONEY_BUNDLES = gql`
  query MoneyBundles {
    moneyBundles {
      id
      currency
      description
      amount
      storage
      type
      createdAt
      updatedAt
      deletedAt
    }
  }
`;

const useMoneyBundles = () => {
  const {data, loading, error, refetch} = useQuery(QUERY_MONEY_BUNDLES, {notifyOnNetworkStatusChange: true});

  const moneyBundles = useMemo(() => [...(data?.moneyBundles || [])], [data]);

  return {
    moneyBundles,
    loading,
    error,
    refetch,
  };
};
export default useMoneyBundles;
