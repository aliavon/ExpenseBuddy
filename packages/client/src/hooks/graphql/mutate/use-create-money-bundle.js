import {useMutation, gql} from '@apollo/client';

const CREATE_MONEY_BUNDLE_MUTATION = gql`
  mutation createMoneyBundleMutation(
    $currency: String!,
    $amount: Int!,
    $storage: String!,
    $type: String!,
    $description: String
  ) {
    moneyBundle: createMoneyBundle(
      currency: $currency
      description: $description
      amount: $amount
      storage: $storage
      type: $type
    ) {
      id
      currency
      description
      amount
      storage
      createdAt
    }
  }
`;

const useCreateMoneyBundle = ({onCompleted}) => {
  const [mutate, {error, loading}] = useMutation(CREATE_MONEY_BUNDLE_MUTATION, {onCompleted});

  const createMoneyBundle = variables => mutate({variables});

  return {
    createMoneyBundle,
    loading,
    error,
  };
};
export default useCreateMoneyBundle;
