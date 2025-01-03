import {useMutation, gql} from '@apollo/client';

const DELETE_MONEY_BUNDLE_MUTATION = gql`
  mutation deleteMoneyBundleMutation( $id: ID!) {
    deletedMoneyBundle: deleteMoneyBundle(id: $id) {
      id
      currency
      description
      amount
      storage
      createdAt
      updatedAt
      deletedAt
    }
  }
`;

const useDeleteMoneyBundle = ({onCompleted}) => {
  const [mutate, {error, loading}] = useMutation(DELETE_MONEY_BUNDLE_MUTATION, {onCompleted});

  const deleteMoneyBundle = id => mutate({variables: {id}});

  return {
    deleteMoneyBundle,
    loading,
    error,
  };
};
export default useDeleteMoneyBundle;
