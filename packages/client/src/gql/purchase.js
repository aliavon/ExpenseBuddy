import {gql} from '@apollo/client';

export const ADD_PURCHASES_QUERY = gql`
  mutation AddPurchasesQuery($purchases: [PurchaseInput!]!) {
    addPurchases(purchases: $purchases) {
      id
      name
      quantity
      unit
      price
      category
      discount
      date
      note
    }
  }
`;
