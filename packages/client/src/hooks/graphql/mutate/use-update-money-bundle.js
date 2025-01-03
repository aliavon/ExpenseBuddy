import {useMutation, gql} from '@apollo/client';

const UPDATE_MONEY_BUNDLE_MUTATION = gql`
  mutation updateMoneyBundle(
    $id: ID!
    $amount: Int!,
    $storage: String
    $description: String
    $type: String
    $transfer: [TransferMoneyBundle!]
  ) {
    moneyBundle: updateMoneyBundle(
      id: $id
      amount: $amount
      description: $description
      storage: $storage
      type: $type
      transfer: $transfer
    ) {
      id
      currency
      description
      amount
      storage
      createdAt
      type
    }
  }
`;

const useUpdateMoneyBundle = ({onCompleted}) => {
  const [mutate, {error, loading}] =useMutation(UPDATE_MONEY_BUNDLE_MUTATION, {onCompleted});

  const updateMoneyBundle = variables => mutate({variables});

  return {
    updateMoneyBundle,
    loading,
    error,
  };
};
export default useUpdateMoneyBundle;
